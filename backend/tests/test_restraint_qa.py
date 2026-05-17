"""QA answer-restraint = DIAGNOSTIK MANUAL, bukan unit test.

Alasan tidak jadi assertion suite: (1) butuh LLM nyata (berbayar),
(2) output non-deterministik, (3) gate resmi Fase 3 = validasi 3 dokter
(kontrak §7) — bukan boolean. Jadi default SKIP; jalankan sengaja:
  RUN_LLM_QA=1 pytest tests/test_restraint_qa.py
atau langsung:  python -m qa.restraint_qa
"""
import os

import pytest

from app.rag.llm import is_stub

_run = os.environ.get("RUN_LLM_QA") == "1"

pytestmark = pytest.mark.skipif(
    is_stub() or not _run,
    reason="QA answer-restraint = diagnostik manual (set RUN_LLM_QA=1 + LLM key)",
)


def test_no_hard_restraint_failures():
    from qa.restraint_qa import run

    results = run()
    failures = [f"{r['id']}: {r['note']}" for r in results if r["status"] == "FAIL"]
    assert not failures, "Pelanggaran answer-restraint (prompt-plan §10): " + \
        "; ".join(failures)
