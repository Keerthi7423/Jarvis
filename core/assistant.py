"""Core assistant orchestrator for Jarvis voice command loop.

This module controls the main interaction loop:
1. Listen for user input
2. Recognize speech
3. Execute commands
4. Provide voice feedback
5. Handle graceful shutdown

All speaker calls are wrapped in exception handling to prevent
TTS failures from crashing the assistant.
"""

from __future__ import annotations

import time

from config.settings import (
    STARTUP_MESSAGE,
    SHUTDOWN_MESSAGE,
    SUCCESS_MESSAGE,
    UNKNOWN_COMMAND_MESSAGE,
)
from commands.system_commands import execute_command, is_exit_command
from utils.logger import get_logger
from voice.listener import listen
from voice.speaker import speak

logger = get_logger("jarvis.assistant")

# Small delay to prevent CPU spinning when no input detected (seconds)
_IDLE_SLEEP_SECONDS = 0.1


class JarvisAssistant:
    """Main orchestrator for the Jarvis voice assistant.

    Handles the listen-execute-respond loop with:
    - Crash-proof exception handling
    - Graceful shutdown on keyboard interrupt or exit command
    - Structured logging for debugging
    - Thread-safe speaker operations
    - CPU-efficient idle waiting
    """

    def __init__(self) -> None:
        """Initialize the assistant."""
        logger.info("Jarvis Assistant initialized.")

    def _safe_speak(self, message: str) -> None:
        """Safely speak a message without crashing on failures.

        Wraps speak() in additional exception handling to ensure
        TTS failures never crash the assistant.

        Args:
            message: Text to speak.
        """
        try:
            speak(message)
        except Exception as exc:
            logger.error(
                "Failed to speak message '%s': %s",
                message,
                exc,
                exc_info=True,
            )

    def run(self) -> int:
        """Start the main voice command loop.

        Handles all exceptions gracefully to ensure crash-proof operation.

        Returns:
            Exit code (0 for clean shutdown, non-zero for critical errors).
        """
        logger.info("Starting Jarvis voice assistant...")
        self._safe_speak(STARTUP_MESSAGE)

        try:
            while True:
                # Listen for user input
                user_text = listen()
                if not user_text:
                    # Prevent CPU spinning on idle
                    time.sleep(_IDLE_SLEEP_SECONDS)
                    continue

                # Log recognized input
                print(f"You said: {user_text}")
                logger.info("User input recognized: %s", user_text)

                # Check for exit command
                if is_exit_command(user_text):
                    logger.info("Exit command detected, shutting down gracefully.")
                    self._safe_speak(SHUTDOWN_MESSAGE)
                    return 0

                # Execute command and provide feedback
                if execute_command(user_text):
                    logger.info("Command executed successfully.")
                    self._safe_speak(SUCCESS_MESSAGE)
                else:
                    logger.info("Command not recognized: %s", user_text)
                    self._safe_speak(UNKNOWN_COMMAND_MESSAGE)

        except KeyboardInterrupt:
            logger.info("Shutdown requested from keyboard interrupt.")
            self._safe_speak(SHUTDOWN_MESSAGE)
            return 0
        except Exception as exc:
            logger.error(
                "Unexpected error in main loop: %s",
                exc,
                exc_info=True,
            )
            return 1