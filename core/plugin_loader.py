"""Plugin loading and execution system."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Any, Callable

from commands.system_commands import _normalize_command_text  # pyre-ignore
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.plugin_loader")

PLUGIN_COMMANDS: dict[str, Callable[[], Any]] = {}

def load_plugins() -> None:
    """Scan plugins directory and load all available plugins."""
    plugins_dir = Path("plugins")
    if not plugins_dir.exists():
        logger.info("Plugins directory not found, creating one.")
        plugins_dir.mkdir(parents=True, exist_ok=True)
        (plugins_dir / "__init__.py").touch(exist_ok=True)
        return

    logger.info("Scanning for plugins in %s...", plugins_dir)
    sys.path.insert(0, str(Path.cwd()))

    for file_path in plugins_dir.glob("*.py"):
        if file_path.name == "__init__.py":
            continue

        module_name = f"plugins.{file_path.stem}"
        try:
            spec = importlib.util.spec_from_file_location(module_name, str(file_path))
            if spec and spec.loader:
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_name] = module
                spec.loader.exec_module(module)  # pyre-ignore
                
                if hasattr(module, "register") and callable(module.register):
                    commands = module.register()
                    if isinstance(commands, dict):
                        for cmd_text, func in commands.items():
                            # Normalize the registered text so it matches incoming voice commands reliably
                            normalized_cmd = _normalize_command_text(cmd_text)
                            if normalized_cmd:
                                PLUGIN_COMMANDS[normalized_cmd] = func
                                logger.info("Registered plugin command: '%s' -> '%s'", cmd_text, normalized_cmd)
        except Exception as exc:
            logger.error("Failed to load plugin %s: %s", file_path.name, exc, exc_info=True)

def execute_plugin_command(command_text: str) -> tuple[bool, str | None]:
    """Execute a plugin command if it matches.
    
    Args:
        command_text: The normalized command string.
        
    Returns:
        tuple: (was_handled: bool, response_text: str | None)
    """
    if not command_text:
        return False, None
        
    func = PLUGIN_COMMANDS.get(command_text)
    if not func:
        return False, None
        
    try:
        logger.info("Executing plugin command: '%s'", command_text)
        result = func()
        if isinstance(result, str):
            logger.info("Plugin completed with message: %s", result)
            return True, result
        return True, None
    except Exception as exc:
        from core.error_handler import handle_error  # pyre-ignore
        msg = handle_error(exc, f"Plugin execution failed for: {command_text}")
        raise RuntimeError(msg)
