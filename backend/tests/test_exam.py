"""Modul Exam Simulator — kontrak §3B / §5.9 / §6.

loader (sidecar + default aman) · scorer (deterministik + adherence) ·
endpoint session-gated. DB = sqlite dev (init_db saat startup).
"""
from fastapi.testclient import TestClient

from app.database import init_db
from app.domains.exam.loader import load_findings
from app.domains.exam.scorer import score_exam
from app.domains.exam.schemas import StudentExamRecord, StudentStationRecord
from app.main import app

# Bare TestClient tak menjalankan lifespan; dev sqlite lama mendahului
# tabel exam_records baru. init_db() idempotent (create_all, tak hapus data).
init_db()

client = TestClient(app)

_STATION_FIELDS = {
    "visual_acuity": ("visual_acuity", ["od", "os", "near_od", "near_os"]),
    "pupils_rapd": ("pupils", ["od_react", "os_react", "rapd"]),
    "ocular_motility": ("motility", ["full", "notes"]),
    "visual_field": ("visual_field", ["od", "os"]),
    "slit_lamp": ("slit_lamp", ["lids", "conjunctiva", "cornea", "anterior_chamber", "iris", "lens"]),
    "tonometry": ("tonometry", ["iop_od", "iop_os"]),
    "fundoscopy": ("fundus", ["disc_od", "disc_os", "cdr_od", "cdr_os", "macula_od", "macula_os", "vessels", "periphery"]),
    # kondisional (kontrak §3B.2) — ikut diisi agar "perfect" = nol terlewat
    "amsler": ("amsler", ["od", "os"]),
    "color_vision": ("color_vision", ["od_correct", "os_correct", "type"]),
    "fluorescein": ("fluorescein", ["pattern", "location", "seidel"]),
}


def _perfect_record(case_id: str) -> StudentExamRecord:
    """Catatan mahasiswa = persis ground truth (skor mendekati 100)."""
    gt = load_findings(case_id)
    stations = {}
    for st, (field, keys) in _STATION_FIELDS.items():
        gobj = getattr(gt, field, None)
        if gobj is None:
            continue
        recorded = {k: getattr(gobj, k) for k in keys if getattr(gobj, k) is not None}
        if recorded:
            stations[st] = StudentStationRecord(recorded=recorded, completed=True)
    return StudentExamRecord(stations=stations)


# ── Loader ──────────────────────────────────────────────────────────

def test_loader_missing_sidecar_safe_default():
    f = load_findings("kasus-99")  # tak ada sidecar
    assert f.caseId == "kasus-99"
    assert f.source == ""
    assert f.draft is True
    assert f.visual_acuity is None and f.slit_lamp is None


def test_loader_reads_kasus02_sidecar():
    f = load_findings("kasus-02")
    assert f.source == "sidecar"
    assert f.affectedEye == "OU"
    assert "6/6" in f.visual_acuity.od
    assert f.tonometry.iop_od == 17
    assert f.fundus.cdr_od == 0.2
    assert "Limfadenopati" in f.slit_lamp.notes


# ── Scorer ──────────────────────────────────────────────────────────

def test_score_no_ground_truth_is_zero_with_note():
    gt = load_findings("kasus-99")
    rep = score_exam(gt, StudentExamRecord())
    assert rep.examTotalScore == 0.0
    assert rep.stations == {}
    assert any("belum tersedia" in n for n in rep.procedureNotes)


def test_score_perfect_record_high():
    gt = load_findings("kasus-02")
    rep = score_exam(gt, _perfect_record("kasus-02"))
    assert rep.examTotalScore >= 90.0
    assert rep.stations["tonometry"].score == rep.stations["tonometry"].max
    assert rep.positiveNotes and not rep.missedFindings


def test_score_empty_record_low_with_missed():
    gt = load_findings("kasus-02")
    rep = score_exam(gt, StudentExamRecord())
    assert rep.examTotalScore == 0.0
    assert len(rep.missedFindings) > 0
    # station applicable tetap dilaporkan dgn skor 0 (transparansi)
    assert rep.stations["tonometry"].score == 0.0


