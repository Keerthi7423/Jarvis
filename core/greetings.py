"""Time-based greeting selection for assistant startup."""

from __future__ import annotations

from datetime import datetime

from utils.logger import get_logger

logger = get_logger("jarvis.greetings")


def get_time_based_greeting() -> str:
    """Return greeting text based on current local hour."""
    hour = datetime.now().hour

    if 0 <= hour <= 4:
        greeting = "Working late again?"
    elif 5 <= hour <= 11:
        greeting = "Good morning."
    elif 12 <= hour <= 16:
        greeting = "Good afternoon."
    elif 17 <= hour <= 21:
        greeting = "Good evening."
    else:
        greeting = "Working late again?"

    logger.info("Selected startup greeting='%s' for hour=%02d", greeting, hour)
    return greeting
