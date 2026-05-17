"""Markdown parser — kontrak file §5.7 (rag-plan §2 + prompt-plan §0).

Anchor terverifikasi pada 22 file nyata di `data-kasus/`:
  # KASUS NN: TITLE_ID (TITLE_EN)
  **Referensi Utama**: ...; ICD-10: CODE
  ### 1. Diagnosis Kerja ... **Tingkat Kemampuan SKDI**: 4A
  ## BAGIAN A: ...      ## BAGIAN B: ...
  ### N. SECTION        (anchor chunking per-section)

Bagian A → korpus RAG (chunk per-section). Bagian B → system prompt
(tidak di-chunk). `### 0. DISCLOSURE LAYERS` belum ada di 22 file
(dijadwalkan Fase 3) → dideteksi sebagai flag, bukan error.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

_FILENAME_RE = re.compile(r"^kasus-(\d{2,3})-([a-z0-9-]+)\.md$")
_TITLE_RE = re.compile(r"^#\s*KASUS\s+(\d+)\s*:\s*(.+?)\s*$", re.IGNORECASE)
_TITLE_EN_RE = re.compile(r"\((.+)\)\s*$")
_ICD_RE = re.compile(r"ICD-?10\s*:?\s*([A-Z]\d+(?:\.\d+)?)", re.IGNORECASE)
_SKDI_RE = re.compile(r"SKDI\**\s*:?\**\s*\(?\s*([0-9]+\s*[AB]?)", re.IGNORECASE)
_SECTION_RE = re.compile(r"^###\s+(\d+)\.\s*(.+?)\s*$")
_BAGIAN_A_RE = re.compile(r"^##\s+BAGIAN\s+A\b", re.IGNORECASE)
_BAGIAN_B_RE = re.compile(r"^##\s+BAGIAN\s+B\b", re.IGNORECASE)
_DISCLOSURE_RE = re.compile(r"^###\s+0\.|DISCLOSURE\s+LAYER", re.IGNORECASE)


@dataclass
class Section:
    index: int
    name: str
    text: str


@dataclass
class ParsedCase:
    case_id: str            # "kasus-02" (kanonik, kontrak §5.6)
    filename: str
    slug: str
    case_number: int
    title_id: str
    title_en: str
    icd10: str
    skdi: str
    references: list[str]
    bagian_a_sections: list[Section] = field(default_factory=list)
    bagian_b_text: str = ""
    has_disclosure_layers: bool = False
    disclosure_text: str = ""
    disclosure_source: str = ""  # "" | "infile" | "sidecar"
    bagian_b_chars: int = 0
    char_count: int = 0

    @property
    def collection_name(self) -> str:
        return self.case_id.replace("-", "_")  # qdrant: "kasus_02"


def _split_sections(body: str) -> list[Section]:
    out: list[Section] = []
    cur_idx: int | None = None
    cur_name = ""
    buf: list[str] = []
    for line in body.splitlines():
        m = _SECTION_RE.match(line)
        if m:
            if cur_idx is not None:
                out.append(Section(cur_idx, cur_name, "\n".join(buf).strip()))
            cur_idx = int(m.group(1))
            cur_name = m.group(2).strip()
            buf = [line]
        elif cur_idx is not None:
            buf.append(line)
    if cur_idx is not None:
        out.append(Section(cur_idx, cur_name, "\n".join(buf).strip()))
    return out


def parse_file(path: str | Path) -> ParsedCase:
    p = Path(path)
    fn = p.name
    fm = _FILENAME_RE.match(fn)
    if not fm:
        raise ValueError(f"Nama file tidak sesuai kontrak `kasus-XX-slug.md`: {fn}")
    num_str, slug = fm.group(1), fm.group(2)
    text = p.read_text(encoding="utf-8")

    title_id, title_en, case_number = "", "", int(num_str)
    icd10, skdi = "", ""
    references: list[str] = []

    for line in text.splitlines():
        tm = _TITLE_RE.match(line)
        if tm and not title_id:
            case_number = int(tm.group(1))
            raw_title = tm.group(2).strip()
            em = _TITLE_EN_RE.search(raw_title)
            if em:
                title_en = em.group(1).strip()
                title_id = raw_title[: em.start()].strip()
            else:
                title_id = raw_title
        if line.strip().startswith("**Referensi Utama**") and not references:
            ref_body = line.split(":", 1)[1] if ":" in line else ""
            references = [r.strip() for r in ref_body.split(";") if r.strip()]
            im = _ICD_RE.search(line)
            if im:
                icd10 = im.group(1).upper()
        if not skdi and "SKDI" in line:
            sm = _SKDI_RE.search(line)
            if sm:
                skdi = sm.group(1).replace(" ", "").upper()

    # Split Bagian A / B
    lines = text.splitlines()
    a_start = b_start = None
    for i, line in enumerate(lines):
        if a_start is None and _BAGIAN_A_RE.match(line):
            a_start = i
        elif b_start is None and _BAGIAN_B_RE.match(line):
            b_start = i
    bagian_a = "\n".join(lines[a_start:b_start]) if a_start is not None else ""
    bagian_b = "\n".join(lines[b_start:]) if b_start is not None else ""

    # Disclosure Layers: in-file `### 0.` diutamakan; jika tak ada, sidecar
    # `<cases_dir>/_disclosure/kasus-XX.md` (kontrak §5.7 v0.5.0).
    disclosure_text, disclosure_source = "", ""
    b_sections = _split_sections(bagian_b)
    for s in b_sections:
        if s.index == 0:
            disclosure_text, disclosure_source = s.text.strip(), "infile"
            break
    if not disclosure_text:
        sidecar = p.parent / "_disclosure" / f"kasus-{num_str}.md"
        if sidecar.exists():
            disclosure_text = sidecar.read_text(encoding="utf-8").strip()
            disclosure_source = "sidecar"
    has_disclosure = bool(disclosure_text)

    return ParsedCase(
        case_id=f"kasus-{num_str}",
        filename=fn,
        slug=slug,
        case_number=case_number,
        title_id=title_id,
        title_en=title_en,
        icd10=icd10,
        skdi=skdi,
        references=references,
        bagian_a_sections=_split_sections(bagian_a),
        bagian_b_text=bagian_b.strip(),
        has_disclosure_layers=has_disclosure,
        disclosure_text=disclosure_text,
        disclosure_source=disclosure_source,
        bagian_b_chars=len(bagian_b.strip()),
        char_count=len(text),
    )


def validate(pc: ParsedCase) -> list[str]:
    """Return list of error string. Empty = valid (rag-plan §5.4 disesuaikan)."""
    errs: list[str] = []
    if not pc.title_id:
        errs.append("Judul `# KASUS NN: ...` tidak ditemukan")
    if pc.char_count < 1000:
        errs.append("File terlalu pendek (<1000 char)")
    if not pc.bagian_a_sections:
        errs.append("Bagian A / section `### N.` tidak ditemukan")
    if len(pc.bagian_a_sections) < 8:
        errs.append(f"Bagian A hanya {len(pc.bagian_a_sections)} section (harap ~10)")
    if not pc.bagian_b_text:
        errs.append("Bagian B (persona) tidak ditemukan")
    # has_disclosure_layers: RECOMMENDED, bukan error (kontrak §5.7 — Fase 3)
    return errs
