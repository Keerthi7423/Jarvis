"""Core logging functionality.

Replaces basic utils.logger.
"""

import logging
import sys
from typing import Optional

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            "%Y-%m-%d %H:%M:%S"
        ))
        logger.addHandler(handler)
        logger.propagate = False
    return logger

events_logger = get_logger("jarvis.events")

def log_wake_word():
    events_logger.info("[WAKE] Wake word detected")

def log_speech_recognized(text: str):
    events_logger.info("[SPEECH] Recognized: '%s'", text)

def log_command_execution(command: str):
    events_logger.info("[COMMAND] Executing: '%s'", command)

def log_error(error: Exception, context: str):
    get_logger("jarvis.error").error("Error in %s: %s", context, error, exc_info=True)
