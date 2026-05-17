"""Retrieval Bagian A — BM25 (tanpa infra, kontrak v0.5.0).

Isolasi per-kasus (kontrak §8.5): index BM25 dibangun HANYA dari section
Bagian A kasus aktif → retrieval tak mungkin lintas kasus. Dense+RRF
(Qdrant, rag-plan §4.4) pluggable lewat `DenseRetriever` — ditunda sampai
infra Qdrant siap; `hybrid()` otomatis pakai dense kalau tersedia.
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from app.config import get_settings
from pipeline.parser import ParsedCase, parse_file

_WORD_RE = re.compile(r"[a-zA-ZÀ-ɏ]+", re.UNICODE)


def _tok(text: str) -> list[str]:
    return [w.lower() for w in _WORD_RE.findall(text)]


def _case_path(case_id: str) -> Path:
    # case_id "kasus-02" → file kasus-02-*.md di cases_dir
    num = case_id.split("-")[-1]
    cases_dir = Path(get_settings().cases_dir)
    matches = sorted(cases_dir.glob(f"kasus-{num}-*.md"))
    if not matches:
        raise FileNotFoundError(f"File kasus tak ditemukan untuk {case_id}")
    return matches[0]


@lru_cache(maxsize=64)
def load_case(case_id: str) -> ParsedCase:
    return parse_file(_case_path(case_id))


class _Bm25:
    """rank_bm25 di-import lazy; fallback overlap-count kalau belum ada."""

    def __init__(self, corpus_tokens: list[list[str]]):
        self._impl = None
        try:
            from rank_bm25 import BM25Okapi

            self._impl = BM25Okapi(corpus_tokens)
        except ImportError:
            self._corpus = corpus_tokens

    def scores(self, query_tokens: list[str]) -> list[float]:
        if self._impl is not None:
            return list(self._impl.get_scores(query_tokens))
        qs = set(query_tokens)
        return [float(sum(1 for t in doc if t in qs)) for doc in self._corpus]


@lru_cache(maxsize=64)
def _index(case_id: str):
    pc = load_case(case_id)
    sections = pc.bagian_a_sections
    corpus = [_tok(s.text) for s in sections]
    return sections, _Bm25(corpus)


def retrieve(case_id: str, query: str, k: int = 3) -> list[dict]:
    """Top-k section Bagian A utk kasus ini SAJA (isolasi keras)."""
    sections, bm25 = _index(case_id)
    if not sections:
        return []
    scores = bm25.scores(_tok(query))
    ranked = sorted(range(len(sections)), key=lambda i: scores[i], reverse=True)
    out = []
    for i in ranked[:k]:
        if scores[i] <= 0:
            continue
        s = sections[i]
        out.append({
            "case_id": case_id,
            "section_index": s.index,
            "section_name": s.name,
            "text": s.text,
            "score": round(float(scores[i]), 4),
        })
    return out
