"""Social platform commands for Jarvis voice assistant.

This module provides functions to open popular online platforms using a web browser.
"""

import webbrowser
from typing import Optional, Tuple
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.social_commands")

# Mapping of keywords to URLs and display names
SOCIAL_MAP = {
    "github": ("https://github.com", "GitHub"),
    "youtube": ("https://youtube.com", "YouTube"),
    "spotify": ("https://open.spotify.com", "Spotify"),
    "linkedin": ("https://linkedin.com", "LinkedIn"),
}

def open_github() -> bool:
    """Launch GitHub in the default browser."""
    return _open_url(SOCIAL_MAP["github"][0], SOCIAL_MAP["github"][1])

def open_youtube() -> bool:
    """Launch YouTube in the default browser."""
    return _open_url(SOCIAL_MAP["youtube"][0], SOCIAL_MAP["youtube"][1])

def open_spotify() -> bool:
    """Launch Spotify in the default browser."""
    return _open_url(SOCIAL_MAP["spotify"][0], SOCIAL_MAP["spotify"][1])

def open_linkedin() -> bool:
    """Launch LinkedIn in the default browser."""
    return _open_url(SOCIAL_MAP["linkedin"][0], SOCIAL_MAP["linkedin"][1])

def _open_url(url: str, name: str) -> bool:
    """Helper to open a URL and log the action."""
    try:
        webbrowser.open(url)
        logger.info(f"Opened {name}: {url}")
        return True
    except Exception as e:
        logger.error(f"Failed to open {name}: {e}")
        return False

def execute_social_command(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check if the text contains a social command and execute it.
    
    Returns:
        A tuple of (handled, response_message).
    """
    lowered_text = text.lower().strip()
    
    # Simple keyword matching for "open <platform>"
    for key, (url, name) in SOCIAL_MAP.items():
        if f"open {key}" in lowered_text or f"launch {key}" in lowered_text:
            success = _open_url(url, name)
            if success:
                return True, f"Opening {name}."
            else:
                return True, f"I encountered an error trying to open {name}."
                
    return False, None
