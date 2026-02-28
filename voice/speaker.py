"""Text-to-Speech router with AI backend and pyttsx3 fallback."""

from __future__ import annotations

import threading
from pathlib import Path

import pyttsx3

from config.settings import AUDIO_CACHE_DIR, SPEECH_RATE, TTS_BACKEND
from utils.logger import get_logger
from voice.ai_speaker import speak_with_ai

logger = get_logger("jarvis.speaker")

_ENGINE = None
_ENGINE_LOCK = threading.Lock()


def _select_voice(engine: pyttsx3.Engine) -> None:
    """Pick an available calm-sounding fallback voice if possible."""
    voices = engine.getProperty("voices") or []
    if not voices:
        logger.warning("No TTS voices reported by fallback engine; using defaults.")
        return

    preferred_tokens = ("zira", "hazel", "susan", "aria", "samantha", "female")
    fallback_voice_id = voices[0].id

    for voice in voices:
        combined = f"{voice.name} {voice.id}".lower()
        if any(token in combined for token in preferred_tokens):
            engine.setProperty("voice", voice.id)
            logger.info("Fallback TTS voice selected: %s", voice.name)
            return

    engine.setProperty("voice", fallback_voice_id)
    logger.info("Fallback TTS voice selected: %s", voices[0].name)


def _get_engine() -> pyttsx3.Engine:
    """Create and configure shared fallback pyttsx3 engine lazily."""
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    with _ENGINE_LOCK:
        if _ENGINE is None:
            engine = pyttsx3.init()
            engine.setProperty("rate", SPEECH_RATE)
            _select_voice(engine)
            _ENGINE = engine
            logger.info("Fallback TTS engine initialized with rate=%d", SPEECH_RATE)

    return _ENGINE


def _speak_with_pyttsx3(text: str) -> bool:
    """Fallback speech synthesis using pyttsx3."""
    try:
        engine = _get_engine()
        with _ENGINE_LOCK:
            engine.say(text)
            engine.runAndWait()
        logger.debug("Spoke message via pyttsx3 fallback.")
        return True
    except Exception as exc:
        logger.error("pyttsx3 fallback failed: %s", exc, exc_info=True)
        return False


def speak(text: str) -> bool:
    """Speak text using configured backend with automatic fallback.

    Entry point contract remains stable for the assistant:
    - Attempt configured AI backend (ElevenLabs or Coqui).
    - On any failure, fallback to pyttsx3.
    """
    message = text.strip()
    if not message:
        logger.warning("Ignored empty text passed to speak().")
        return False

    # Ensure cache directory exists for AI backend usage.
    try:
        Path(AUDIO_CACHE_DIR).mkdir(parents=True, exist_ok=True)
    except Exception as exc:
        logger.warning("Unable to initialize AUDIO_CACHE_DIR '%s': %s", AUDIO_CACHE_DIR, exc)

    backend = TTS_BACKEND.strip().lower()
    if backend in {"elevenlabs", "coqui"}:
        try:
            if speak_with_ai(message):
                return True
            logger.warning("AI TTS backend '%s' failed, using fallback.", backend)
        except Exception as exc:
            logger.error("AI TTS backend '%s' crashed: %s", backend, exc, exc_info=True)

    elif backend == "fallback":
        logger.info("TTS_BACKEND=fallback, using pyttsx3.")
    else:
        logger.warning("Unknown TTS_BACKEND '%s', using pyttsx3.", backend)

    return _speak_with_pyttsx3(message)

