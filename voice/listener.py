"""Voice listener utility for converting microphone input to text.

Provides speech recognition through Google Speech-to-Text API with:
- Comprehensive error handling for all failure modes
- Microphone failure recovery
- Internet connectivity error handling
- Structured logging for debugging
- Configurable timeouts from config.settings
"""

from __future__ import annotations

import speech_recognition as sr

from config.settings import (
    ENERGY_THRESHOLD,
    MICROPHONE_TIMEOUT_SECONDS,
    PHRASE_TIME_LIMIT_SECONDS,
)
from utils.logger import get_logger

logger = get_logger("jarvis.listener")

# Initialize recognizer with configured settings
_RECOGNIZER = sr.Recognizer()
_RECOGNIZER.energy_threshold = ENERGY_THRESHOLD
_RECOGNIZER.dynamic_energy_threshold = True


def listen() -> str | None:
    """Capture a short microphone phrase and return recognized text.

    Handles all failure modes gracefully:
    - Microphone not available
    - No speech detected (timeout)
    - Speech too unclear (unknown value)
    - Internet connectivity issues
    - Unexpected errors

    Returns:
        Recognized text if successful, None if any error occurred.
    """
    try:
        with sr.Microphone() as source:
            logger.info("Listening for speech...")

            # Adjust for ambient noise to improve recognition
            try:
                _RECOGNIZER.adjust_for_ambient_noise(source, duration=1)
            except Exception as exc:
                logger.warning("Could not adjust for ambient noise: %s", exc)
                # Continue anyway, use default threshold

            # Capture audio with configured timeouts
            try:
                audio = _RECOGNIZER.listen(
                    source,
                    timeout=MICROPHONE_TIMEOUT_SECONDS,
                    phrase_time_limit=PHRASE_TIME_LIMIT_SECONDS,
                )
            except sr.WaitTimeoutError:
                logger.debug("Listening timed out waiting for speech.")
                return None

        # Attempt to recognize speech using Google API
        try:
            text = _RECOGNIZER.recognize_google(audio).strip()
            if not text:
                logger.info("Recognized empty text.")
                return None

            logger.info("Recognized speech: %s", text)
            return text

        except sr.UnknownValueError:
            logger.debug("Speech was unclear and could not be transcribed.")
            return None

        except sr.RequestError as exc:
            from core.error_handler import handle_error
            handle_error(exc, "Speech recognition service error (likely internet)")
            return None

    except FileNotFoundError as exc:
        from core.error_handler import handle_error
        handle_error(exc, "Microphone device not found")
        return None

    except OSError as exc:
        from core.error_handler import handle_error
        handle_error(exc, "System error accessing microphone")
        return None

    except Exception as exc:
        from core.error_handler import handle_error
        handle_error(exc, "Unexpected listener error")
        return None