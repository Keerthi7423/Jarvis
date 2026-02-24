"""Centralized logging utility for consistent console logs.

Provides structured logging across all project modules.
Allows future integration with file logging or third-party services.
"""

import logging
from typing import Optional

# Module-level cache for logger instances
_LOGGERS: dict[str, logging.Logger] = {}


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Return a configured logger instance for the project.

    Args:
        name: Logger name (typically module name). Defaults to 'jarvis'.

    Returns:
        Configured logging.Logger instance.
    """
    logger_name = name or "jarvis"

    # Return cached logger if already configured
    if logger_name in _LOGGERS:
        return _LOGGERS[logger_name]

    logger = logging.getLogger(logger_name)
    if logger.handlers:
        _LOGGERS[logger_name] = logger
        return logger

    # Configure logger with standard format
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

    _LOGGERS[logger_name] = logger
    return logger
