"""Exam data model — kontrak §5.9 / §3B.2.

Schema pragmatis: semua field opsional, `extra="ignore"` supaya draf sidecar
dari markdown tak over-constrained tapi tetap tervalidasi (kontrak §5.9).
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

# Bobot per-station (kontrak §3B.2 = plan §7.3, dinormalisasi → total 100).
STATION_WEIGHTS: dict[str, int] = {
    "visual_acuity": 15,
    "pupils_rapd": 15,
    "ocular_motility": 10,
    "visual_field": 10,
    "slit_lamp": 20,
    "tonometry": 10,
    "fundoscopy": 20,
}


class _F(BaseModel):
    """Base: abaikan key tak dikenal (draf manusia/markdown — kontrak §5.9)."""

    model_config = ConfigDict(extra="ignore")


class VisualAcuityF(_F):
    od: str | None = None
    os: str | None = None
    pinhole_od: str | None = None
    pinhole_os: str | None = None
    near_od: str | None = None
    near_os: str | None = None


class TonometryF(_F):
    iop_od: float | None = None
    iop_os: float | None = None
    method: str | None = None


class PupilsF(_F):
    od_size: float | None = None
    os_size: float | None = None
    od_react: str | None = None
    os_react: str | None = None
    rapd: str | None = None  # none | OD | OS | od_2plus ...
    notes: str | None = None


class MotilityF(_F):
    full: bool | None = None
    restrictions: list = Field(default_factory=list)
    notes: str | None = None


class VisualFieldF(_F):
    od: str | None = None
    os: str | None = None
    defect_pattern: str | None = None
    notes: str | None = None


class SlitLampF(_F):
    lids: str | None = None
    conjunctiva: str | None = None
    cornea: str | None = None
    anterior_chamber: str | None = None
    iris: str | None = None
    lens: str | None = None
    notes: str | None = None


class FundusF(_F):
    disc_od: str | None = None
    disc_os: str | None = None
    cdr_od: float | None = None
    cdr_os: float | None = None
    macula_od: str | None = None
    macula_os: str | None = None
    vessels: str | None = None
    periphery: str | None = None
    image_od: str | None = None
    image_os: str | None = None


class ColorVisionF(_F):
    od_correct: int | None = None
    os_correct: int | None = None
    total: int | None = None
    type: str | None = None


class AmslerF(_F):
    od: str | None = None
    os: str | None = None


class FluoresceinF(_F):
    pattern: str | None = None
    location: str | None = None
    seidel: bool | None = None
    note: str | None = None


class ExamFindings(_F):
    """Ground truth per kasus (kontrak §5.9). Field None = tak ada / normal."""

    caseId: str
    affectedEye: str | None = None  # OD | OS | OU
    visual_acuity: VisualAcuityF | None = None
    tonometry: TonometryF | None = None
    pupils: PupilsF | None = None
    motility: MotilityF | None = None
    visual_field: VisualFieldF | None = None
    slit_lamp: SlitLampF | None = None
    fundus: FundusF | None = None
    color_vision: ColorVisionF | None = None
    amsler: AmslerF | None = None
    fluorescein: FluoresceinF | None = None
    # Metadata: konten draf, BELUM divalidasi dokter (kontrak §5.9 / §0.4).
    draft: bool = True
    source: str = ""  # "" (default aman) | "sidecar"


class StudentStationRecord(_F):
    recorded: dict = Field(default_factory=dict)
    procedureSteps: list[str] = Field(default_factory=list)
    completed: bool = False


class StudentExamRecord(_F):
    """Apa yang mahasiswa catat (kontrak §3B.2)."""

    stations: dict[str, StudentStationRecord] = Field(default_factory=dict)


class StationScore(_F):
    score: float
    max: float
    detail: list = Field(default_factory=list)


class ExamScoringReport(_F):
    """Laporan TERPISAH dari EvaluationReport §3A (kontrak §3B.2)."""

    examTotalScore: float
    stations: dict[str, StationScore] = Field(default_factory=dict)
    missedFindings: list[str] = Field(default_factory=list)
    procedureNotes: list[str] = Field(default_factory=list)
    positiveNotes: list[str] = Field(default_factory=list)
