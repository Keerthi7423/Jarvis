"""Conversational AI module for Jarvis Assistant chat mode."""

from __future__ import annotations

from services.ai_service import ai_response  # pyre-ignore
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.ai_chat")

def ask_ai(question: str) -> str:
    """Send question to AI and return response.
    
    This function wraps the ai_response service to provide a clean
    interface for the conversational chat mode.
    """
    logger.info("Processing AI chat request: %s", question)
    
    response = ai_response(question)
    
    if not response:
        logger.warning("AI backend failed to provide a response.")
        return "I am sorry, Keerthi. I encountered an error while processing your request."
        
    return response
