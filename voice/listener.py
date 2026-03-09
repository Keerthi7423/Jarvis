"""Voice listener utility for converting microphone input to text.
"""

import speech_recognition as sr  # pyre-ignore
from core.logger import get_logger, log_error, log_speech_recognized  # pyre-ignore
from config.settings import MICROPHONE_TIMEOUT_SECONDS, PHRASE_TIME_LIMIT_SECONDS  # pyre-ignore

logger = get_logger("jarvis.listener")

_RECOGNIZER = sr.Recognizer()
# Tuned parameters
_RECOGNIZER.energy_threshold = 300
_RECOGNIZER.pause_threshold = 0.8
_RECOGNIZER.dynamic_energy_threshold = True

from voice.speaker import is_speaking  # pyre-ignore

def listen() -> str | None:
    if is_speaking:
        return None

    try:
        with sr.Microphone() as source:
            logger.info("Calibrating background noise...")
            try:
                # 1 second for better noise calibration
                _RECOGNIZER.adjust_for_ambient_noise(source, duration=1.0)
            except Exception as exc:
                logger.warning("Could not adjust for ambient noise: %s", exc)

            logger.info("Listening for speech...")
            try:
                audio = _RECOGNIZER.listen(
                    source,
                    timeout=MICROPHONE_TIMEOUT_SECONDS,
                    phrase_time_limit=PHRASE_TIME_LIMIT_SECONDS,
                )
            except sr.WaitTimeoutError:
                # Command timeout
                return ""

        try:
            text = _RECOGNIZER.recognize_google(audio).strip()
            if text:
                log_speech_recognized(text)
                return text
            return ""
        except sr.UnknownValueError:
            return "__UNRECOGNIZED__"
        except sr.RequestError as exc:
            log_error(exc, "Speech recognition service error")
            return None

    except OSError as exc:
        log_error(exc, "System error accessing microphone")
        return None
    except Exception as exc:
        log_error(exc, "Unexpected listener error")
        return None
    return None