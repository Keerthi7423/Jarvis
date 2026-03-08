"""Offline wake-word detection engine using Vosk + sounddevice."""

from __future__ import annotations

import json
import queue
import re
import time
from typing import Any
from pathlib import Path

try:
    import sounddevice as sd  # pyre-ignore
except ImportError:  # pragma: no cover - environment dependent
    sd = None

try:
    from vosk import KaldiRecognizer, Model  # pyre-ignore
except ImportError:  # pragma: no cover - environment dependent
    KaldiRecognizer = None
    Model = None

from config.settings import (  # pyre-ignore
    VOSK_MODEL_PATH,
    WAKE_BLOCK_SIZE,
    WAKE_CHANNELS,
    WAKE_DEBUG_RESULTS,
    WAKE_IDLE_SLEEP_SECONDS,
    WAKE_SAMPLE_RATE,
    WAKE_STREAM_READ_TIMEOUT_SECONDS,
    WAKE_WORD,
)
from utils.logger import get_logger  # pyre-ignore

logger = get_logger("jarvis.wakeword")

_MODEL: Any | None = None
_MODEL_ERROR_LOGGED = False
_ERROR_BACKOFF_SECONDS = 1.0


def _validate_runtime_dependencies() -> None:
    if sd is None:
        raise RuntimeError("sounddevice is not installed. Install requirements first.")
    if Model is None or KaldiRecognizer is None:
        raise RuntimeError("vosk is not installed. Install requirements first.")


def _load_model(model_path: Path) -> Any:
    """Load and cache the Vosk model."""
    global _MODEL, _MODEL_ERROR_LOGGED

    if _MODEL is not None:
        return _MODEL

    path = Path(model_path).expanduser()
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()
    else:
        path = path.resolve()

    if not path.exists() or not path.is_dir():
        raise FileNotFoundError(
            f"Vosk model path not found or invalid directory: {path}. "
            "Download an English model and set VOSK_MODEL_PATH correctly in config/settings.py."
        )

    logger.info("Loading Vosk model from: %s", path)
    if Model is None:
        raise RuntimeError("Vosk Model class is not available.")
    _MODEL = Model(str(path))
    _MODEL_ERROR_LOGGED = False
    logger.info("Vosk model loaded.")
    return _MODEL


def _parse_result_text(raw_json: str, key: str) -> str:
    """Parse and normalize text payload from Vosk JSON result."""
    try:
        payload = json.loads(raw_json)
    except json.JSONDecodeError:
        return ""
    return str(payload.get(key, "")).strip().lower()


def _normalize_for_match(text: str) -> str:
    """Normalize text to robustly compare wake phrases.

    Strategy:
    - lowercase
    - keep only letters/numbers/spaces
    - collapse whitespace
    - remove spaces for substring match robustness
    """
    lowered = text.strip().lower()
    alnum_space = re.sub(r"[^a-z0-9\s]+", " ", lowered)
    compact_spaced = " ".join(alnum_space.split())
    return compact_spaced.replace(" ", "")


def _is_wake_detected(candidate_text: str, wake_word: str) -> bool:
    """Return True when wake word appears in candidate text."""
    normalized_candidate = _normalize_for_match(candidate_text)
    normalized_wake = _normalize_for_match(wake_word)
    if not normalized_candidate or not normalized_wake:
        return False
    return normalized_wake in normalized_candidate


def wait_for_wake_word() -> bool:
    """Block until wake word is detected from microphone stream.

    Returns:
        True when the wake word is detected.
    """
    global _MODEL_ERROR_LOGGED

    try:
        _validate_runtime_dependencies()
        model = _load_model(Path(VOSK_MODEL_PATH))
    except Exception as exc:
        if not _MODEL_ERROR_LOGGED:
            logger.error("Wake engine model initialization failed: %s", exc, exc_info=True)
            _MODEL_ERROR_LOGGED = True
        time.sleep(_ERROR_BACKOFF_SECONDS)
        return False

    idle_sleep_seconds = max(0.2, min(0.5, WAKE_IDLE_SLEEP_SECONDS))
    if KaldiRecognizer is None:
        raise RuntimeError("Vosk KaldiRecognizer is not available.")
    recognizer = KaldiRecognizer(model, WAKE_SAMPLE_RATE)
    recognizer.SetWords(False)
    wake_token = WAKE_WORD.strip()
    audio_queue: queue.Queue[bytes] = queue.Queue(maxsize=32)

    def _audio_callback(indata: Any, frames: int, callback_time: Any, status: Any) -> None:
        if status:
            logger.warning("Wake stream audio status: %s", status)
        try:
            audio_queue.put_nowait(bytes(indata))
        except queue.Full:
            # Drop oldest chunk to stay real-time and keep CPU/memory bounded.
            try:
                audio_queue.get_nowait()
            except queue.Empty:
                pass
            try:
                audio_queue.put_nowait(bytes(indata))
            except queue.Full:
                pass

    logger.info(
        "Wake engine armed. Waiting for wake word: '%s' | model='%s' | sample_rate=%d",
        wake_token,
        Path(VOSK_MODEL_PATH).expanduser(),
        WAKE_SAMPLE_RATE,
    )

    try:
        if sd is None:
            raise RuntimeError("sounddevice is not available.")
        with sd.RawInputStream(  # pyre-ignore
            samplerate=WAKE_SAMPLE_RATE,
            blocksize=WAKE_BLOCK_SIZE,
            dtype="int16",
            channels=WAKE_CHANNELS,
            callback=_audio_callback,
        ):
            while True:
                try:
                    # Timeout avoids indefinite blocking if callback stalls.
                    audio_chunk = audio_queue.get(timeout=WAKE_STREAM_READ_TIMEOUT_SECONDS)
                except queue.Empty:
                    logger.debug("Wake stream timeout: no audio chunk available yet.")
                    time.sleep(idle_sleep_seconds)
                    continue

                has_final_result = recognizer.AcceptWaveform(audio_chunk)
                if has_final_result:
                    final_text = _parse_result_text(recognizer.Result(), "text")
                    if WAKE_DEBUG_RESULTS:
                        logger.debug("Wake FINAL result: '%s'", final_text)
                    if _is_wake_detected(final_text, wake_token):
                        logger.info("Wake word detected from FINAL result.")
                        return True
                else:
                    partial_text = _parse_result_text(recognizer.PartialResult(), "partial")
                    if WAKE_DEBUG_RESULTS and partial_text:
                        logger.debug("Wake PARTIAL result: '%s'", partial_text)
                    if _is_wake_detected(partial_text, wake_token):
                        logger.info("Wake word detected from PARTIAL result.")
                        return True
    except Exception as exc:
        logger.error(
            "Wake engine microphone/stream failure: %s. Check microphone permissions/device.",
            exc,
            exc_info=True,
        )
        time.sleep(_ERROR_BACKOFF_SECONDS)
        return False

    return False
