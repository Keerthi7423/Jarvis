"""SSML helpers for natural emotion-aware speech rendering."""

from __future__ import annotations

import html
import re

SUPPORTED_SPEECH_MODES = {"normal", "greeting", "warning", "calm"}

_MODE_PROSODY = {
    "normal": {"rate": "0%", "pitch": "0st", "pause": "120ms"},
    "greeting": {"rate": "+4%", "pitch": "+1st", "pause": "100ms"},
    "warning": {"rate": "-5%", "pitch": "-1st", "pause": "150ms"},
    "calm": {"rate": "-8%", "pitch": "-2st", "pause": "180ms"},
}

_KEYWORD_PATTERN = re.compile(
    r"\b("
    r"jarvis|please|important|warning|careful|stop|wait|now|yes|no|hello|hi|sir"
    r")\b",
    flags=re.IGNORECASE,
)


def _inject_subtle_pauses(text: str, pause: str) -> str:
    """Inject a subtle pause before selected cue words."""

    def _replace(match: re.Match[str]) -> str:
        return f'<break time="{pause}"/>{match.group(0)}'

    return _KEYWORD_PATTERN.sub(_replace, text)


def build_ssml(text: str, mode: str = "normal") -> str:
    """Build SSML-wrapped speech text for a supported emotional mode."""
    raw = text.strip()
    if not raw:
        return '<speak><prosody rate="0%" pitch="0st"></prosody></speak>'

    selected_mode = mode if mode in SUPPORTED_SPEECH_MODES else "normal"
    settings = _MODE_PROSODY[selected_mode]

    escaped = html.escape(raw, quote=False)
    paused = _inject_subtle_pauses(escaped, settings["pause"])
    return (
        "<speak>"
        f'<prosody rate="{settings["rate"]}" pitch="{settings["pitch"]}">'
        f"{paused}"
        "</prosody>"
        "</speak>"
    )
