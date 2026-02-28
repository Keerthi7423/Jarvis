"""AI fallback service for Jarvis using local Ollama API."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from config.settings import (
    AI_REQUEST_TIMEOUT_SECONDS,
    OLLAMA_API_URL,
    OLLAMA_MODEL,
    OLLAMA_SYSTEM_PROMPT,
)
from utils.logger import get_logger

logger = get_logger("jarvis.ai_service")

_GENERATE_ENDPOINT = "/api/generate"
_TAGS_ENDPOINT = "/api/tags"


def check_ai_fallback_health() -> tuple[bool, str]:
    """Check if Ollama server is reachable and model is available.

    Returns:
        Tuple of (is_ready, detail_message).
    """
    endpoint = f"{OLLAMA_API_URL.rstrip('/')}{_TAGS_ENDPOINT}"
    try:
        request = urllib.request.Request(endpoint, method="GET")
        with urllib.request.urlopen(request, timeout=min(AI_REQUEST_TIMEOUT_SECONDS, 5.0)) as response:
            payload = json.loads(response.read().decode("utf-8"))

        models = payload.get("models", [])
        installed_names = {
            str(item.get("name", "")).strip() for item in models if isinstance(item, dict)
        }

        if OLLAMA_MODEL in installed_names:
            return True, f"AI fallback READY (model='{OLLAMA_MODEL}')"

        return (
            False,
            f"AI fallback UNAVAILABLE (Ollama reachable, model '{OLLAMA_MODEL}' not found)",
        )

    except urllib.error.URLError:
        return (
            False,
            f"AI fallback UNAVAILABLE (cannot connect to Ollama at {OLLAMA_API_URL})",
        )
    except Exception as exc:
        return False, f"AI fallback UNAVAILABLE ({exc})"


def ai_response(text: str) -> str | None:
    """Return fallback AI response for unknown commands.

    Args:
        text: User recognized speech text.

    Returns:
        Assistant reply text, or None if response generation fails.
    """
    prompt = text.strip()
    if not prompt:
        return None

    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "system": OLLAMA_SYSTEM_PROMPT,
            "stream": False,
        }
        request_body = json.dumps(payload).encode("utf-8")
        endpoint = f"{OLLAMA_API_URL.rstrip('/')}{_GENERATE_ENDPOINT}"

        request = urllib.request.Request(
            endpoint,
            data=request_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=AI_REQUEST_TIMEOUT_SECONDS) as response:
            response_data = response.read().decode("utf-8")
            parsed = json.loads(response_data)

        answer = str(parsed.get("response", "")).strip()
        if not answer:
            logger.warning("Ollama returned empty fallback response.")
            return None

        logger.info("AI fallback response generated successfully.")
        return answer

    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        logger.error("Ollama HTTP error %s: %s", exc.code, body)
        return None
    except urllib.error.URLError as exc:
        logger.error(
            "Ollama connection failed: %s. Is Ollama running on %s?",
            exc,
            OLLAMA_API_URL,
        )
        return None
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Ollama response JSON: %s", exc, exc_info=True)
        return None
    except Exception as exc:
        logger.error("AI fallback failed: %s", exc, exc_info=True)
        return None
