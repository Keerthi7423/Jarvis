"""Time-based greeting selection for assistant startup."""

from __future__ import annotations

from datetime import datetime

from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.greetings")


def get_time_based_greeting() -> str:
    """Return greeting text based on current local hour."""
    hour = datetime.now().hour

    if 0 <= hour <= 4:
        period = "Good evening"
    elif 5 <= hour <= 11:
        period = "Good morning"
    elif 12 <= hour <= 16:
        period = "Good afternoon"
    elif 17 <= hour <= 21:
        period = "Good evening"
    else:
        period = "Good evening"

    greeting = (
        f"{period}, Keerthi. "
        "Jarvis systems are now online. "
        "All modules are functioning normally. "
        "How may I assist you today?"
    )

    logger.info("Selected startup greeting='%s' for hour=%02d", greeting, hour)
    return greeting
