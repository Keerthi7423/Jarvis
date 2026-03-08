"""Persistent memory system for Jarvis Assistant."""

import json
from pathlib import Path
from config.settings import MEMORY_FILE_PATH  # pyre-ignore # type: ignore
from utils.logger import get_logger  # pyre-ignore # type: ignore

logger = get_logger("jarvis.memory_manager")

_memory_cache: dict[str, str] = {}
_memory_file = Path(MEMORY_FILE_PATH)

def _ensure_file_exists() -> None:
    """Ensure the memory file exists securely without crashing on errors."""
    try:
        if not _memory_file.parent.exists():
            _memory_file.parent.mkdir(parents=True, exist_ok=True)
        if not _memory_file.exists():
            with open(_memory_file, "w", encoding="utf-8") as f:
                json.dump({}, f)
    except Exception as exc:
        logger.error("Failed creating memory file: %s", exc)

def _load_memory() -> None:
    """Load memory from disk to cache on startup. Will gracefully handle corruption."""
    global _memory_cache
    _ensure_file_exists()
    try:
        if not _memory_file.exists():
            _memory_cache = {}
            return
            
        with open(_memory_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                _memory_cache = {}
            else:
                _memory_cache = json.loads(content)
        logger.info("Memory loaded successfully.")
    except json.JSONDecodeError as exc:
        logger.error("Memory file corrupted, starting fresh: %s", exc)
        _memory_cache = {}
    except Exception as exc:
        logger.error("Failed to load memory: %s", exc)
        _memory_cache = {}

def _save_to_disk() -> None:
    """Save the memory back to the JSON file safely."""
    try:
        _ensure_file_exists()
        with open(_memory_file, "w", encoding="utf-8") as f:
            json.dump(_memory_cache, f, indent=4)
        logger.debug("Memory persisted to disk.")
    except Exception as exc:
        logger.error("Failed to save memory to disk: %s", exc)

def save_memory(key: str, value: str) -> None:
    """Save a crucial key-value pair to memory."""
    _memory_cache[key] = value
    _save_to_disk()
    logger.info("Saved memory: %s = %s", key, value)

def get_memory(key: str) -> str | None:
    """Retrieve a value from memory."""
    return _memory_cache.get(key)

def delete_memory(key: str) -> bool:
    """Delete a value from memory."""
    if key in _memory_cache:
        _memory_cache.pop(key, None)
        _save_to_disk()
        logger.info("Deleted memory: %s", key)
        return True
    return False


# Initialize the cache automatically when module loads
_load_memory()
