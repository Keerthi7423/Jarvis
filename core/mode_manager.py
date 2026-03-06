"""Session-scoped assistant mode state."""

from __future__ import annotations

import threading

SUPPORTED_MODES = ("normal", "study", "coding")

_DEFAULT_MODE = "normal"
_mode_lock = threading.Lock()
_current_mode = _DEFAULT_MODE


def _normalize_mode(mode: str) -> str:
    normalized = str(mode).strip().lower()
    if normalized not in SUPPORTED_MODES:
        raise ValueError(f"Unsupported mode '{mode}'. Supported modes: {', '.join(SUPPORTED_MODES)}")
    return normalized


def get_mode() -> str:
    """Return the current assistant mode for this process session."""
    with _mode_lock:
        return _current_mode


def set_mode(mode: str) -> str:
    """Set the current assistant mode and return the normalized value."""
    normalized = _normalize_mode(mode)
    global _current_mode
    with _mode_lock:
        _current_mode = normalized
        return _current_mode
