"""Core assistant orchestrator for Jarvis wake-word command loop."""

from __future__ import annotations

from config.settings import (
    SHUTDOWN_MESSAGE,
    SUCCESS_MESSAGE,
    UNKNOWN_COMMAND_MESSAGE,
)
from commands.system_commands import execute_command, is_exit_command
from core.greetings import get_time_based_greeting
from services.ai_service import ai_response, check_ai_fallback_health
from utils.logger import get_logger
from voice.listener import listen
from voice.speaker import check_tts_backend_health, speak
from wakeword.wake_engine import wait_for_wake_word

logger = get_logger("jarvis.assistant")


class JarvisAssistant:
    """Main orchestrator for wake -> command -> execute lifecycle."""

    def __init__(self) -> None:
        logger.info("Jarvis Assistant initialized.")

    def _safe_speak(self, message: str, emotion: str = "normal") -> None:
        """Speak without allowing TTS failures to crash the loop."""
        try:
            speak(message, emotion=emotion)
        except Exception as exc:
            logger.error("Failed to speak message '%s': %s", message, exc, exc_info=True)

    def run(self) -> int:
        """Run assistant loop forever until exit command or interrupt."""
        logger.info("Starting Jarvis voice assistant...")
        tts_ready, tts_status = check_tts_backend_health()
        if tts_ready:
            logger.info(tts_status)
        else:
            logger.warning(tts_status)
        ai_ready, ai_status = check_ai_fallback_health()
        if ai_ready:
            logger.info(ai_status)
        else:
            logger.warning(ai_status)
        startup_greeting = get_time_based_greeting()
        self._safe_speak(startup_greeting, emotion="greeting")

        try:
            while True:
                # Stay in low-cost wake mode until activation is detected.
                if not wait_for_wake_word():
                    continue

                self._safe_speak("Yes?")

                user_text = listen()
                if not user_text:
                    logger.info("No command captured after wake trigger. Returning to wake mode.")
                    continue

                logger.info("User input recognized: %s", user_text)
                print(f"You said: {user_text}")

                if is_exit_command(user_text):
                    logger.info("Exit command detected, shutting down gracefully.")
                    self._safe_speak(SHUTDOWN_MESSAGE)
                    return 0

                if execute_command(user_text):
                    logger.info("Command executed successfully.")
                    self._safe_speak(SUCCESS_MESSAGE)
                else:
                    logger.info("Command not recognized: %s", user_text)
                    fallback_text = ai_response(user_text)
                    if fallback_text:
                        self._safe_speak(fallback_text)
                    else:
                        self._safe_speak(UNKNOWN_COMMAND_MESSAGE)

        except KeyboardInterrupt:
            logger.info("Shutdown requested from keyboard interrupt.")
            self._safe_speak(SHUTDOWN_MESSAGE)
            return 0
        except Exception as exc:
            logger.error("Unexpected error in main loop: %s", exc, exc_info=True)
            return 1
