"""
Verification Adapters Package.
Specialized inspection adapters for each criterion evidence type:
- http_probe: Live URL status, reachable, TLS, page title
- vision: Groq multimodal analysis on screenshots & UI renders
- document: Local PDF/DOCX/text extraction + Groq JSON analysis
- repo_meta: GitHub/GitLab public metadata and file structure
- zip_listing: Safe zip member inspection without execution
"""
