"""Voice listener utility for converting microphone input to text."""

from __future__ import annotations

import speech_recognition as sr

from config.settings import (
    ENERGY_THRESHOLD,
    MICROPHONE_TIMEOUT_SECONDS,
    PHRASE_TIME_LIMIT_SECONDS,
)
from utils.logger import get_logger

logger = get_logger("jarvis.listener")

_RECOGNIZER = sr.Recognizer()
_RECOGNIZER.energy_threshold = ENERGY_THRESHOLD
_RECOGNIZER.dynamic_energy_threshold = True


def listen() -> str | None:
    """Capture a short microphone phrase and return recognized text."""
    try:
        with sr.Microphone() as source:
            logger.info("Listening...")
            audio = _RECOGNIZER.listen(
                source,
                timeout=MICROPHONE_TIMEOUT_SECONDS,
                phrase_time_limit=PHRASE_TIME_LIMIT_SECONDS,
            )

        text = _RECOGNIZER.recognize_google(audio).strip()
        if not text:
            logger.info("No speech recognized from captured audio.")
            return None

        logger.info("Recognized: %s", text)
        return text

    except sr.WaitTimeoutError:
        logger.info("Listening timed out waiting for speech.")
        return None
    except sr.UnknownValueError:
        logger.info("Speech was unclear and could not be transcribed.")
        return None
    except sr.RequestError as exc:
        logger.error("Speech recognition service request failed: %s", exc)
        return None
    except Exception as exc:
        logger.error("Unexpected listener error: %s", exc)
        return None
