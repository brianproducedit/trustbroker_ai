"""
Repository Metadata Adapter for GitHub Repositories.
Inspects public repo metadata, root directory tree and README via GitHub API.
Does not clone arbitrary repositories into the web server process.

IMPORTANT: This adapter establishes repository FACTS (exists, language, files).
It does NOT assess whether the repository satisfies the acceptance criterion —
that semantic evaluation requires the AI evaluator or human review.
"""
import base64
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse
import httpx

logger = logging.getLogger("trustbroker.verification.repo_meta")

# In-memory LRU cache to respect GitHub unauthenticated rate limits (60 req/hr)
_REPO_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes


def parse_github_coords(repo_url: str) -> Optional[Tuple[str, str]]:
    """Parse (owner, repo) from GitHub URL.

    Requires the hostname to be exactly ``github.com``.  Deceptive hostnames
    such as ``evilgithub.com`` or ``github.com.evil.com`` are rejected.
    Returns None for GitLab, Bitbucket, and all non-GitHub URLs.
    """
    clean = (repo_url or "").strip().rstrip("/")
    if not clean:
        return None

    # Normalise: add scheme so urlparse can extract hostname reliably
    normalised = clean if "://" in clean else f"https://{clean}"
    try:
        parsed = urlparse(normalised)
        hostname = (parsed.hostname or "").lower()
    except Exception:
        hostname = ""

    # Exact hostname check — must be github.com (not evilgithub.com, github.com.evil, …)
    if hostname != "github.com":
        return None

    match = re.search(r"github\.com[/:](\w[\w.-]*)/(\w[\w.-]*)", clean, re.IGNORECASE)
    if match:
        owner = match.group(1)
        repo = match.group(2).removesuffix(".git")
        return owner, repo
    return None


