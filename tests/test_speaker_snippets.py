"""Unit-test snippets for speaker routing behavior.

These are minimal examples for pytest-based validation.
"""

from __future__ import annotations

import voice.speaker as speaker


def test_speak_returns_false_for_empty_text() -> None:
    assert speaker.speak("   ") is False


def test_speak_uses_ai_then_fallback(monkeypatch) -> None:
    calls = {"ai": 0, "fallback": 0}

    def fake_ai(_: str) -> bool:
        calls["ai"] += 1
        return False

    def fake_fallback(_: str) -> bool:
        calls["fallback"] += 1
        return True

    monkeypatch.setattr(speaker, "TTS_BACKEND", "coqui")
    monkeypatch.setattr(speaker, "speak_with_ai", fake_ai)
    monkeypatch.setattr(speaker, "_speak_with_pyttsx3", fake_fallback)

    assert speaker.speak("hello jarvis") is True
    assert calls["ai"] == 1
    assert calls["fallback"] == 1

