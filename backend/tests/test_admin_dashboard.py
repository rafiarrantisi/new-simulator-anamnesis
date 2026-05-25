"""Test Developer Dashboard admin layer (kontrak v0.15.0).

Cover:
  - require_admin() gating (student → 403, admin → 200)
  - GET /api/admin/cases (list)
  - POST /api/admin/cases (create kasus baru)
  - PATCH /api/admin/cases/{caseId} (edit metadata)
  - POST /api/admin/cases/{caseId}/ingest (re-ingest)
  - POST /api/admin/eye-photos (upload multipart)
  - GET /api/cases/{caseId}/eye-photos (public list)
  - DELETE /api/admin/eye-photos/{photoId}
  - GET /api/admin/audit (audit log terisi)
  - GET /api/admin/whoami

DB = sqlite dev (sama dgn smoke test). User dipromote ke admin via DB
direct setelah signup — bypass _seed_admin_user (yg butuh ADMIN_EMAIL env).
"""
from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.domains.auth.models import User
from app.domains.cases.models import CaseRegistry
from app.main import app

client = TestClient(app)


# ── Fixtures via DB direct (no env manipulation) ──────────────────────────
def _signup_and_promote(email: str, role: str = "admin") -> str:
    """Signup → promote di DB → login → return Bearer token."""
    pw = "secret-admin-12"
    su = client.post("/api/auth/signup", json={
        "email": email, "password": pw, "full_name": "Test Admin",
    })
    assert su.status_code in (200, 409), su.text
    # Promote role via DB direct.
    db = SessionLocal()
    try:
        u = db.scalar(select(User).where(User.email == email))
        assert u is not None, "user not found after signup"
        if u.role != role:
            u.role = role
            db.commit()
    finally:
        db.close()
    lg = client.post("/api/auth/login", json={"email": email, "password": pw}).json()
    assert lg["success"], lg
    return lg["data"]["token"]


@pytest.fixture(scope="module")
def admin_h() -> dict:
    tok = _signup_and_promote("admin-test@ophtha-test.com", "admin")
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def student_h() -> dict:
    tok = _signup_and_promote("student-test@ophtha-test.com", "student")
    return {"Authorization": f"Bearer {tok}"}


# ── Auth gating ───────────────────────────────────────────────────────────
def test_require_admin_blocks_student(student_h):
    r = client.get("/api/admin/cases", headers=student_h)
    assert r.status_code == 403, r.text


def test_require_admin_blocks_unauth():
    r = client.get("/api/admin/cases")
    assert r.status_code == 401


def test_admin_whoami(admin_h):
    r = client.get("/api/admin/whoami", headers=admin_h).json()
    assert r["success"]
    assert r["data"]["role"] == "admin"


# ── Admin: list cases ─────────────────────────────────────────────────────
def test_admin_list_cases(admin_h):
    r = client.get("/api/admin/cases", headers=admin_h).json()
    assert r["success"]
    assert isinstance(r["data"], list)
    # Setiap row punya field admin extra
    if r["data"]:
        c0 = r["data"][0]
        for k in ("caseId", "title_id", "photoCount", "hasMarkdown", "isActive"):
            assert k in c0, f"missing {k} in {c0}"


# ── Admin: create kasus baru ──────────────────────────────────────────────
_NEW_CASE_ID = "kasus-91"  # angka tinggi supaya tak konflik dgn 22 kanonik
_NEW_CASE_SLUG = "test-pytest-admin"

# Parser validate: minimum 1000 char + 8+ bagian A section + bagian B ada.
# Padding paragraf dummy supaya total > 1000 char tanpa ubah struktur.
_PAD = " Lorem ipsum dolor sit amet, consectetur adipiscing elit. " * 5
_VALID_MD = f"""# KASUS 91: Test Pytest Admin (Pytest Test Case)
**Referensi Utama**: Test Reference 2026; ICD-10: H99.0
**Tingkat Kemampuan SKDI**: 3A

## BAGIAN A: DATA MEDIS

### 1. Diagnosis Kerja
Tes diagnosis untuk pytest.{_PAD}

### 2. Anamnesis Tambahan
Onset: tes onset, durasi, lokasi.{_PAD}

### 3. Faktor Risiko
Tes faktor risiko terkait kasus.{_PAD}

### 4. Pemeriksaan Fisik
Tes pemeriksaan umum dan mata.{_PAD}

### 5. Temuan Klinis Objektif
Tes temuan VA, TIO, segmen anterior.{_PAD}

### 6. Diagnosis Banding
Tes DDx 1, DDx 2, DDx 3.{_PAD}

### 7. Penunjang
Tes pemeriksaan penunjang.{_PAD}

### 8. Tatalaksana
Tes tatalaksana farmakologi dan non-farmakologi.{_PAD}

### 9. Edukasi
Tes edukasi pasien dan keluarga.{_PAD}

### 10. Prognosis
Tes prognosis ad vitam, functionam, sanationam.{_PAD}

## BAGIAN B: PERSONA PASIEN

### 1. Latar Belakang
Tes persona untuk pytest.{_PAD}

### 2. Keluhan Utama
Tes keluhan utama pasien.{_PAD}
"""


