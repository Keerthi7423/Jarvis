"""Entry point for Phase-1 Day-4 Jarvis voice command loop."""

from commands.system_commands import execute_command
from utils.logger import get_logger
from voice.listener import listen
from voice.speaker import speak

logger = get_logger("jarvis.main")


UNKNOWN_COMMAND_REPLY = "I do not know that command yet."


def run_voice_loop() -> int:
    """Run a listen/execute/speak loop until interrupted."""
    logger.info("Starting Jarvis Phase-1 Day-4 command loop...")
    speak("System online.")

    try:
        while True:
            user_text = listen()
            if not user_text:
                continue

            print(f"You said: {user_text}")

            if execute_command(user_text):
                speak("Done.")
            else:
                speak(UNKNOWN_COMMAND_REPLY)

    except KeyboardInterrupt:
        logger.info("Shutdown requested from keyboard interrupt.")
        speak("Shutting down.")
        return 0


if __name__ == "__main__":
    raise SystemExit(run_voice_loop())
