"""Text-to-Speech speaker utility for Jarvis voice output.

Provides thread-safe offline speech synthesis using pyttsx3.
"""

from __future__ import annotations

import threading

import pyttsx3

from config.settings import SPEECH_RATE
from utils.logger import get_logger

logger = get_logger("jarvis.speaker")

_ENGINE = None
_ENGINE_LOCK = threading.Lock()


def _select_voice(engine: pyttsx3.Engine) -> None:
    """Pick an available calm-sounding voice if possible."""
    voices = engine.getProperty("voices") or []
    if not voices:
        logger.warning("No TTS voices reported by the engine; using defaults.")
        return

    preferred_tokens = ("zira", "hazel", "susan", "aria", "samantha", "female")
    fallback_voice_id = voices[0].id

    for voice in voices:
        combined = f"{voice.name} {voice.id}".lower()
        if any(token in combined for token in preferred_tokens):
            engine.setProperty("voice", voice.id)
            logger.info("TTS voice selected: %s", voice.name)
            return

    engine.setProperty("voice", fallback_voice_id)
    logger.info("TTS voice selected: %s", voices[0].name)


def _get_engine() -> pyttsx3.Engine:
    """Create and configure a shared TTS engine lazily."""
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    with _ENGINE_LOCK:
        if _ENGINE is None:
            engine = pyttsx3.init()
            # Configure speech rate from settings
            engine.setProperty("rate", SPEECH_RATE)
            _select_voice(engine)
            _ENGINE = engine
            logger.info("TTS engine initialized with rate=%d", SPEECH_RATE)

    return _ENGINE


def speak(text: str) -> bool:
    """Speak text using the configured offline TTS engine.

    Wraps TTS operations in exception handling to prevent blocking
    failures from crashing the assistant.

    Args:
        text: Text to speak. Whitespace is stripped.

    Returns:
        True if speech was successful, False if any error occurred.
    """
    message = text.strip()
    if not message:
        logger.warning("Ignored empty text passed to speak().")
        return False

    try:
        engine = _get_engine()
        with _ENGINE_LOCK:
            engine.say(message)
            engine.runAndWait()
        logger.debug("Spoke message: %s", message)
        return True

    except Exception as exc:
        logger.error("Failed to speak message: %s. Error: %s", message, exc, exc_info=True)
        return False
