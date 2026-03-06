"""Core assistant orchestrator for Jarvis wake-word command loop."""

from __future__ import annotations

import time

from config.settings import (
    ASSISTANT_IDLE_SLEEP_SECONDS,
    ASSISTANT_LISTEN_HANDOFF_SECONDS,
    ASSISTANT_WAKE_COOLDOWN_SECONDS,
    SHUTDOWN_MESSAGE,
    SUCCESS_MESSAGE,
    UNKNOWN_COMMAND_MESSAGE,
)
from commands.system_commands import execute_command, is_exit_command, resolve_mode_command
from core.acknowledgements import get_command_ack, get_wake_ack
from core.greetings import get_time_based_greeting
from core.mode_manager import get_mode, set_mode
from services.ai_service import ai_response, check_ai_fallback_health
from services.ws_bridge import WebSocketBridge
from utils.logger import get_logger
from voice.listener import listen
from voice.speaker import check_tts_backend_health, speak
from wakeword.wake_engine import wait_for_wake_word

logger = get_logger("jarvis.assistant")


class JarvisAssistant:
    """Main orchestrator for wake -> command -> execute lifecycle."""

    def __init__(self) -> None:
        self._wake_cooldown_seconds = max(1.0, min(2.0, ASSISTANT_WAKE_COOLDOWN_SECONDS))
        self._idle_sleep_seconds = max(0.2, min(0.5, ASSISTANT_IDLE_SLEEP_SECONDS))
        self._listen_handoff_seconds = max(0.0, ASSISTANT_LISTEN_HANDOFF_SECONDS)
        self._next_wake_allowed_at = 0.0
        self._ws_bridge = WebSocketBridge()
        self._ws_bridge.start()
        self._publish_mode_state()
        logger.info("Jarvis Assistant initialized.")

    def _safe_speak(self, message: str, mode: str = "normal", publish_event: bool = True) -> bool:
        """Speak safely and report whether synthesis/playback succeeded."""
        if publish_event:
            self._ws_bridge.publish("response", message)
        try:
            ok = speak(message, mode=mode)
            if not ok:
                logger.warning("Speak returned False for message '%s' (mode=%s).", message, mode)
            return ok
        except Exception as exc:
            logger.error("Failed to speak message '%s': %s", message, exc, exc_info=True)
            return False

    def _apply_wake_cooldown(self) -> None:
        """Throttle wake re-arm to avoid immediate retriggers."""
        self._next_wake_allowed_at = time.monotonic() + self._wake_cooldown_seconds

    def _publish_mode_state(self) -> None:
        """Publish the current mode so the dashboard can stay synchronized."""
        mode = get_mode()
        self._ws_bridge.publish_state("mode", mode=mode)

    def _handle_mode_command(self, requested_mode: str) -> bool:
        """Apply a supported mode change and announce it."""
        current_mode = get_mode()
        if requested_mode == current_mode:
            message = f"{requested_mode.capitalize()} mode already active."
            logger.info("Mode command received for current mode: %s", requested_mode)
            self._publish_mode_state()
            self._safe_speak(message, mode="calm")
            return True

        new_mode = set_mode(requested_mode)
        self._publish_mode_state()
        confirmation = f"{new_mode.capitalize()} mode activated."
        logger.info("Assistant mode changed: %s -> %s", current_mode, new_mode)
        self._safe_speak(confirmation, mode="calm")
        return True

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
        self._safe_speak(startup_greeting, mode="greeting")
        self._publish_mode_state()

        try:
            while True:
                now = time.monotonic()
                if now < self._next_wake_allowed_at:
                    time.sleep(min(self._idle_sleep_seconds, self._next_wake_allowed_at - now))
                    continue

                # Stay in low-cost wake mode until activation is detected.
                if not wait_for_wake_word():
                    time.sleep(self._idle_sleep_seconds)
                    continue

                self._safe_speak(get_wake_ack(), mode="calm")
                if self._listen_handoff_seconds > 0:
                    time.sleep(self._listen_handoff_seconds)

                user_text = listen()
                if not user_text:
                    logger.info("No command captured after wake trigger. Returning to wake mode.")
                    self._apply_wake_cooldown()
                    continue

                logger.info("User input recognized: %s", user_text)
                self._ws_bridge.publish("command", user_text)

                if is_exit_command(user_text):
                    logger.info("Exit command detected, shutting down gracefully.")
                    self._safe_speak(SHUTDOWN_MESSAGE)
                    return 0

                requested_mode = resolve_mode_command(user_text)
                if requested_mode:
                    self._handle_mode_command(requested_mode)
                    self._apply_wake_cooldown()
                    continue

                if execute_command(user_text):
                    logger.info("Command executed successfully.")
                    if not self._safe_speak(get_command_ack(), mode="calm"):
                        self._safe_speak(SUCCESS_MESSAGE, mode="calm")
                else:
                    logger.info("Command not recognized: %s", user_text)
                    fallback_text = ai_response(user_text)
                    if fallback_text:
                        self._safe_speak(fallback_text)
                    else:
                        self._safe_speak(UNKNOWN_COMMAND_MESSAGE)

                self._apply_wake_cooldown()

        except KeyboardInterrupt:
            logger.info("Shutdown requested from keyboard interrupt.")
            self._safe_speak(SHUTDOWN_MESSAGE)
            return 0
        except Exception as exc:
            logger.error("Unexpected error in main loop: %s", exc, exc_info=True)
            return 1
