"""Centralized error handling for the Jarvis Assistant."""

from __future__ import annotations

from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.error_handler")

def handle_error(exception: Exception, context: str) -> str:
    """
    Log an error centrally, prevent system crash, and return a safe user message.
    
    Args:
        exception: The exception that occurred.
        context: A descriptive string of what the system was trying to do.
        
    Returns:
        A safe, user-facing fallback message.
    """
    logger.error("ERROR | %s: %s", context, str(exception), exc_info=False)
    # The requirement asks for: Jarvis response: "Sorry, I couldn't execute that command."
    return "Sorry, I couldn't execute that command."
