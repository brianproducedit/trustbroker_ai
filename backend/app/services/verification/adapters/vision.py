"""
Vision Adapter for Screenshots and Design Files.
Inspects UI renders, screenshots and visual assets via Groq Vision API.
"""
import base64
import json
import logging
import os
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger("trustbroker.verification.vision")

VISION_MODELS = [
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "qwen/qwen3.8-27b",
]


def inspect_screenshot_with_vision(
    image_source: str,
    criterion_title: str,
    criterion_description: str,
    mime_type: str = "image/png",
    local_file_bytes: Optional[bytes] = None,
) -> Dict[str, Any]:
    """Analyze screenshot or design file against milestone criterion using Vision LLM.
    
    Supports:
    - Public or signed HTTP(S) image URLs
    - Base64 data URIs
    - Direct byte buffers from local uploads
    """
    data_uri = None

    if local_file_bytes:
        b64 = base64.b64encode(local_file_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{b64}"
    elif image_source.startswith("data:"):
        data_uri = image_source
    elif image_source.startswith(("http://", "https://")):
        data_uri = image_source
    elif os.path.isfile(image_source):
        try:
            with open(image_source, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
                ext = os.path.splitext(image_source)[1].lower().replace(".", "")
                guessed_mime = f"image/{ext}" if ext in ["png", "jpeg", "webp"] else "image/png"
                data_uri = f"data:{guessed_mime};base64,{b64}"
        except Exception as e:
            logger.warning(f"Failed to read local image file {image_source}: {e}")

    # Only attempt vision API if we have both an API key and actual image data
    if not data_uri:
        reason = "Image bytes unavailable or could not be read"
        logger.warning(f"Vision inspection skipped for criterion '{criterion_title}': {reason}")
        return {
            "adapter": "vision_needs_review",
            "model_used": None,
            "matches_criterion": False,
            "confidence": 0.0,
            "visual_elements": [],
            "observation": f"Image evidence submitted but could not be read or encoded. {reason}. Manual review required.",
            "citation": "Screenshot evidence present but uninspected — needs human review",
            "defects": [],
            "passed": False,
            "needs_review": True,
        }

    if not settings.groq_api_key:
        logger.warning(f"Vision inspection skipped for criterion '{criterion_title}': no vision API key configured")
        return {
            "adapter": "vision_needs_review",
            "model_used": None,
            "matches_criterion": False,
            "confidence": 0.0,
            "visual_elements": [],
            "observation": "No vision API key configured. Image evidence submitted but could not be inspected by a model. Manual review required.",
            "citation": "Screenshot evidence present but uninspected — needs human review",
            "defects": [],
            "passed": False,
            "needs_review": True,
        }

    # Groq API key is available — attempt vision models in order
    system_prompt = (
        "You are TrustBroker AI's Senior Design & UI Auditor. "
        "Analyze the provided screenshot carefully against the acceptance criterion. "
        "Output valid JSON ONLY with the following schema:\n"
        "{\n"
        '  "visual_elements_found": ["element1", "element2"],\n'
        '  "layout_observation": "detailed observation of UI layout and visual styling",\n'
        '  "matches_criterion": true/false,\n'
        '  "confidence": 0.0 to 1.0,\n'
        '  "defects_or_gaps": ["issue1", ...],\n'
        '  "summary_citation": "short 1-line citation summarizing what is in the image"\n'
        "}"
    )

    user_content: List[Dict[str, Any]] = [
        {
            "type": "text",
            "text": (
                f"Acceptance Criterion: {criterion_title}\n"
                f"Description: {criterion_description}\n\n"
                "Inspect the visual evidence and return the JSON assessment. "
                "Do not invent visual elements not present in the image."
            ),
        },
        {
            "type": "image_url",
            "image_url": {"url": data_uri},
        },
    ]

    last_error: Optional[str] = None
    for model in VISION_MODELS:
        try:
            with httpx.Client(timeout=18.0) as client:
                resp = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content},
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.1,
                    },
                )

                if resp.status_code == 429:
                    logger.warning(f"Vision model {model} rate-limited (429) — trying next model")
                    last_error = "Rate limited (429)"
                    continue

                if resp.status_code != 200:
                    logger.warning(f"Vision model {model} returned HTTP {resp.status_code}")
                    last_error = f"HTTP {resp.status_code}"
                    continue

                raw = resp.json()["choices"][0]["message"]["content"]
                try:
                    parsed = json.loads(raw)
                except (json.JSONDecodeError, KeyError) as parse_err:
                    logger.warning(f"Vision model {model} returned malformed JSON: {parse_err}")
                    last_error = "Malformed JSON response"
                    continue

                # Validate required fields — missing or wrong types become NEEDS_REVIEW
                matches = parsed.get("matches_criterion")
                if not isinstance(matches, bool):
                    logger.warning(
                        f"Vision model {model} returned invalid matches_criterion={matches!r} — skipping"
                    )
                    last_error = "Missing or invalid matches_criterion field"
                    continue

                confidence_raw = parsed.get("confidence", 0.0)
                try:
                    confidence = float(confidence_raw)
                    if not (0.0 <= confidence <= 1.0):
                        raise ValueError(f"out of range: {confidence}")
                except (TypeError, ValueError) as ce:
                    logger.warning(f"Vision model {model} returned invalid confidence={confidence_raw!r}: {ce}")
                    last_error = "Invalid confidence value"
                    continue

                return {
                    "adapter": "groq_vision",
                    "model_used": model,
                    "matches_criterion": matches,
                    "confidence": confidence,
                    "visual_elements": parsed.get("visual_elements_found", []),
                    "observation": str(parsed.get("layout_observation", "")),
                    "citation": str(parsed.get("summary_citation", "Visual inspection completed.")),
                    "defects": parsed.get("defects_or_gaps", []),
                    "passed": matches,
                }
        except Exception as e:
            logger.debug(f"Vision model {model} attempt failed: {e}")
            last_error = str(e)
            continue

    # All vision models exhausted without a valid response — do NOT fabricate a pass.
    # Return NEEDS_REVIEW so a human client can inspect the submitted image.
    logger.warning(
        f"All vision models exhausted for criterion '{criterion_title}'. "
        f"Last error: {last_error}. Returning NEEDS_REVIEW."
    )
    return {
        "adapter": "vision_needs_review",
        "model_used": None,
        "matches_criterion": False,
        "confidence": 0.0,
        "visual_elements": [],
        "observation": (
            f"Vision inspection could not be completed for criterion '{criterion_title}'. "
            f"All vision models failed or returned invalid responses (last: {last_error}). "
            "Manual review required before criterion can be marked passed."
        ),
        "citation": "Screenshot evidence present but uninspected — needs human review",
        "defects": [],
        "passed": False,
        "needs_review": True,
    }
