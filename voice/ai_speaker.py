"""AI TTS backends (ElevenLabs/Coqui) with cache-aware synthesis."""

from __future__ import annotations

import json
import re
import threading
import urllib.error
import urllib.request
import wave
from pathlib import Path
from typing import Any

from config.settings import (
    AI_REQUEST_TIMEOUT_SECONDS,
    COQUI_MODEL_PATH,
    ELEVENLABS_API_KEY,
    ELEVENLABS_MODEL_ID,
    ELEVENLABS_OUTPUT_SAMPLE_RATE,
    ELEVENLABS_VOICE_ID,
    TTS_BACKEND,
)
from utils.logger import get_logger
from voice.ssml_builder import build_ssml
from voice.tts_cache import get_cache_path, has_cache, log_cache_hit, make_cache_key

logger = get_logger("jarvis.ai_speaker")

_COQUI_ENGINE: Any | None = None
_COQUI_LOCK = threading.Lock()
_SSML_TAG_PATTERN = re.compile(r"<[^>]+>")


def _play_audio_file(path: Path) -> bool:
    """Play wav file with platform-native player where possible."""
    try:
        import winsound  # type: ignore

        winsound.PlaySound(str(path), winsound.SND_FILENAME)
        return True
    except Exception as exc:
        logger.error("Audio playback failed for '%s': %s", path, exc, exc_info=True)
        return False


def _write_pcm_as_wav(raw_pcm: bytes, output_path: Path, sample_rate: int) -> None:
    """Wrap raw 16-bit mono PCM bytes into a wav file."""
    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(raw_pcm)


def _synthesize_elevenlabs_to_cache(text: str, output_path: Path) -> bool:
    """Synthesize text with ElevenLabs and store wav in cache."""
    if not ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY missing; cannot use elevenlabs backend.")
        return False

    try:
        endpoint = (
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
            f"?output_format=pcm_{ELEVENLABS_OUTPUT_SAMPLE_RATE}"
        )
        payload = {
            "text": text,
            "model_id": ELEVENLABS_MODEL_ID,
        }
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=AI_REQUEST_TIMEOUT_SECONDS) as response:
            audio_pcm = response.read()

        if not audio_pcm:
            logger.error("ElevenLabs returned empty audio payload.")
            return False

        _write_pcm_as_wav(audio_pcm, output_path, ELEVENLABS_OUTPUT_SAMPLE_RATE)
        logger.info("ElevenLabs synthesized and cached audio: %s", output_path)
        return True

    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        logger.error("ElevenLabs HTTP error %s: %s", exc.code, body)
        return False
    except urllib.error.URLError as exc:
        logger.error("ElevenLabs network error: %s", exc)
        return False
    except Exception as exc:
        logger.error("ElevenLabs synthesis failed: %s", exc, exc_info=True)
        return False


def _get_coqui_engine() -> Any:
    """Lazy-load Coqui model engine."""
    global _COQUI_ENGINE
    if _COQUI_ENGINE is not None:
        return _COQUI_ENGINE

    with _COQUI_LOCK:
        if _COQUI_ENGINE is not None:
            return _COQUI_ENGINE

        from TTS.api import TTS  # type: ignore

        _COQUI_ENGINE = TTS(model_name=COQUI_MODEL_PATH)
        logger.info("Coqui model loaded: %s", COQUI_MODEL_PATH)
    return _COQUI_ENGINE


def _synthesize_coqui_to_cache(text: str, output_path: Path) -> bool:
    """Synthesize text with local Coqui model and store wav in cache."""
    try:
        tts_engine = _get_coqui_engine()
        tts_engine.tts_to_file(text=text, file_path=str(output_path))
        if not output_path.exists() or output_path.stat().st_size == 0:
            logger.error("Coqui synthesis produced empty file: %s", output_path)
            return False
        logger.info("Coqui synthesized and cached audio: %s", output_path)
        return True
    except ModuleNotFoundError:
        logger.error("Coqui TTS package not installed. Install `TTS` to use backend=coqui.")
        return False
    except Exception as exc:
        logger.error("Coqui synthesis failed: %s", exc, exc_info=True)
        return False


def _backend_variant(backend: str) -> str:
    """Variant string for cache key uniqueness per backend settings."""
    if backend == "elevenlabs":
        return f"{ELEVENLABS_VOICE_ID}|{ELEVENLABS_MODEL_ID}|{ELEVENLABS_OUTPUT_SAMPLE_RATE}"
    if backend == "coqui":
        return COQUI_MODEL_PATH
    return "fallback"


def _backend_supports_ssml(backend: str) -> bool:
    """Return whether backend accepts SSML input directly."""
    return backend == "elevenlabs"


def _strip_ssml_tags(text: str) -> str:
    """Strip SSML tags when speaking through non-SSML backends."""
    return _SSML_TAG_PATTERN.sub("", text).strip()


def speak_with_ai(text: str, emotion: str = "normal") -> bool:
    """Speak text using configured AI backend and audio cache.

    Returns:
        True when AI synthesis and playback succeeded, else False.
    """
    message = text.strip()
    if not message:
        return False

    backend = TTS_BACKEND.strip().lower()
    if backend not in {"elevenlabs", "coqui"}:
        logger.info("AI TTS backend '%s' not enabled; skip AI speaker.", backend)
        return False

    logger.info("Selected speech mode: %s", emotion)
    ssml_text = build_ssml(message, emotion)
    if _backend_supports_ssml(backend):
        speech_input = ssml_text
    else:
        logger.info("Backend '%s' does not support SSML; stripping SSML tags.", backend)
        speech_input = _strip_ssml_tags(ssml_text)
    if not speech_input:
        logger.warning("Speech input empty after SSML processing.")
        return False

    variant = _backend_variant(backend)
    cache_key = make_cache_key(speech_input, backend, variant)
    cache_path = get_cache_path(cache_key, ".wav")

    if has_cache(cache_path):
        log_cache_hit(cache_path)
        return _play_audio_file(cache_path)

    if backend == "elevenlabs":
        ok = _synthesize_elevenlabs_to_cache(speech_input, cache_path)
    else:
        ok = _synthesize_coqui_to_cache(speech_input, cache_path)

    if not ok:
        return False

    logger.info("AI TTS backend used: %s", backend)
    return _play_audio_file(cache_path)
