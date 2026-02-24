"""Project configuration and constants for Jarvis Assistant.

Centralizes all configurable settings and constants used across modules.
Scalable for future enhancements like wake word detection.
"""

# ============================================================================
# VOICE INPUT SETTINGS
# ============================================================================

# Microphone listening timeout in seconds
MICROPHONE_TIMEOUT_SECONDS = 5

# Maximum time limit for a single phrase in seconds
PHRASE_TIME_LIMIT_SECONDS = 3

# Energy threshold for speech detection (0-4000 typical range)
ENERGY_THRESHOLD = 300

# ============================================================================
# TEXT-TO-SPEECH SETTINGS
# ============================================================================

# Speech rate for TTS output (words per minute)
SPEECH_RATE = 165

# ============================================================================
# ASSISTANT MESSAGES
# ============================================================================

STARTUP_MESSAGE = "System online."
SHUTDOWN_MESSAGE = "Shutting down."
SUCCESS_MESSAGE = "Done."
UNKNOWN_COMMAND_MESSAGE = "I do not know that command yet."

# ============================================================================
# EXIT COMMAND VARIATIONS (For graceful shutdown)
# ============================================================================

# These can be spoken to trigger clean assistant shutdown
# Examples: "exit jarvis", "quit", "shutdown"
EXIT_COMMAND_VARIATIONS = (
    "exit jarvis",
    "exit",
    "quit",
    "quit jarvis",
    "shutdown",
    "close",
)

# ============================================================================
# FUTURE WAKE WORD SETTINGS (Scalability)
# ============================================================================

# Wake word detection can be integrated here in future phases
# WAKE_WORD = "jarvis"
# WAKE_WORD_THRESHOLD = 0.5