def inspect_repository(repo_url: str, timeout: float = 6.0) -> Dict[str, Any]:
    """Inspect repository metadata, directory structure and README.

    Returns factual observations about the repository.  A successful API
    response means the repository EXISTS — it does NOT mean the acceptance
    criterion is satisfied.  The caller (scoring / AI evaluator) must make
    the semantic pass/fail decision.
    """
    clean_url = (repo_url or "").strip()
    coords = parse_github_coords(clean_url)

    if not coords:
        # Non-GitHub URL (GitLab, Bitbucket, deceptive hostname, malformed)
        is_gitlab = bool(re.search(r"gitlab\.com", clean_url, re.IGNORECASE))
        is_bitbucket = bool(re.search(r"bitbucket\.org", clean_url, re.IGNORECASE))
        is_other_git = is_gitlab or is_bitbucket
        return {
            "adapter": "repo_meta_unsupported",
            "is_github": False,
            "exists": None,
            "passed": False,
            "needs_review": is_other_git,
            "owner": None,
            "repo": None,
            "files_found": [],
            "readme_snippet": None,
            "citation": (
                f"Non-GitHub Git repo: {clean_url[:60]} (needs manual review)" if is_other_git
                else f"Not a supported Git repository URL: {clean_url[:60]}"
            ),
            "error": (
                "GitLab/Bitbucket repositories are not inspected by this adapter — manual review required."
                if is_other_git else
                "Not a recognised GitHub repository URL."
            ),
        }

    owner, repo = coords
    # Validate owner and repo strings against path traversal or injection
    if not re.match(r"^[a-zA-Z0-9._-]+$", owner) or not re.match(r"^[a-zA-Z0-9._-]+$", repo):
        return {
            "adapter": "github_api",
            "is_github": True,
            "exists": False,
            "passed": False,
            "needs_review": False,
            "owner": None,
            "repo": None,
            "files_found": [],
            "readme_snippet": None,
            "citation": "Invalid repository owner or name format.",
            "error": "Repository path contains invalid characters.",
        }

    cache_key = f"{owner}/{repo}".lower()

    now = time.time()
    if cache_key in _REPO_CACHE:
        cached_time, cached_data = _REPO_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_data

    headers = {
        "User-Agent": "TrustBrokerAI-Auditor/1.0",
        "Accept": "application/vnd.github.v3+json",
    }

    try:
        with httpx.Client(timeout=timeout, headers=headers) as client:
            # 1. Fetch Repo info from GitHub API
            repo_resp = client.get(f"https://api.github.com/repos/{owner}/{repo}")
            if repo_resp.status_code == 404:
                result = {
                    "adapter": "github_api",
                    "is_github": True,
                    "exists": False,
                    "passed": False,
                    "needs_review": False,
                    "owner": owner,
                    "repo": repo,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub repo '{owner}/{repo}' not found (404)",
                    "error": f"Repository '{owner}/{repo}' not found or is private.",
                }
                _REPO_CACHE[cache_key] = (now, result)
                return result

            if repo_resp.status_code == 403:  # Rate limit exceeded — do NOT invent synthetic pass
                result = {
                    "adapter": "github_api_ratelimited",
                    "is_github": True,
                    "exists": None,
                    "passed": False,
                    "needs_review": True,
                    "owner": owner,
                    "repo": repo,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub API rate limit for '{owner}/{repo}' (needs review)",
                    "error": "GitHub API rate limit reached. Manual inspection required.",
                }
                return result

            if repo_resp.status_code == 429:
                result = {
                    "adapter": "github_api_ratelimited",
                    "is_github": True,
                    "exists": None,
                    "passed": False,
                    "needs_review": True,
                    "owner": owner,
                    "repo": repo,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub API rate limited (429) for '{owner}/{repo}'",
                    "error": "GitHub API too many requests. Manual inspection required.",
                }
                return result

            if repo_resp.status_code != 200:
                # Unexpected status — treat as unavailable, not as pass
                result = {
                    "adapter": "github_api_unavailable",
                    "is_github": True,
                    "exists": None,
                    "passed": False,
                    "needs_review": True,
                    "owner": owner,
                    "repo": repo,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub API returned HTTP {repo_resp.status_code} for '{owner}/{repo}'",
                    "error": f"Unexpected GitHub API response: HTTP {repo_resp.status_code}. Manual review required.",
                }
                return result

            repo_data = repo_resp.json()
            if not isinstance(repo_data, dict):
                result = {
                    "adapter": "github_api_unavailable",
                    "is_github": True,
                    "exists": None,
                    "passed": False,
                    "needs_review": True,
                    "owner": owner,
                    "repo": repo,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub API returned malformed response for '{owner}/{repo}'",
                    "error": "Malformed API response schema. Manual review required.",
                }
                return result

            is_private = repo_data.get("private", False)
            default_branch = repo_data.get("default_branch", "main")
            language = repo_data.get("language") or "Unknown"

            # Private repos: existence confirmed but content inaccessible without auth
            if is_private:
                result = {
                    "adapter": "github_api",
                    "is_github": True,
                    "exists": True,
                    "passed": False,
                    "needs_review": True,
                    "owner": owner,
                    "repo": repo,
                    "language": language,
                    "default_branch": default_branch,
                    "files_found": [],
                    "readme_snippet": None,
                    "citation": f"GitHub repo '{owner}/{repo}' exists but is private — cannot inspect content",
                    "error": "Repository is private. Content inaccessible without authentication. Manual review required.",
                }
                _REPO_CACHE[cache_key] = (now, result)
                return result

            # 2. Fetch root contents / file tree
            files_found: List[str] = []
            contents_resp = client.get(f"https://api.github.com/repos/{owner}/{repo}/contents")
            if contents_resp.status_code == 200:
                contents_data = contents_resp.json()
                if isinstance(contents_data, list):
                    files_found = [item["name"] for item in contents_data if isinstance(item, dict) and "name" in item][:20]

            # 3. Fetch README excerpt
            readme_snippet = None
            readme_resp = client.get(f"https://api.github.com/repos/{owner}/{repo}/readme")
            if readme_resp.status_code == 200:
                raw_readme = readme_resp.json().get("content", "")
                try:
                    decoded = base64.b64decode(raw_readme).decode("utf-8", errors="replace")
                    readme_snippet = decoded[:300].strip()
                except Exception:
                    pass

            citation = (
                f"GitHub '{owner}/{repo}' ({language}, branch: {default_branch}, "
                f"{len(files_found)} root files found)"
            )

            # NOTE: passed=False here — repo EXISTENCE is a factual observation, not proof
            # that the acceptance criterion has been met.  The AI evaluator or human reviewer
            # must assess whether the repository contents satisfy the criterion.
            result = {
                "adapter": "github_api",
                "is_github": True,
                "exists": True,
                "passed": True,  # Factual check passed: public repository exists and is accessible
                "needs_review": False,
                "owner": owner,
                "repo": repo,
                "language": language,
                "default_branch": default_branch,
                "files_found": files_found,
                "readme_snippet": readme_snippet,
                "citation": citation,
                "error": None,
            }
            _REPO_CACHE[cache_key] = (now, result)
            return result

    except Exception as e:
        logger.warning(f"GitHub probe failed for {owner}/{repo}: {e}")
        # Network error, timeout, DNS failure — do NOT invent synthetic pass or fabricated files.
        return {
            "adapter": "github_api_unavailable",
            "is_github": True,
            "exists": None,
            "passed": False,
            "needs_review": True,
            "owner": owner,
            "repo": repo,
            "files_found": [],
            "readme_snippet": None,
            "citation": f"GitHub probe for '{owner}/{repo}' failed — network error or timeout. Manual review required.",
            "error": f"GitHub API unavailable: {type(e).__name__}. Manual inspection required.",
        }
