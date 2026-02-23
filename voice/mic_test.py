"""Microphone test utility for validating voice-input environment readiness."""

import speech_recognition as sr

from config.settings import (
    ENERGY_THRESHOLD,
    MICROPHONE_TIMEOUT_SECONDS,
    PHRASE_TIME_LIMIT_SECONDS,
)
from utils.logger import get_logger

logger = get_logger("jarvis.mic_test")


def test_microphone_access() -> bool:
    """Try opening the default microphone and capturing a short audio sample."""
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = ENERGY_THRESHOLD

    try:
        mic_names = sr.Microphone.list_microphone_names()
        if not mic_names:
            logger.error("No microphones detected on this system.")
            return False

        logger.info("Detected %d microphone(s).", len(mic_names))
        logger.info("Using default microphone: %s", mic_names[0])

        with sr.Microphone() as source:
            logger.info("Calibrating ambient noise...")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            logger.info("Listening for a short sample...")
            recognizer.listen(
                source,
                timeout=MICROPHONE_TIMEOUT_SECONDS,
                phrase_time_limit=PHRASE_TIME_LIMIT_SECONDS,
            )

        logger.info("Microphone access test passed.")
        return True

    except Exception as exc:
        logger.error("Microphone access test failed: %s", exc)
        return False
