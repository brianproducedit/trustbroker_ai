import json
from typing import Any, Dict, List, Optional
from google import genai
from google.genai import types
from app.config import settings


def get_gemini_client() -> genai.Client:
    """Initialize and return the Google GenAI client."""
    return genai.Client(api_key=settings.gemini_api_key)


def generate_sow_draft(
    project_prompt: str,
    category: str = "software",
    total_budget: float = 1000.0,
    currency: str = "USD",
) -> Dict[str, Any]:
    """Generate a structured Statement of Work (SOW) with milestones and acceptance criteria."""
    client = get_gemini_client()

    system_instruction = (
        "You are an expert technical project manager and legal engineering consultant for TrustBroker AI. "
        "Your task is to take a client's project description and decompose it into a professional, clear, "
        "and unambiguous Statement of Work (SOW). "
        "Divide the project into 2 to 4 sequential milestones. Each milestone must have realistic budget allocation "
        "such that the sum of all milestone amounts EXACTLY equals the total budget. "
        "Each milestone MUST contain 2 to 4 concrete, verifiable acceptance criteria with an evidence_type: "
        "'text', 'file', 'url', or 'screenshot'. "
        "Respond ONLY with valid JSON matching the requested structure."
    )

    user_content = f"""
Project Description: {project_prompt}
Category: {category}
Total Budget: {total_budget} {currency}

Generate a JSON object with:
{{
  "title": "A concise, professional contract title",
  "description": "Comprehensive scope and objectives description",
  "category": "{category}",
  "total_budget": {total_budget},
  "currency": "{currency}",
  "milestones": [
    {{
      "title": "Milestone title",
      "description": "Deliverable details and scope",
      "amount": <number>,
      "deadline_days": <number of days from start>,
      "acceptance_criteria": [
        {{
          "title": "Clear criterion name",
          "description": "Specific condition that must be met",
          "evidence_type": "text | file | url | screenshot"
        }}
      ]
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=user_content,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    try:
        return json.loads(response.text)
    except Exception as e:
        # Fallback if markdown wrapping occurs
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.removeprefix("```").removesuffix("```").strip()
        return json.loads(raw_text)


def evaluate_delivery_against_criteria(
    milestone_title: str,
    milestone_description: str,
    criteria: List[Dict[str, Any]],
    delivery_description: str,
    repo_url: Optional[str] = None,
    live_url: Optional[str] = None,
    file_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Rigorously evaluate freelancer's submitted work evidence against milestone acceptance criteria."""
    client = get_gemini_client()

    system_instruction = (
        "You are an impartial, deterministic AI verification inspector for TrustBroker AI. "
        "Your role is to rigorously evaluate whether the freelancer's submitted evidence fulfills "
        "each acceptance criterion defined in the contract milestone. "
        "Be objective, thorough, and fair. "
        "For each criterion, assign: "
        "- score: 0 to 100 "
        "- passed: true if score >= 80, else false "
        "- explanation: detailed justification of why the evidence meets or fails the criterion "
        "- evidence_match_snippet: specific quote, link, or artifact reference that supports your assessment. "
        "Compute an overall_score (0-100). The milestone passes only if overall_score >= 80 and all required criteria pass. "
        "Return ONLY JSON."
    )

    criteria_summary = "\n".join([
        f"- Criterion ID: {c['id']}\n  Title: {c['title']}\n  Description: {c.get('description', '')}\n  Expected Evidence Type: {c.get('evidence_type', 'text')}"
        for c in criteria
    ])

    user_content = f"""
MILESTONE:
Title: {milestone_title}
Scope: {milestone_description}

ACCEPTANCE CRITERIA TO VERIFY:
{criteria_summary}

SUBMITTED EVIDENCE FROM FREELANCER:
Description of Work Done: {delivery_description}
Repository URL: {repo_url or 'None provided'}
Live Deployment URL: {live_url or 'None provided'}
Attached Deliverable Files: {', '.join(file_names) if file_names else 'None'}

Evaluate the submission and respond with JSON matching this format:
{{
  "overall_score": <int 0-100>,
  "passed": <boolean>,
  "summary_analysis": "<concise executive summary of verification findings>",
  "requires_human_review": <boolean, true if ambiguous or borderline>,
  "criterion_evaluations": [
    {{
      "criterion_id": "<id of criterion>",
      "passed": <boolean>,
      "score": <int 0-100>,
      "explanation": "<detailed rationale>",
      "evidence_match_snippet": "<matching quote or reference>"
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=user_content,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )

    try:
        return json.loads(response.text)
    except Exception as e:
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text.removeprefix("```").removesuffix("```").strip()
        return json.loads(raw_text)
