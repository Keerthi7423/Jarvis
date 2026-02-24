"""Entry point for Jarvis Phase-1 voice assistant.

This module only handles initialization and startup.
All logic is delegated to the core assistant module.
"""

from core.assistant import JarvisAssistant
from utils.logger import get_logger

logger = get_logger("jarvis.main")


if __name__ == "__main__":
    try:
        logger.info("Initializing Jarvis Assistant...")
        assistant = JarvisAssistant()
        exit_code = assistant.run()
        raise SystemExit(exit_code)
    except Exception as exc:
        logger.error("Fatal error during initialization: %s", exc)
        raise SystemExit(1)
