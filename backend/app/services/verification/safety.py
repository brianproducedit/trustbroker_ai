"""
Safety checks and evidence validation for TrustBroker AI Verification Engine.
Enforces size/type allowlists and sanitizes filenames at $0 ops cost.
"""
import os
import re
from typing import Tuple

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
