"""
Vision Adapter for Screenshots and Design Files.
Inspects UI renders, screenshots and visual assets via Groq Vision + OpenRouter Vision APIs.

Model chain (Nov 2026):
  Groq (primary):
    1. qwen/qwen3.8-27b          — 27B multimodal, vision + JSON mode
  OpenRouter free (secondary):
    2. openrouter/free                   — auto-routes to any available free vision model
    3. Other configured multimodal models
"""
import base64
import json
import logging
import os
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger("trustbroker.verification.vision")

# Groq vision models. This account currently exposes one image-capable model;
# text-only Groq models must not be sent image content.
GROQ_VISION_MODELS = [
    "qwen/qwen3.8-27b",
]

# OpenRouter free vision models (fallback when Groq is exhausted)
OPENROUTER_VISION_MODELS = [
    "openrouter/free",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "qwen/qwen-2-vl-72b-instruct:free",
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

    # Only attempt vision API if we have actual image data
    if not data_uri:
        reason = "Image bytes unavailable or could not be read"
        logger.warning(f"Vision inspection skipped for criterion '{criterion_title}': {reason}")
        return _needs_review_result(criterion_title, f"Image evidence submitted but could not be read or encoded. {reason}. Manual review required.")

    system_prompt = (
        "You are TrustBroker AI's Senior Design & UI Auditor. "
        "Analyze the provided screenshot carefully against the acceptance criterion. "
        "Use simple everyday English suitable for a client who is not a designer or developer. "
        "Describe only what can be seen, explain whether it meets the requirement and identify the next action. "
        "Do not use internal tool names, model names, JSON terminology or unexplained design jargon. "
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

    # --- PRIMARY: Groq vision models (fast LPU inference) ---
    if settings.groq_api_key:
        for model in GROQ_VISION_MODELS:
            result = _try_groq_vision(model, system_prompt, user_content, settings.groq_api_key)
            if result is not None:
                if result.get("error"):
                    last_error = result["error"]
                    continue
                return result
            last_error = last_error or f"Groq {model} failed"
        logger.warning(
            "Groq vision unavailable for criterion '%s' after trying %d model(s) "
            "— trying OpenRouter vision",
            criterion_title,
            len(GROQ_VISION_MODELS),
        )
    else:
        logger.info(f"Groq API key not configured — skipping Groq vision for criterion '{criterion_title}'")

    # --- SECONDARY: OpenRouter free vision models ---
    if settings.openrouter_api_key and settings.openrouter_api_key.strip():
        for model in OPENROUTER_VISION_MODELS:
            result = _try_openrouter_vision(model, system_prompt, user_content, settings.openrouter_api_key.strip())
            if result is not None:
                if result.get("error"):
                    last_error = result["error"]
                    continue
                return result
            last_error = last_error or f"OpenRouter {model} failed"
        logger.warning(f"All OpenRouter vision models exhausted for criterion '{criterion_title}'")
    else:
        logger.info(f"OpenRouter API key not configured — skipping OpenRouter vision for criterion '{criterion_title}'")

    # --- TERTIARY: DeepSeek Paid Fallback (image-capable review) ---
    # DeepSeek Flash supports image input through the official OpenAI-compatible
    # API. Send the actual image data, never only its storage path.
    if settings.deepseek_api_key and settings.deepseek_api_key.strip():
        logger.info(
            "Engaging DeepSeek paid vision fallback for '%s'",
            criterion_title,
        )
        result = _try_deepseek_vision(
            system_prompt,
            user_content,
            settings.deepseek_api_key.strip(),
        )
        if result is not None:
            if result.get("error"):
                last_error = result["error"]
            else:
                return result
        last_error = last_error or "DeepSeek could not inspect the image"

    # All vision providers exhausted — return NEEDS_REVIEW (never fabricate a pass)
    logger.warning(
        f"All vision models exhausted for criterion '{criterion_title}'. "
        f"Last error: {last_error}. Returning NEEDS_REVIEW."
    )
    return _needs_review_result(
        criterion_title,
        "The image could not be checked automatically. Please open the image yourself "
        "and confirm whether it meets the requirement."
    )


# ==============================================================================
# Private Helpers
# ==============================================================================

def _needs_review_result(criterion_title: str, observation: str) -> Dict[str, Any]:
    """Return a standard NEEDS_REVIEW result when vision inspection cannot proceed."""
    return {
        "adapter": "vision_needs_review",
        "model_used": None,
        "matches_criterion": False,
        "confidence": 0.0,
        "visual_elements": [],
        "observation": observation,
        "citation": "Screenshot evidence present but uninspected — needs human review",
        "defects": [],
        "passed": False,
        "needs_review": True,
    }


def _try_deepseek_vision(
    system_prompt: str,
    user_content: List[Dict[str, Any]],
    api_key: str,
) -> Optional[Dict[str, Any]]:
    """Run the official DeepSeek Flash image-input fallback."""
    payload = {
        "model": "deepseek-flash",
        "messages": [
            {
                "role": "system",
                "content": (
                    f"{system_prompt}\n"
                    "This is a paid fallback. Use only what is visible in the image. "
                    "Write observations in simple English for a non-technical client. "
                    "Do not mention model names, APIs, JSON, HTTP status codes or internal tools."
                ),
            },
            {"role": "user", "content": user_content},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
        "max_tokens": 2000,
    }
    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if response.status_code != 200:
            logger.warning("DeepSeek vision returned HTTP %s", response.status_code)
            return {"error": f"DeepSeek vision request failed ({response.status_code})"}

        choices = response.json().get("choices", [])
        content = choices[0].get("message", {}).get("content") if choices else None
        parsed = _parse_vision_response(content or "", "deepseek-flash")
        if not parsed:
            return {"error": "DeepSeek vision returned an unreadable assessment"}
        details = parsed["parsed"]
        matches = parsed["matches"]
        parsed["adapter"] = "deepseek_vision_fallback"
        parsed["model_used"] = "deepseek:deepseek-flash"
        return {
            "adapter": parsed["adapter"],
            "model_used": parsed["model_used"],
            "matches_criterion": matches,
            "confidence": parsed["confidence"],
            "visual_elements": details.get("visual_elements_found", []),
            "observation": str(details.get("layout_observation", "")),
            "citation": str(details.get("summary_citation", "Visual evidence was reviewed.")),
            "defects": details.get("defects_or_gaps", []),
            "passed": matches,
            "needs_review": not matches,
        }
    except Exception as exc:
        logger.warning("DeepSeek vision request failed: %s", exc)
        return {"error": "DeepSeek vision request could not be completed"}


def _parse_vision_response(raw: str, model: str) -> Optional[Dict[str, Any]]:
    """Parse and validate a vision model JSON response. Returns None if invalid."""
    try:
        # Strip markdown code fences if any
        text = raw.strip()
        if text.startswith("```json"):
            text = text.removeprefix("```json").removesuffix("```").strip()
        elif text.startswith("```"):
            text = text.removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(text)
    except (json.JSONDecodeError, KeyError) as parse_err:
        logger.warning(f"Vision model {model} returned malformed JSON: {parse_err}")
        return None

    matches = parsed.get("matches_criterion")
    if not isinstance(matches, bool):
        logger.warning(f"Vision model {model} returned invalid matches_criterion={matches!r} — skipping")
        return None

    confidence_raw = parsed.get("confidence", 0.0)
    try:
        confidence = float(confidence_raw)
        if not (0.0 <= confidence <= 1.0):
            raise ValueError(f"out of range: {confidence}")
    except (TypeError, ValueError) as ce:
        logger.warning(f"Vision model {model} returned invalid confidence={confidence_raw!r}: {ce}")
        return None

    return {
        "matches": matches,
        "confidence": confidence,
        "parsed": parsed,
    }


def _try_groq_vision(
    model: str,
    system_prompt: str,
    user_content: List[Dict[str, Any]],
    api_key: str,
) -> Optional[Dict[str, Any]]:
    """Attempt vision inference on a single Groq model.

    Returns:
        - A success dict (no 'error' key) on success
        - A dict with 'error' key on soft failure (try next model)
        - None on hard failure
    """
    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
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
                logger.warning(
                    "Groq vision model %s rate-limited (429). retry_after=%s "
                    "requests_remaining=%s reset=%s",
                    model,
                    resp.headers.get("retry-after", "not-provided"),
                    resp.headers.get("x-ratelimit-remaining-requests", "not-provided"),
                    resp.headers.get("x-ratelimit-reset-requests", "not-provided"),
                )
                return {"error": f"Rate limited (429) on Groq/{model}"}

            if resp.status_code != 200:
                logger.warning(
                    "Groq vision model %s returned HTTP %s: %s",
                    model,
                    resp.status_code,
                    resp.text[:200],
                )
                return {"error": f"HTTP {resp.status_code} on Groq/{model}"}

            raw = resp.json()["choices"][0]["message"]["content"]
            validated = _parse_vision_response(raw, model)
            if validated is None:
                return {"error": f"Invalid response from Groq/{model}"}

            logger.info(f"✅ Groq vision [{model}] completed criterion assessment")
            return {
                "adapter": "groq_vision",
                "model_used": model,
                "matches_criterion": validated["matches"],
                "confidence": validated["confidence"],
                "visual_elements": validated["parsed"].get("visual_elements_found", []),
                "observation": str(validated["parsed"].get("layout_observation", "")),
                "citation": str(validated["parsed"].get("summary_citation", "Visual inspection completed.")),
                "defects": validated["parsed"].get("defects_or_gaps", []),
                "passed": validated["matches"],
            }
    except Exception as e:
        logger.debug(f"Groq vision model {model} attempt failed: {e}")
        return {"error": str(e)}


def _try_openrouter_vision(
    model: str,
    system_prompt: str,
    user_content: List[Dict[str, Any]],
    api_key: str,
) -> Optional[Dict[str, Any]]:
    """Attempt vision inference on a single OpenRouter model.

    Returns:
        - A success dict (no 'error' key) on success
        - A dict with 'error' key on soft failure (try next model)
        - None on hard failure
    """
    try:
        with httpx.Client(timeout=40.0) as client:
            resp = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "https://trustbroker-ai-frontend-bx9a.onrender.com",
                    "X-Title": "TrustBroker AI",
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

            if resp.status_code in (401, 403):
                logger.warning(f"OpenRouter vision authentication failed (HTTP {resp.status_code})")
                return {"error": f"Auth failed on OpenRouter/{model}"}

            if resp.status_code == 429:
                logger.warning(f"OpenRouter vision model {model} rate-limited (429) — trying next model")
                return {"error": f"Rate limited (429) on OpenRouter/{model}"}

            if resp.status_code != 200:
                logger.warning(f"OpenRouter vision model {model} returned HTTP {resp.status_code}: {resp.text[:200]}")
                return {"error": f"HTTP {resp.status_code} on OpenRouter/{model}"}

            data = resp.json()
            if "error" in data:
                logger.warning(f"OpenRouter vision [{model}] returned error body: {data['error']}")
                return {"error": f"API error from OpenRouter/{model}"}

            choices = data.get("choices", [])
            if not choices:
                logger.warning(f"OpenRouter vision [{model}] returned empty choices")
                return {"error": f"Empty choices from OpenRouter/{model}"}

            raw = choices[0]["message"]["content"]
            validated = _parse_vision_response(raw, model)
            if validated is None:
                return {"error": f"Invalid response from OpenRouter/{model}"}

            logger.info(f"✅ OpenRouter vision [{model}] completed criterion assessment")
            return {
                "adapter": "openrouter_vision",
                "model_used": model,
                "matches_criterion": validated["matches"],
                "confidence": validated["confidence"],
                "visual_elements": validated["parsed"].get("visual_elements_found", []),
                "observation": str(validated["parsed"].get("layout_observation", "")),
                "citation": str(validated["parsed"].get("summary_citation", "Visual inspection completed.")),
                "defects": validated["parsed"].get("defects_or_gaps", []),
                "passed": validated["matches"],
            }
    except Exception as e:
        logger.debug(f"OpenRouter vision model {model} attempt failed: {e}")
        return {"error": str(e)}
