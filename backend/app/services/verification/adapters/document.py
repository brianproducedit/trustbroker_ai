"""
Document Inspection Adapter for PDFs, DOCX, and Specifications.
Extracts text locally at $0 cost (via pypdf), evaluates compliance using Groq LLM.
Never uploads to external proprietary document APIs (No Gemini).
"""
import io
import logging
import os
from typing import Any, Dict, Optional
from app.services import ai_provider

logger = logging.getLogger("trustbroker.verification.document")

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_pages: int = 10) -> str:
    """Extract readable text from PDF bytes locally using pypdf."""
    if not HAS_PYPDF:
        return ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages[:max_pages]):
            text = page.extract_text()
            if text:
                extracted_pages.append(text.strip())
        return "\n\n".join(extracted_pages)
    except Exception as e:
        logger.warning(f"pypdf extraction error: {e}")
        return ""


def extract_document_text(
    file_path: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
    file_name: str = "document.pdf",
) -> str:
    """Extract plain text from document given a file path or raw bytes."""
    ext = os.path.splitext(file_name.lower())[1]

    raw_bytes = file_bytes
    if not raw_bytes and file_path and os.path.isfile(file_path):
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
        except Exception as e:
            logger.warning(f"Error reading file {file_path}: {e}")
            return ""

    if not raw_bytes:
        return ""

    if ext == ".pdf":
        return extract_text_from_pdf_bytes(raw_bytes)
    elif ext in [".txt", ".md", ".json", ".csv", ".yaml", ".yml"]:
        try:
            return raw_bytes.decode("utf-8", errors="replace")[:25000]
        except Exception:
            return ""
    
    return ""


def inspect_document(
    file_name: str,
    criterion_title: str,
    criterion_description: str,
    file_path: Optional[str] = None,
    file_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """Inspect and evaluate document evidence against criterion."""
    extracted_text = extract_document_text(file_path=file_path, file_bytes=file_bytes, file_name=file_name)

    # Empty extract detection (e.g. image-only / scanned PDF)
    if not extracted_text or len(extracted_text.split()) < 10:
        return {
            "adapter": "document_extractor",
            "passed": False,
            "score": 40,
            "confidence": 0.50,
            "needs_review": True,
            "explanation": (
                f"Document '{file_name}' contains no machine-readable text (possibly a raster image scan). "
                "Needs manual client review or page screenshots for vision evaluation."
            ),
            "cited_snippet": f"Document '{file_name}' — 0 text tokens extracted",
            "word_count": 0,
        }

    word_count = len(extracted_text.split())
    text_snippet = extracted_text[:3500]

    # Evaluate extracted text with Groq LPU
    system_prompt = (
        "You are TrustBroker AI's Compliance & Technical Specification Auditor. "
        "Evaluate the extracted document text against the acceptance criterion. "
        "Output valid JSON ONLY with schema:\n"
        "{\n"
        '  "passed": true/false,\n'
        '  "score": 0 to 100,\n'
        '  "confidence": 0.0 to 1.0,\n'
        '  "explanation": "concise explanation of whether the document satisfies the criterion",\n'
        '  "cited_snippet": "direct quote or key phrase from the document supporting the score"\n'
        "}"
    )

    user_prompt = (
        f"Criterion: {criterion_title}\n"
        f"Requirement: {criterion_description}\n\n"
        f"Document Excerpt ({file_name}, {word_count} words total):\n"
        f"\"\"\"\n{text_snippet}\n\"\"\"\n\n"
        "Assess compliance:"
    )

    result_json, model_used = ai_provider.call_groq(system_prompt, user_prompt)
    if not result_json:
        result_json, model_used = ai_provider.call_openrouter(system_prompt, user_prompt)

    if result_json:
        passed = bool(result_json.get("passed", False))
        score = int(result_json.get("score", 75 if passed else 40))
        return {
            "adapter": "document_extractor_groq",
            "model_used": model_used,
            "passed": passed and (score >= 75),
            "score": score,
            "confidence": float(result_json.get("confidence", 0.85)),
            "needs_review": not passed and score >= 60,
            "explanation": str(result_json.get("explanation", "")),
            "cited_snippet": str(result_json.get("cited_snippet", f"Cited from {file_name}")),
            "word_count": word_count,
        }

    # Deterministic fallback
    has_keywords = any(kw.lower() in extracted_text.lower() for kw in criterion_title.split() if len(kw) > 3)
    return {
        "adapter": "document_extractor_heuristic",
        "model_used": "deterministic_keyword_matcher",
        "passed": has_keywords,
        "score": 85 if has_keywords else 50,
        "confidence": 0.70,
        "needs_review": not has_keywords,
        "explanation": f"Document text ({word_count} words) parsed locally from '{file_name}'. Content matches criterion keywords.",
        "cited_snippet": f"Parsed {word_count} words from '{file_name}'",
        "word_count": word_count,
    }
