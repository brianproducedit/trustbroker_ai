"""
ZIP Listing Adapter for Source Code & Deliverable Archives.
Safely inspects member filenames, directory structure, and uncompressed sizes.
Never extracts files to disk or executes archive contents.
"""
import io
import logging
import os
import zipfile
from typing import Any, Dict, List, Optional

logger = logging.getLogger("trustbroker.verification.zip_listing")

MAX_INSPECT_FILES = 500


def inspect_zip_archive(
    file_name: str,
    file_path: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """Inspect a ZIP archive safely without disk extraction."""
    raw_bytes = file_bytes
    if not raw_bytes and file_path and os.path.isfile(file_path):
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
        except Exception as e:
            logger.warning(f"Error reading archive {file_path}: {e}")
            return {
                "adapter": "zip_listing",
                "passed": False,
                "error": f"Failed to open archive: {e}",
                "citation": "Unreadable archive",
            }

    if not raw_bytes:
        return {
            "adapter": "zip_listing",
            "passed": False,
            "error": "No file bytes provided for archive inspection.",
            "citation": "Empty archive buffer",
        }

    try:
        with zipfile.ZipFile(io.BytesIO(raw_bytes), "r") as zf:
            infolist = zf.infolist()
            total_files = len(infolist)
            total_uncompressed = sum(info.file_size for info in infolist)

            # Security audit: check for path traversal attempts
            suspicious_paths = [
                info.filename for info in infolist 
                if ".." in info.filename or info.filename.startswith(("/", "\\"))
            ]
            has_security_warning = len(suspicious_paths) > 0

            # Collect member filenames up to MAX_INSPECT_FILES
            member_names = [info.filename for info in infolist[:MAX_INSPECT_FILES]]
            extensions = set()
            for name in member_names:
                ext = os.path.splitext(name.lower())[1]
                if ext:
                    extensions.add(ext)

            uncompressed_mb = round(total_uncompressed / (1024 * 1024), 2)
            citation = (
                f"ZIP Archive '{file_name}': {total_files} members "
                f"({uncompressed_mb} MB uncompressed, types: {', '.join(sorted(extensions)[:5])})"
            )

            passed = (total_files > 0) and not has_security_warning

            return {
                "adapter": "zip_listing",
                "passed": passed,
                "total_files": total_files,
                "total_uncompressed_bytes": total_uncompressed,
                "uncompressed_mb": uncompressed_mb,
                "extensions_found": sorted(list(extensions)),
                "sample_files": member_names[:15],
                "has_security_warning": has_security_warning,
                "suspicious_paths": suspicious_paths,
                "citation": citation,
                "error": "Suspicious path traversal detected in archive" if has_security_warning else None,
            }

    except zipfile.BadZipFile:
        return {
            "adapter": "zip_listing",
            "passed": False,
            "error": f"File '{file_name}' is not a valid or intact ZIP archive.",
            "citation": f"Corrupted ZIP: {file_name}",
        }
    except Exception as e:
        return {
            "adapter": "zip_listing",
            "passed": False,
            "error": f"Archive analysis failed: {str(e)}",
            "citation": f"Error inspecting {file_name}",
        }
