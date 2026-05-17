"""LlmClient — abstraksi provider (kontrak §9 K2).

Default OpenRouter (OpenAI-compatible; satu key, banyak model `vendor/model`).
Tanpa `LLM_API_KEY` → `StubLlmClient` deterministik (pipeline tetap bisa
diverifikasi tanpa kredensial). SDK di-import lazy.

`generate`/`stream` menerima `model` opsional: default = model persona
(`settings.llm_model`, kuat); evaluator memakai `settings.llm_judge_model`
(murah, rag-plan §9.1) → pisah judge vs persona.
"""
from __future__ import annotations

import time
from collections.abc import Iterator
from typing import Protocol

from app.config import get_settings

_RETRY = 3  # backoff utk 5xx/timeout (free tier sering flaky)


def _with_retry(fn):
    last = None
    for i in range(_RETRY):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 - retry transient apa pun
            last = e
            msg = str(e).lower()
            transient = any(
                k in msg for k in ("timeout", "502", "503", "504", "rate", "overload")
            )
            if not transient or i == _RETRY - 1:
                raise
            time.sleep(1.5 * (i + 1))
    raise last  # pragma: no cover


class LlmClient(Protocol):
    def stream(self, system: str, messages: list[dict],
               model: str | None = None) -> Iterator[str]: ...

    def generate(self, system: str, messages: list[dict],
                 model: str | None = None) -> str: ...


class StubLlmClient:
    """Deterministik, ditandai jelas. BUKAN untuk evaluasi klinis —
    hanya membuktikan pipeline (prompt assembly, retrieval, streaming)."""

    PREFIX = "[STUB LLM] "

    def generate(self, system: str, messages: list[dict],
                 model: str | None = None) -> str:
        last_user = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user = m.get("content", "")
                break
        return (
            self.PREFIX
            + "respons dihasilkan dari prompt ber-answer-restraint "
            + "(set env LLM_API_KEY utk provider nyata). Pertanyaan: "
            + (last_user[:80] if last_user else "(kosong)")
        )

    def stream(self, system: str, messages: list[dict],
               model: str | None = None) -> Iterator[str]:
        for tok in self.generate(system, messages).split(" "):
            yield tok + " "


def _openai_compatible(base_url: str | None):
    """OpenRouter & OpenAI sama-sama pakai SDK `openai`."""
    s = get_settings()
    try:
        from openai import OpenAI
    except ImportError:
        return None
    headers = {}
    if s.llm_site_url:
        headers["HTTP-Referer"] = s.llm_site_url
    if s.llm_app_title:
        headers["X-Title"] = s.llm_app_title
    client = OpenAI(
        api_key=s.llm_api_key,
        base_url=base_url or None,
        default_headers=headers or None,
    )

    def _err(r):
        e = getattr(r, "error", None)
        if e is None and getattr(r, "model_extra", None):
            e = r.model_extra.get("error")
        return e

    class _OAI:
        def generate(self, system, messages, model=None):
            def _call():
                r = client.chat.completions.create(
                    model=model or s.llm_model,
                    messages=[{"role": "system", "content": system}, *messages],
                    temperature=0.5,
                )
                if not getattr(r, "choices", None):
                    raise RuntimeError(
                        f"LLM tanpa choices: {_err(r) or repr(r)[:200]}"
                    )
                return r.choices[0].message.content or ""

            return _with_retry(_call)

        def stream(self, system, messages, model=None):
            st = client.chat.completions.create(
                model=model or s.llm_model,
                messages=[{"role": "system", "content": system}, *messages],
                temperature=0.5,
                stream=True,
            )
            for ch in st:
                if not getattr(ch, "choices", None):
                    continue
                d = ch.choices[0].delta.content
                if d:
                    yield d

    return _OAI()


def _anthropic():  # pragma: no cover - butuh SDK + key
    s = get_settings()
    try:
        from anthropic import Anthropic
    except ImportError:
        return None
    client = Anthropic(api_key=s.llm_api_key)

    class _Anth:
        def generate(self, system, messages, model=None):
            r = client.messages.create(
                model=model or s.llm_model, system=system,
                max_tokens=1024, messages=messages, temperature=0.5,
            )
            return "".join(b.text for b in r.content if b.type == "text")

        def stream(self, system, messages, model=None):
            with client.messages.stream(
                model=model or s.llm_model, system=system,
                max_tokens=1024, messages=messages, temperature=0.5,
            ) as st:
                yield from st.text_stream

    return _Anth()


def _build_client() -> LlmClient:
    s = get_settings()
    if not s.llm_api_key:
        return StubLlmClient()
    provider = (s.llm_provider or "").lower()
    if provider == "openrouter":
        return _openai_compatible(s.llm_base_url) or StubLlmClient()
    if provider == "openai":
        return _openai_compatible(None) or StubLlmClient()
    if provider == "anthropic":
        return _anthropic() or StubLlmClient()
    return StubLlmClient()


_client: LlmClient | None = None


def get_llm_client() -> LlmClient:
    global _client
    if _client is None:
        _client = _build_client()
    return _client


def is_stub() -> bool:
    return isinstance(get_llm_client(), StubLlmClient)
