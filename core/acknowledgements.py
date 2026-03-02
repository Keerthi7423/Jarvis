"""Acknowledgement phrase selection for wake and command events."""

from __future__ import annotations

import random

from utils.logger import get_logger

logger = get_logger("jarvis.acknowledgements")

_WAKE_ACKS = (
    "Yes?",
    "Listening.",
    "Go ahead.",
    "Ready.",
    "Tell me.",
)

_COMMAND_ACKS = (
    "Right away.",
    "Understood.",
    "Done.",
    "On it.",
    "Completed.",
)


def _pick_ack(options: tuple[str, ...], category: str) -> str:
    """Pick and log a short acknowledgement phrase."""
    selected = random.choice(options)
    logger.info("Selected %s acknowledgement: %s", category, selected)
    return selected


def get_wake_ack() -> str:
    """Return a short wake acknowledgement phrase."""
    return _pick_ack(_WAKE_ACKS, "wake")


def get_command_ack() -> str:
    """Return a short command-success acknowledgement phrase."""
    return _pick_ack(_COMMAND_ACKS, "command")
