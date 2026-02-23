"""Text-to-Speech speaker utility for Jarvis voice output."""

from __future__ import annotations

import threading

import pyttsx3

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
            # Medium, calm delivery speed.
            engine.setProperty("rate", 165)
            _select_voice(engine)
            _ENGINE = engine
            logger.info("TTS engine initialized.")

    return _ENGINE


def speak(text: str) -> None:
    """Speak text using the configured offline TTS engine."""
    message = text.strip()
    if not message:
        logger.warning("Ignored empty text passed to speak().")
        return

    engine = _get_engine()
    with _ENGINE_LOCK:
        engine.say(message)
        engine.runAndWait()
