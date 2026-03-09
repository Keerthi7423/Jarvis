"""Text-to-Speech router using pyttsx3."""

from __future__ import annotations

import pyttsx3  # pyre-ignore
from config.settings import SPEECH_RATE  # pyre-ignore
from core.logger import get_logger, log_error

logger = get_logger("jarvis.speaker")

_ENGINE = None

def _get_engine() -> pyttsx3.Engine:
    """Create and configure shared fallback pyttsx3 engine lazily."""
    global _ENGINE
    if _ENGINE is None:
        try:
            _ENGINE = pyttsx3.init()
            _ENGINE.setProperty("rate", SPEECH_RATE)
            voices = _ENGINE.getProperty("voices")
            if voices:
                _ENGINE.setProperty("voice", voices[0].id)
        except Exception as exc:
            log_error(exc, "pyttsx3 init")
    return _ENGINE

def check_tts_backend_health() -> tuple[bool, str]:
    if _get_engine():
        return True, "TTS backend READY: pyttsx3"
    return False, "TTS backend UNAVAILABLE: init failed"

is_speaking = False

def speak(text: str, *args, **kwargs) -> bool:
    """Speak text using pyttsx3."""
    global is_speaking
    message = text.strip()
    if not message:
        return False

    engine = _get_engine()
    if not engine:
        return False

    is_speaking = True
    ok = False
    try:
        logger.info("Speaking: %s", message)
        engine.say(message)
        engine.runAndWait()
        ok = True
    except Exception as exc:
        log_error(exc, "speaker.speak")
        ok = False
    finally:
        is_speaking = False
    return ok
