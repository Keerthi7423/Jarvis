"""System command execution layer for Jarvis voice actions.
# Pyre reload

This module:
1. Maps voice commands to executable paths
2. Validates and launches applications
3. Provides structured error handling

Commands are centralized here for easy extension with new capabilities.
Future phases can add:
- Web API calls
- File operations
- Custom integrations
"""

from __future__ import annotations

import re
import subprocess
from typing import Sequence

from utils.logger import get_logger  # pyre-ignore

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

TERMINAL_CANDIDATES: tuple[Sequence[str], ...] = (
    ("wt",),
    ("powershell",),
    ("cmd",),
)

EXPLORER_CANDIDATES: tuple[Sequence[str], ...] = (
    ("explorer", "."),
)

STUDY_CANDIDATES: tuple[Sequence[str], ...] = (
    ("explorer", "Documents"),
)


COMMAND_MAP: dict[str, tuple[Sequence[str], ...]] = {
    "open chrome": CHROME_CANDIDATES,
    "open vs code": VSCODE_CANDIDATES,
    "open visual studio code": VSCODE_CANDIDATES,
    "open terminal": TERMINAL_CANDIDATES,
    "open project folder": EXPLORER_CANDIDATES,
    "open study materials": STUDY_CANDIDATES,
}

MODE_COMMAND_MAP: dict[str, str] = {
    "activate study mode": "study",
    "activate coding mode": "coding",
    "return to normal mode": "normal",
}

_NOISE_WORDS = {
    "jarvis",
    "please",
    "can",
    "you",
    "kindly",
    "the",
    "app",
    "application",
    "for",
    "me",
    "now",
}
_NON_ALNUM_PATTERN = re.compile(r"[^a-z0-9\s]+")
_MULTISPACE_PATTERN = re.compile(r"\s+")


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


def _normalize_command_text(text: str) -> str:
    """Normalize spoken text to improve command matching reliability."""
    lowered = text.strip().lower()
    if not lowered:
        return ""

    cleaned = _NON_ALNUM_PATTERN.sub(" ", lowered)
    tokens = [token for token in _MULTISPACE_PATTERN.split(cleaned) if token]
    filtered = [token for token in tokens if token not in _NOISE_WORDS]
    return " ".join(filtered)


def _resolve_candidates(command_text: str) -> tuple[Sequence[str], ...] | None:
    """Resolve command intent from normalized text."""
    # Exact aliases first.
    direct = COMMAND_MAP.get(command_text)
    if direct:
        return direct

    words = set(command_text.split())
    if not words:
        return None

    action_words = {"open", "launch", "start", "run"}
    has_action = bool(words & action_words)
    if not has_action:
        return None

    if "chrome" in words or "browser" in words:
        return CHROME_CANDIDATES

    if {"vscode", "code"} & words:
        return VSCODE_CANDIDATES
    if {"visual", "studio", "code"}.issubset(words):
        return VSCODE_CANDIDATES

    return None


def is_exit_command(text: str) -> bool:
    """Check if the user is requesting to exit the assistant.

    Args:
        text: Recognized speech text from user.

    Returns:
        True if user said exit command, False otherwise.
    """
    command_text = _normalize_command_text(text)
    return command_text in {"exit", "quit", "shutdown", "close"}


def resolve_mode_command(text: str) -> str | None:
    """Return the requested assistant mode if the text is a mode command."""
    command_text = _normalize_command_text(text)
    if not command_text:
        return None
    return MODE_COMMAND_MAP.get(command_text)


def execute_command(text: str) -> bool:
    """Execute supported system command from recognized speech text.

    Args:
        text: Recognized speech text from user.

    Returns:
        True if command was recognized and executed successfully,
        False if command was not recognized or execution failed.
    """
    command_text = _normalize_command_text(text)
    if not command_text:
        return False

    # Check for exit command (handled separately in assistant)
    if is_exit_command(command_text):
        logger.info("Exit command requested: %s", command_text)
        return False

    candidates = _resolve_candidates(command_text)
    if not candidates:
        logger.info("Unknown command after normalization: %s", command_text)
        return False

    try:
        success = _launch_first_available(candidates)
        if success:
            logger.info("Command executed successfully: %s", command_text)
            return True
        else:
            logger.warning("Command recognized but no executable was launched: %s", command_text)
            raise RuntimeError(f"Execution failed for {command_text}")
    except Exception as exc:
        from core.error_handler import handle_error
        msg = handle_error(exc, f"Command execution failed: {text}")
        raise RuntimeError(msg)
