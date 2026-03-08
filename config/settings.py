"""Project configuration and constants for Jarvis Assistant.

Centralizes all configurable settings and constants used across modules.
"""

import os
from pathlib import Path
from dotenv import load_dotenv  # pyre-ignore # type: ignore

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# ============================================================================
# VOICE INPUT SETTINGS
# ============================================================================

# Microphone listening timeout in seconds
MICROPHONE_TIMEOUT_SECONDS = 5

# Maximum time limit for a single phrase in seconds
PHRASE_TIME_LIMIT_SECONDS = 7

# Energy threshold for speech detection (0-4000 typical range)
ENERGY_THRESHOLD = 200

# ============================================================================
# TEXT-TO-SPEECH SETTINGS
# ============================================================================

# Speech rate for TTS output (words per minute)
SPEECH_RATE = 160

# TTS backend selector: "elevenlabs", "coqui", "fallback"
TTS_BACKEND = os.getenv("TTS_BACKEND", "fallback").strip().lower()

# Directory for cached TTS audio files
AUDIO_CACHE_DIR = Path(os.getenv("AUDIO_CACHE_DIR", "cache/tts"))

# ElevenLabs settings (cloud AI voice)
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6ovClq8tc97oR3m").strip()
ELEVENLABS_MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5").strip()
ELEVENLABS_OUTPUT_SAMPLE_RATE = int(os.getenv("ELEVENLABS_OUTPUT_SAMPLE_RATE", "16000"))

# Coqui settings (local AI voice)
# Can be a local model path or Coqui model id like "tts_models/en/ljspeech/tacotron2-DDC".
COQUI_MODEL_PATH = os.getenv(
    "COQUI_MODEL_PATH",
    "tts_models/en/ljspeech/tacotron2-DDC",
).strip()

# ============================================================================
# ASSISTANT MESSAGES
# ============================================================================

STARTUP_MESSAGE = "System online."
SHUTDOWN_MESSAGE = "Shutting down."
SUCCESS_MESSAGE = "Done."
UNKNOWN_COMMAND_MESSAGE = "I do not know that command yet."

# ============================================================================
# ASSISTANT LOOP FLOW SETTINGS
# ============================================================================

# Cooldown after a wake cycle completes to avoid immediate retrigger.
ASSISTANT_WAKE_COOLDOWN_SECONDS = float(os.getenv("ASSISTANT_WAKE_COOLDOWN_SECONDS", "1.5"))

# Idle sleep used by the main loop when waiting/retrying to keep CPU usage low.
ASSISTANT_IDLE_SLEEP_SECONDS = float(os.getenv("ASSISTANT_IDLE_SLEEP_SECONDS", "0.25"))

# Short handoff pause between speech completion and microphone listening.
ASSISTANT_LISTEN_HANDOFF_SECONDS = float(os.getenv("ASSISTANT_LISTEN_HANDOFF_SECONDS", "0.2"))

# ============================================================================
# EXIT COMMAND VARIATIONS (For graceful shutdown)
# ============================================================================

# These can be spoken to trigger clean assistant shutdown
EXIT_COMMAND_VARIATIONS = (
    "exit jarvis",
    "exit",
    "quit",
    "quit jarvis",
    "shutdown",
    "close",
)

# ============================================================================
# WAKE WORD SETTINGS (Vosk Offline)
# ============================================================================

# Spoken keyword that activates command listening.
WAKE_WORD = "jarvis"

# Local filesystem path to a downloaded Vosk model directory.
VOSK_MODEL_PATH = Path("models") / "vosk-model-small-en-us-0.15"

# Microphone stream configuration for wake-word detection.
WAKE_SAMPLE_RATE = 16000
WAKE_BLOCK_SIZE = 8000
WAKE_CHANNELS = 1

# How long wake loop waits for queued audio before checking stream health.
WAKE_STREAM_READ_TIMEOUT_SECONDS = 1.0

# Small sleep when no audio chunk is available (keeps CPU usage low).
WAKE_IDLE_SLEEP_SECONDS = 0.02

# Enable verbose logging of Vosk final/partial recognition text.
WAKE_DEBUG_RESULTS = True

# ============================================================================
# AI FALLBACK SETTINGS (OLLAMA)
# ============================================================================

# Base URL for local Ollama server.
# Default works for local install: http://localhost:11434
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434").strip()

# Local model name available in Ollama (e.g., "llama3.2:3b", "qwen2.5:3b").
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b").strip()

# Request timeout for fallback AI calls.
AI_REQUEST_TIMEOUT_SECONDS = float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "20"))

# System prompt for concise Jarvis-style fallback responses.
OLLAMA_SYSTEM_PROMPT = (
    "You are Jarvis, a concise and helpful assistant. "
    "Respond briefly and clearly."
)

# ============================================================================
# WEBSOCKET UI BRIDGE SETTINGS
# ============================================================================

# Enable backend event streaming to Electron React dashboard.
WS_BRIDGE_ENABLED = os.getenv("WS_BRIDGE_ENABLED", "1").strip().lower() not in {"0", "false", "no"}

# Bind host/port for websocket server consumed by renderer.
WS_BRIDGE_HOST = os.getenv("WS_BRIDGE_HOST", "127.0.0.1").strip()
WS_BRIDGE_PORT = int(os.getenv("WS_BRIDGE_PORT", "8765"))

# ============================================================================
# MEMORY CONFIGURATION
# ============================================================================
MEMORY_FILE_PATH = os.getenv("MEMORY_FILE_PATH", "data/memory.json")