def test_score_iop_tolerance_and_va_one_line():
    gt = load_findings("kasus-02")
    rec = StudentExamRecord(stations={
        "tonometry": StudentStationRecord(recorded={"iop_od": 19, "iop_os": 14}),  # 19 vs 17 ≤3
        "visual_acuity": StudentStationRecord(recorded={"od": "6/9", "os": "6/9"}),  # 6/9 vs 6/6 = 1 baris
    })
    rep = score_exam(gt, rec)
    assert rep.stations["tonometry"].score == rep.stations["tonometry"].max
    va = rep.stations["visual_acuity"]
    assert va.score > 0  # OD masih dianggap match (±1 baris)


def test_conditional_reported_but_not_in_total():
    """Kontrak §3B.2: amsler/ishihara/fluorescein = kondisional —
    dilaporkan tapi TIDAK mengubah examTotalScore."""
    gt = load_findings("kasus-02")  # punya fluorescein.pattern
    weighted_only = {
        st: StudentStationRecord(
            recorded={k: getattr(getattr(gt, f), k) for k in keys if getattr(getattr(gt, f), k) is not None},
            completed=True,
        )
        for st, (f, keys) in _STATION_FIELDS.items()
        if st in ("visual_acuity", "pupils_rapd", "ocular_motility", "visual_field",
                  "slit_lamp", "tonometry", "fundoscopy") and getattr(gt, f) is not None
    }
    rep = score_exam(gt, StudentExamRecord(stations=weighted_only))
    assert rep.examTotalScore >= 90.0  # weighted perfect
    assert "fluorescein" in rep.stations  # kondisional dilaporkan
    assert rep.stations["fluorescein"].max == 10.0
    assert rep.stations["fluorescein"].score == 0.0  # tak diisi
    assert any(m.startswith("fluorescein.") for m in rep.missedFindings)


def test_score_procedure_adherence_penalty():
    gt = load_findings("kasus-02")
    good = StudentExamRecord(stations={
        "visual_acuity": StudentStationRecord(
            recorded={"od": "6/6", "os": "6/9"},
            procedureSteps=["Tutup OS, periksa OD", "Tutup OD, periksa OS"],
        )
    })
    bad = StudentExamRecord(stations={
        "visual_acuity": StudentStationRecord(
            recorded={"od": "6/6", "os": "6/9"},
            procedureSteps=["Periksa OS dulu", "baru OD"],
        )
    })
    sg = score_exam(gt, good).stations["visual_acuity"].score
    sb = score_exam(gt, bad).stations["visual_acuity"].score
    assert sb < sg
    assert any("OD harus diperiksa sebelum OS" in n for n in score_exam(gt, bad).procedureNotes)


# ── Endpoint (session-gated, kontrak §6) ────────────────────────────

def _auth_headers() -> dict:
    client.post("/api/auth/signup", json={
        "email": "exam@uni.ac.id", "password": "secret12", "full_name": "Exam",
    })
    lg = client.post("/api/auth/login", json={
        "email": "exam@uni.ac.id", "password": "secret12",
    }).json()
    return {"Authorization": f"Bearer {lg['data']['token']}"}


def test_exam_endpoints_flow():
    H = _auth_headers()
    sid = client.post("/api/sessions", json={"case_id": "kasus-02", "mode": "normal"},
                       headers=H).json()["data"]["sessionId"]

    # tanpa token → 401
    assert client.get(f"/api/sessions/{sid}/exam-findings").status_code == 401

    ef = client.get(f"/api/sessions/{sid}/exam-findings", headers=H).json()
    assert ef["success"] is True
    assert ef["data"]["caseId"] == "kasus-02"
    assert ef["data"]["source"] == "sidecar"
    assert "6/6" in ef["data"]["visual_acuity"]["od"]

    # report sebelum submit → 404
    assert client.get(f"/api/sessions/{sid}/exam-report", headers=H).status_code == 404

    rec = _perfect_record("kasus-02").model_dump()
    sub = client.post(f"/api/sessions/{sid}/exam", json=rec, headers=H).json()
    assert sub["success"] is True
    assert sub["data"]["examTotalScore"] >= 90.0
    assert "tonometry" in sub["data"]["stations"]

    rep = client.get(f"/api/sessions/{sid}/exam-report", headers=H).json()
    assert rep["data"]["examTotalScore"] == sub["data"]["examTotalScore"]


def test_exam_session_ownership_404():
    H = _auth_headers()
    assert client.get("/api/sessions/not-a-real-session/exam-findings",
                      headers=H).status_code == 404
