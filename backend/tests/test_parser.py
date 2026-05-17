"""Parser diuji terhadap 22 file kasus NYATA (bukan format ideal plan)."""
from pathlib import Path

import pytest

from app.config import get_settings
from pipeline.parser import parse_file, validate

CASES = sorted(Path(get_settings().cases_dir).glob("kasus-*.md"))


def test_corpus_present():
    assert len(CASES) == 22, f"Diharapkan 22 kasus, ditemukan {len(CASES)}"


@pytest.mark.parametrize("path", CASES, ids=lambda p: p.name)
def test_parse_and_validate(path):
    pc = parse_file(path)
    errs = validate(pc)
    assert not errs, f"{path.name}: {errs}"
    assert pc.case_id.startswith("kasus-")
    assert 1 <= pc.case_number <= 22
    assert pc.title_id, "title_id kosong"
    assert len(pc.bagian_a_sections) >= 8
    assert pc.bagian_b_text, "Bagian B kosong"
    # Section index Bagian A harus mulai dari 1 dan menaik
    idxs = [s.index for s in pc.bagian_a_sections]
    assert idxs[0] == 1, f"{path.name}: section pertama bukan 1 ({idxs[:3]})"


def test_known_case_02_fields():
    pc = parse_file(Path(get_settings().cases_dir) / "kasus-02-konjungtivitis-viral.md")
    assert pc.case_id == "kasus-02"
    assert "konjungtivitis" in pc.title_id.lower()
    assert pc.title_en.lower().startswith("viral")
    assert pc.icd10 == "H10.3"
    assert pc.skdi == "4A"
    assert pc.collection_name == "kasus_02"
