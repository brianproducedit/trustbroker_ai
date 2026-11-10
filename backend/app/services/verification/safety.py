"""
Safety checks and evidence validation for TrustBroker AI Verification Engine.
Enforces size/type allowlists and sanitizes filenames at $0 ops cost.
"""
import os
import re
from typing import Any, Dict, List, Optional, Tuple, Union

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB per file
MAX_TOTAL_SUBMISSION_BYTES = 60 * 1024 * 1024  # 60 MB total

DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".vbs", ".ps1", ".msi", ".dll", ".scr", 
    ".bin", ".app", ".com", ".pif", ".application", ".gadget"
}

ALLOWED_EXTENSIONS = {
    # Images
    ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif",
    # Documents
    ".pdf", ".docx", ".txt", ".md", ".rtf", ".csv",
    # Archives
    ".zip", ".tar", ".gz",
    # Source / Web / Data
    ".json", ".ts", ".tsx", ".js", ".jsx", ".py", ".html", ".css", ".yaml", ".yml"
}


def sanitize_filename(filename: str) -> str:
    """Strip directory traversal and invalid characters from filename."""
    base = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9._-]', '_', base)
    return clean[:120] if clean else "unnamed_artifact"


def validate_evidence_file(file_name: str, size_bytes: int, mime_type: str = "") -> Tuple[bool, str]:
    """Validate that an uploaded artifact conforms to safety rules."""
    ext = os.path.splitext(file_name.lower())[1]

    if ext in DANGEROUS_EXTENSIONS:
        return False, f"Executable file type '{ext}' is prohibited for security."

    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file format '{ext}'. Allowed: images, PDF/docs, ZIP archives, code."

    if size_bytes > MAX_FILE_SIZE_BYTES:
        mb = size_bytes / (1024 * 1024)
        return False, f"File size ({mb:.1f}MB) exceeds the 25MB limit."

    return True, "Valid"


def validate_storage_path(storage_path: str, uploader_id: Optional[Any] = None) -> Tuple[bool, str]:
    """Validate storage path format and ownership.
    
    Ensures:
    1. No blob:, data:, javascript:, or arbitrary web schemes
    2. No path traversal (..), null bytes (\\0), or absolute system paths
    3. If uploader_id is provided, the path MUST reside in the uploader's subfolder
    4. Must belong to the approved storage namespace (supabase:// or uploads/evidence/)
    """
    if not storage_path or not isinstance(storage_path, str):
        return False, "Empty or invalid storage path."

    clean = storage_path.strip()
    if clean.startswith("blob:"):
        return False, "Browser-local blob: URLs are not permitted."
    if clean.startswith(("http://", "https://", "data:", "file:", "ftp:")):
        return False, "External or arbitrary URI schemes are not permitted for storage paths."
    if "\0" in clean or ".." in clean:
        return False, "Invalid characters or path traversal attempt detected."
    if clean.startswith(("/", "\\")) or re.match(r"^[a-zA-Z]:", clean):
        return False, "Absolute filesystem paths are not permitted."

    expected_uid = str(uploader_id) if uploader_id else None

    if clean.startswith("supabase://"):
        remainder = clean.replace("supabase://", "", 1)
        parts = remainder.split("/")
        if len(parts) < 3:
            return False, "Invalid Supabase storage path format."
        bucket, folder = parts[0], parts[1]
        if expected_uid and folder != expected_uid:
            return False, f"Storage path belongs to user {folder}, not authenticated uploader."
        return True, "Valid"

    if clean.startswith("uploads/evidence/"):
        remainder = clean.replace("uploads/evidence/", "", 1)
        parts = remainder.split("/")
        if len(parts) < 2:
            return False, "Invalid local storage path format."
        folder = parts[0]
        if expected_uid and folder != expected_uid:
            return False, f"Storage path belongs to user {folder}, not authenticated uploader."
        return True, "Valid"

    return False, f"Unrecognized storage path namespace: {clean[:40]}"


# ==============================================================================
# SSRF (Server-Side Request Forgery) Protection & External URL Safety
# ==============================================================================
import ipaddress
import socket
import urllib.parse
from typing import Optional, List, Union

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),       # Link-local / Cloud metadata (AWS, GCP, Azure, DigitalOcean)
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),          # Multicast
    ipaddress.ip_network("240.0.0.0/4"),          # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("::1/128"),              # Loopback
    ipaddress.ip_network("::ffff:0:0/96"),        # IPv4-mapped IPv6
    ipaddress.ip_network("64:ff9b::/96"),
    ipaddress.ip_network("100::/64"),
    ipaddress.ip_network("2001::/23"),
    ipaddress.ip_network("2001:db8::/32"),
    ipaddress.ip_network("2002::/16"),
    ipaddress.ip_network("fc00::/7"),             # Unique local
    ipaddress.ip_network("fe80::/10"),            # Link-local
    ipaddress.ip_network("ff00::/8"),             # Multicast
]


