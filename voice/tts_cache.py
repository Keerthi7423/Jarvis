"""Audio cache utilities for TTS backends."""

from __future__ import annotations

import hashlib
from pathlib import Path

from config.settings import AUDIO_CACHE_DIR
from utils.logger import get_logger

logger = get_logger("jarvis.tts_cache")


def ensure_cache_dir() -> Path:
    """Ensure and return the configured TTS cache directory."""
    cache_dir = Path(AUDIO_CACHE_DIR)
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def make_cache_key(text: str, backend: str, variant: str = "") -> str:
    """Build stable cache key from backend + variant + text."""
    normalized = f"{backend.strip().lower()}|{variant.strip().lower()}|{text.strip()}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def get_cache_path(cache_key: str, extension: str = ".wav") -> Path:
    """Return canonical cache path for a key."""
    ext = extension if extension.startswith(".") else f".{extension}"
    return ensure_cache_dir() / f"{cache_key}{ext}"


def has_cache(cache_path: Path) -> bool:
    """Return True when cache file exists and is non-empty."""
    return cache_path.exists() and cache_path.stat().st_size > 0


def log_cache_hit(cache_path: Path) -> None:
    logger.info("TTS cache hit: %s", cache_path)

