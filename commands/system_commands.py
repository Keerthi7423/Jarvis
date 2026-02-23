"""System command execution layer for Jarvis voice actions."""

from __future__ import annotations

import subprocess
from typing import Sequence

from utils.logger import get_logger

logger = get_logger("jarvis.system_commands")


CHROME_CANDIDATES: tuple[Sequence[str], ...] = (
    ("chrome",),
    ("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",),
    ("C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",),
)

VSCODE_CANDIDATES: tuple[Sequence[str], ...] = (
    ("code",),
    ("C:\\Program Files\\Microsoft VS Code\\Code.exe",),
    ("C:\\Users\\intel\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",),
)


COMMAND_MAP: dict[str, tuple[Sequence[str], ...]] = {
    "open chrome": CHROME_CANDIDATES,
    "open vs code": VSCODE_CANDIDATES,
    "open visual studio code": VSCODE_CANDIDATES,
}


def _launch_first_available(candidates: tuple[Sequence[str], ...]) -> bool:
    """Try command candidates until one launches successfully."""
    for command in candidates:
        try:
            subprocess.Popen(command)
            logger.info("Executed command: %s", " ".join(command))
            return True
        except FileNotFoundError:
            continue
        except Exception as exc:
            logger.error("Failed to execute '%s': %s", " ".join(command), exc)
            return False

    return False


def execute_command(text: str) -> bool:
    """Execute supported system command from recognized speech text."""
    command_text = text.strip().lower()
    if not command_text:
        return False

    candidates = COMMAND_MAP.get(command_text)
    if not candidates:
        logger.info("Unknown command: %s", command_text)
        return False

    success = _launch_first_available(candidates)
    if not success:
        logger.error("Command recognized but no executable was launched: %s", command_text)
    return success
