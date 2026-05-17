"""Envelope respons seragam (kontrak §6 / patterns global).

{ success, data?, error?, meta? }
"""
from typing import Any


def ok(data: Any = None, meta: dict | None = None) -> dict:
    out: dict[str, Any] = {"success": True, "data": data, "error": None}
    if meta is not None:
        out["meta"] = meta
    return out


def err(message: str) -> dict:
    return {"success": False, "data": None, "error": message}
