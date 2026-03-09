"""Core assistant orchestrator for Jarvis continuous listening loop."""

from __future__ import annotations

import time

from config.settings import (  # pyre-ignore
    ASSISTANT_IDLE_SLEEP_SECONDS,
    SHUTDOWN_MESSAGE,
    SUCCESS_MESSAGE,
    UNKNOWN_COMMAND_MESSAGE,
)
from commands.system_commands import _normalize_command_text, execute_command, is_exit_command, resolve_mode_command  # pyre-ignore
from commands.workflows import execute_workflow, get_workflow_success_message, resolve_workflow  # pyre-ignore
from core.acknowledgements import get_command_ack, get_wake_ack  # pyre-ignore
from core.ai_chat import ask_ai  # pyre-ignore
from core.event_monitor import start_event_monitor  # pyre-ignore
from core.greetings import get_time_based_greeting  # pyre-ignore
from core.memory_manager import delete_memory, get_memory, save_memory  # pyre-ignore
from core.mode_manager import get_mode, set_mode  # pyre-ignore
from core.plugin_loader import execute_plugin_command, load_plugins  # pyre-ignore
from services.ai_service import ai_response, check_ai_fallback_health  # pyre-ignore
from services.ws_bridge import WebSocketBridge  # pyre-ignore
from core.logger import get_logger, log_wake_word, log_speech_recognized, log_command_execution, log_error  # pyre-ignore
from voice.listener import listen  # pyre-ignore
from voice.speaker import check_tts_backend_health, speak  # pyre-ignore
from wakeword.wake_engine import wait_for_wake_word  # pyre-ignore

logger = get_logger("jarvis.assistant")


class JarvisAssistant:
    """Main orchestrator for continuous listening lifecycle."""

    def __init__(self) -> None:
        self._idle_sleep_seconds = max(0.2, min(0.5, ASSISTANT_IDLE_SLEEP_SECONDS))
        self._has_greeted = False
        self._ws_bridge = WebSocketBridge(on_connect_cb=self._on_ui_connect)
        self._ws_bridge.start()
        self._publish_mode_state()
        logger.info("Jarvis Assistant initialized in continuous listening mode.")

    def _on_ui_connect(self) -> None:
        """Triggered when the Electron dashboard connects."""
        if not self._has_greeted:
            logger.info("UI connected. Triggering startup greeting.")
            startup_greeting = get_time_based_greeting()
            self._safe_speak(startup_greeting, mode="greeting")
            self._has_greeted = True

    def _safe_speak(self, message: str, mode: str = "normal", publish_event: bool = True) -> bool:
        """Speak safely and report whether synthesis/playback succeeded."""
        if publish_event:
            self._ws_bridge.publish("response", message)
        try:
            ok = speak(message, mode=mode)
            return ok
        except Exception as exc:
            log_error(exc, "safe_speak")
            return False

    def _publish_mode_state(self) -> None:
        """Publish the current mode so the dashboard can stay synchronized."""
        mode = get_mode()
        self._ws_bridge.publish_state("mode", mode=mode)

    def _handle_mode_command(self, requested_mode: str) -> bool:
        """Apply a supported mode change and announce it."""
        current_mode = get_mode()
        if requested_mode == current_mode:
            message = f"{requested_mode.capitalize()} mode already active."
            self._publish_mode_state()
            self._safe_speak(message, mode="calm")
            return True

        new_mode = set_mode(requested_mode)
        self._publish_mode_state()
        confirmation = f"{new_mode.capitalize()} mode activated."
        self._safe_speak(confirmation, mode="calm")
        return True

    def run(self) -> int:
        """Run assistant loop forever until exit command or interrupt."""
        logger.info("Starting Jarvis voice assistant...")

        start_event_monitor(lambda msg: self._safe_speak(msg, mode="urgent"))
        
        load_plugins()

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
        
        self._publish_mode_state()

        try:
            while True:
                time.sleep(self._idle_sleep_seconds)

                # Continuous listening: listen -> recognize -> execute -> speak
                try:
                    user_text = listen()
                    if user_text is None or user_text == "":
                        continue

                    if user_text == "__UNRECOGNIZED__":
                        import random
                        fallback_msg = random.choice(["I didn't catch that.", "Please repeat."])
                        self._safe_speak(fallback_msg, mode="calm")
                        continue

                    # Handled by listener log_speech_recognized
                    self._ws_bridge.publish("command", user_text)

                    command_text = _normalize_command_text(user_text)
                    log_command_execution(command_text)

                    dangerous_commands = ["delete file", "shutdown", "exit", "quit", "rm", "remove", "wipe"]
                    is_dangerous = any(cmd in command_text.lower() for cmd in dangerous_commands)

                    if is_dangerous:
                        self._safe_speak(f"Did you say {command_text}?")
                        confirmation = listen()
                        if not confirmation or confirmation == "__UNRECOGNIZED__":
                            self._safe_speak("Command cancelled.", mode="calm")
                            continue
                        if not any(word in confirmation.lower() for word in ["yes", "yeah", "yep", "sure", "do it"]):
                            self._safe_speak("Command cancelled.", mode="calm")
                            continue

                    if is_exit_command(user_text):
                        logger.info("Exit command detected, shutting down gracefully.")
                        self._safe_speak(SHUTDOWN_MESSAGE)
                        return 0

                    requested_mode = resolve_mode_command(user_text)
                    if requested_mode:
                        self._handle_mode_command(requested_mode)
                        continue

                    if get_mode() == "chat":
                        ai_reply = ask_ai(user_text)
                        self._safe_speak(ai_reply)
                        continue

                    # MEMORY LOGIC
                    if command_text.startswith("my name is"):
                        name = command_text[len("my name is"):].strip().title()
                        if name:
                            save_memory("name", name)
                            self._safe_speak(f"I will remember your name is {name}.", mode="calm")
                            continue
                    elif command_text == "what is my name":
                        name = get_memory("name")
                        if name:
                            self._safe_speak(f"Your name is {name}.", mode="calm")
                        else:
                            self._safe_speak("I do not know your name yet.", mode="calm")
                        continue
                    
                    workflow_name = resolve_workflow(command_text)
                    if workflow_name:
                        if execute_workflow(workflow_name, execute_command):
                            success_message = get_workflow_success_message(workflow_name)
                            self._safe_speak(success_message, mode="calm")
                        else:
                            self._safe_speak("Workflow execution failed.", mode="calm")
                        continue

                    plugin_handled, plugin_response = execute_plugin_command(command_text)
                    if plugin_handled:
                        if plugin_response:
                            self._safe_speak(plugin_response, mode="calm")
                        else:
                            if not self._safe_speak(get_command_ack(), mode="calm"):
                                self._safe_speak(SUCCESS_MESSAGE, mode="calm")
                        continue

                    if execute_command(user_text):
                        if not self._safe_speak(get_command_ack(), mode="calm"):
                            self._safe_speak(SUCCESS_MESSAGE, mode="calm")
                    else:
                        fallback_text = ask_ai(user_text)
                        self._safe_speak(fallback_text)
                        
                except RuntimeError as exc:
                    self._safe_speak(str(exc), mode="calm")
                except Exception as exc:
                    log_error(exc, "command_execution_block")
                    self._safe_speak("An unexpected error occurred while executing the command.")

        except KeyboardInterrupt:
            logger.info("Shutdown requested from keyboard interrupt.")
            self._safe_speak(SHUTDOWN_MESSAGE)
            return 0
        except Exception as exc:
            log_error(exc, "main_assistant_loop")
            return 1
            
        return 0
