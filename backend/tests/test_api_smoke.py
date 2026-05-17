"""Smoke test alur API Fase 2 (kontrak §6) via TestClient.

Menguji: health · signup → login · users/me · cases (hasil ingest) ·
session start+turn+patch · scoring/evaluate shape · ai stub 501.
DB = sqlite (file dev), dibuat init_db saat startup.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_full_flow():
    assert client.get("/health").json()["data"]["status"] == "up"

    su = client.post("/api/auth/signup", json={
        "email": "smoke@uni.ac.id", "password": "secret12", "full_name": "Smoke",
    })
    # signup boleh 200 (baru) atau 409 (sudah ada dari run sebelumnya)
    assert su.status_code in (200, 409)

    lg = client.post("/api/auth/login", json={
        "email": "smoke@uni.ac.id", "password": "secret12",
    }).json()
    assert lg["success"] is True
    token = lg["data"]["token"]
    H = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/users/me", headers=H).json()
    assert me["data"]["email"] == "smoke@uni.ac.id"
    assert me["data"]["role"] == "student"

    cases = client.get("/api/cases").json()
    assert cases["success"] is True
    assert cases["meta"]["total"] >= 1  # registry terisi oleh ingest
    c0 = cases["data"][0]
    for k in ("caseId", "title_id", "icd10", "skdi"):
        assert k in c0
    assert "responses" not in c0  # CaseSummary TIDAK bawa persona/jawaban

    st = client.post("/api/sessions", json={"case_id": c0["caseId"], "mode": "normal"},
                      headers=H).json()
    sid = st["data"]["sessionId"]

    turn = client.post(f"/api/sessions/{sid}/turns", json={"text": "Selamat pagi"},
                        headers=H).json()
    assert turn["success"] is True
    assert "reply" in turn["data"] and turn["data"]["audioUrl"] is None

    ev = client.post("/api/scoring/evaluate", json={"session_id": sid}, headers=H).json()
    d = ev["data"]
    assert d["breakdown"]["coverage"]["max"] == 40
    assert d["breakdown"]["fife"]["max"] == 20
    assert d["breakdown"]["redFlags"]["max"] == 20
    assert d["breakdown"]["communication"]["max"] == 20
    assert "missedItems" in d and "positiveNotes" in d

    pa = client.patch(f"/api/sessions/{sid}", json={"status": "completed"},
                       headers=H).json()
    assert pa["data"]["status"] == "completed"

    # Fase 4: /api/ai/transcribe kini WAJIB auth (bukan lagi stub 501).
    assert client.post("/api/ai/transcribe").status_code == 401

    # endpoint tanpa token harus 401
    assert client.get("/api/users/me").status_code == 401