def is_ip_blocked(ip: Union[ipaddress.IPv4Address, ipaddress.IPv6Address]) -> bool:
    """Check if an IP address belongs to private, loopback, link-local, multicast, or cloud metadata ranges."""
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped

    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
        return True

    for net in BLOCKED_IP_NETWORKS:
        if ip in net:
            return True

    ip_str = str(ip).lower()
    if ip_str in ("169.254.169.254", "fd00:ec2::254"):
        return True

    return False


def validate_url_for_ssrf(url: str) -> Tuple[bool, Optional[str], Optional[urllib.parse.ParseResult], List[str]]:
    """Validate a user-supplied URL against Server-Side Request Forgery (SSRF) threats.
    
    Checks:
    1. Scheme must be http or https
    2. No embedded user credentials (user:pass@)
    3. Hostname must be present and valid
    4. DNS resolution: every resolved IP must NOT be in blocked private/internal ranges
    5. Port must be a standard web port (80, 443, 8080, 8443)
    
    Returns:
    (is_safe, error_message, parsed_result, resolved_ips)
    """
    clean = (url or "").strip()
    if not clean:
        return False, "URL is empty.", None, []

    # Check for raw scheme before prepending default
    raw_scheme_match = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*):", clean)
    if raw_scheme_match:
        raw_scheme = raw_scheme_match.group(1).lower()
        if raw_scheme not in ("http", "https"):
            return False, f"Unsupported URL scheme '{raw_scheme}'. Only http and https are permitted.", None, []
    else:
        clean = "https://" + clean

    try:
        parsed = urllib.parse.urlparse(clean)
    except Exception as exc:
        return False, f"Malformed URL: {exc}", None, []

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported URL scheme '{parsed.scheme}'. Only http and https are permitted.", parsed, []

    if parsed.username or parsed.password:
        return False, "Embedded credentials (user:pass@) in URL are prohibited for security.", parsed, []

    hostname = parsed.hostname
    if not hostname:
        return False, "URL does not contain a valid hostname.", parsed, []

    # Block well-known internal hostnames directly
    blocked_hostnames = {
        "localhost", "localhost.localdomain", "127.0.0.1", "::1", "0.0.0.0",
        "instance-data", "metadata.google.internal", "metadata.aws", "metadata",
    }
    host_lower = hostname.lower()
    if host_lower in blocked_hostnames or host_lower.endswith(".internal") or host_lower.endswith(".local"):
        return False, f"Access to local or internal host '{hostname}' is prohibited.", parsed, []

    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    except ValueError as exc:
        return False, f"Invalid port in URL: {exc}", parsed, []

    allowed_ports = {80, 443, 8080, 8443}
    if port not in allowed_ports:
        return False, f"Port {port} is not permitted for live staging inspection. Use standard HTTP(S) ports.", parsed, []

    # Check if hostname is a raw IP literal
    try:
        raw_ip = ipaddress.ip_address(hostname.strip("[]"))
        if is_ip_blocked(raw_ip):
            return False, f"Direct access to private or reserved IP '{raw_ip}' is prohibited.", parsed, []
        return True, None, parsed, [str(raw_ip)]
    except ValueError:
        pass  # Domain name, proceed to DNS resolution

    # Resolve hostname via DNS
    try:
        addr_info = socket.getaddrinfo(hostname, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        return False, f"DNS resolution failed for host '{hostname}': {exc}", parsed, []
    except Exception as exc:
        return False, f"Network error resolving host '{hostname}': {exc}", parsed, []

    if not addr_info:
        return False, f"Could not resolve any IP address for host '{hostname}'.", parsed, []

    resolved_ips = []
    for entry in addr_info:
        sockaddr = entry[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            if is_ip_blocked(ip_obj):
                return False, f"Host '{hostname}' resolved to prohibited internal IP address '{ip_str}'.", parsed, []
            resolved_ips.append(ip_str)
        except ValueError:
            return False, f"Host '{hostname}' resolved to invalid IP representation '{ip_str}'.", parsed, []

    return True, None, parsed, resolved_ips
