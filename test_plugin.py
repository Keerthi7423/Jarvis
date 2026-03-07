import os
import sys

# Ensure Jarvis root is in path
sys.path.insert(0, os.path.abspath("."))

from core.plugin_loader import load_plugins, execute_plugin_command  # pyre-ignore
from commands.system_commands import _normalize_command_text  # pyre-ignore

def test():
    print("Loading plugins...")
    load_plugins()
    
    raw_command = "what is the weather"
    command_text = _normalize_command_text(raw_command)
    print(f"\nTesting normalized command '{command_text}'...")
    handled, response = execute_plugin_command(command_text)
    
    print(f"Handled: {handled}")
    print(f"Response: {response}")

if __name__ == "__main__":
    test()