def test_admin_create_case(admin_h):
    # Bersihkan kalau ada dari run sebelumnya
    db = SessionLocal()
    try:
        row = db.get(CaseRegistry, _NEW_CASE_ID)
        if row:
            db.delete(row); db.commit()
    finally:
        db.close()
    # Bersihkan file kalau ada
    from app.domains.cases.service import _cases_dir, _find_file_for_case
    existing = _find_file_for_case(_NEW_CASE_ID)
    if existing:
        existing.unlink(missing_ok=True)

    r = client.post("/api/admin/cases", headers=admin_h, json={
        "case_id": _NEW_CASE_ID,
        "slug": _NEW_CASE_SLUG,
        "content": _VALID_MD,
        "metadata": {"difficulty": "Easy", "tags": ["test", "pytest"]},
    })
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["caseId"] == _NEW_CASE_ID
    assert data["title_id"].startswith("Test Pytest")

    # File markdown harus ditulis ke filesystem
    f = _find_file_for_case(_NEW_CASE_ID)
    assert f is not None and f.exists()
    assert _NEW_CASE_SLUG in f.name


def test_admin_create_case_conflict(admin_h):
    """Create dgn caseId yg sudah ada → 409."""
    r = client.post("/api/admin/cases", headers=admin_h, json={
        "case_id": _NEW_CASE_ID,
        "slug": _NEW_CASE_SLUG,
        "content": _VALID_MD,
    })
    assert r.status_code == 409, r.text


def test_admin_create_case_invalid_id(admin_h):
    """case_id pola salah → 400."""
    r = client.post("/api/admin/cases", headers=admin_h, json={
        "case_id": "not-a-case-id",
        "slug": "foo",
        "content": _VALID_MD,
    })
    assert r.status_code == 400, r.text


def test_admin_patch_case_metadata(admin_h):
    r = client.patch(f"/api/admin/cases/{_NEW_CASE_ID}", headers=admin_h, json={
        "metadata": {"difficulty": "Medium", "is_active": True},
    })
    assert r.status_code == 200, r.text


def test_admin_reingest_case(admin_h):
    r = client.post(f"/api/admin/cases/{_NEW_CASE_ID}/ingest", headers=admin_h)
    assert r.status_code == 200, r.text


# ── Eye Photos ────────────────────────────────────────────────────────────
_PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfa\xcf"
    b"\x00\x00\x00\x03\x00\x01\x9b\xb9\xe3\x9f\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_eye_photo_upload_admin_only(student_h):
    files = {"file": ("t.png", io.BytesIO(_PNG_1X1), "image/png")}
    r = client.post(
        "/api/admin/eye-photos", headers=student_h,
        files=files, data={"case_id": _NEW_CASE_ID, "eye": "OD", "caption": "test"},
    )
    assert r.status_code == 403, r.text


def test_eye_photo_upload_and_list(admin_h):
    files = {"file": ("test1.png", io.BytesIO(_PNG_1X1), "image/png")}
    r = client.post(
        "/api/admin/eye-photos", headers=admin_h,
        files=files, data={"case_id": _NEW_CASE_ID, "eye": "OD", "caption": "Test 1"},
    )
    assert r.status_code == 200, r.text
    photo = r.json()["data"]
    assert photo["caseId"] == _NEW_CASE_ID
    assert photo["eye"] == "OD"
    assert photo["src"].startswith("/api/uploads/eye-photos/")
    photo_id = photo["id"]

    # Public list (no auth)
    r2 = client.get(f"/api/cases/{_NEW_CASE_ID}/eye-photos").json()
    assert r2["success"]
    assert any(p["id"] == photo_id for p in r2["data"])

    # Admin list w/ filter case_id
    r3 = client.get(f"/api/admin/eye-photos?case_id={_NEW_CASE_ID}", headers=admin_h).json()
    assert r3["success"]
    assert len(r3["data"]) >= 1

    # Cleanup: delete
    r4 = client.delete(f"/api/admin/eye-photos/{photo_id}", headers=admin_h)
    assert r4.status_code == 200
    # Verify gone
    r5 = client.get(f"/api/cases/{_NEW_CASE_ID}/eye-photos").json()
    assert not any(p["id"] == photo_id for p in r5["data"])


def test_eye_photo_reject_non_image(admin_h):
    files = {"file": ("bad.txt", io.BytesIO(b"not an image"), "text/plain")}
    r = client.post(
        "/api/admin/eye-photos", headers=admin_h,
        files=files, data={"case_id": _NEW_CASE_ID, "eye": "", "caption": ""},
    )
    assert r.status_code == 400


# ── Audit log ─────────────────────────────────────────────────────────────
def test_admin_audit_log_has_entries(admin_h):
    r = client.get("/api/admin/audit?limit=50", headers=admin_h).json()
    assert r["success"]
    # Setelah test create/upload/delete di atas, harus ada minimal beberapa entri.
    actions = [e["action"] for e in r["data"]]
    assert any(a in {"case_create", "photo_upload", "photo_delete"} for a in actions), actions


# ── Cleanup test case file di akhir module ────────────────────────────────
def test_zz_cleanup_test_case(admin_h):
    """Hapus kasus + file test supaya rerun bersih (tag zz = run terakhir alphabetical)."""
    from app.domains.cases.service import _find_file_for_case
    db = SessionLocal()
    try:
        row = db.get(CaseRegistry, _NEW_CASE_ID)
        if row:
            db.delete(row); db.commit()
    finally:
        db.close()
    f = _find_file_for_case(_NEW_CASE_ID)
    if f:
        f.unlink(missing_ok=True)
    # Cek bahwa kasus benar2 hilang dari list (sanity)
    r = client.get("/api/admin/cases", headers=admin_h).json()
    assert not any(c["caseId"] == _NEW_CASE_ID for c in r["data"])
