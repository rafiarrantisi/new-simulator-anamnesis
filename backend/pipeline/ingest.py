"""CLI ingestion (rag-plan §5.3).

  python -m pipeline.ingest --all                 # semua file di cases_dir
  python -m pipeline.ingest --file <path>         # satu file
  python -m pipeline.ingest --all --no-embed      # registry-only (tanpa Qdrant)

Validasi format dulu (rag-plan §5.4). Embed Bagian A → Qdrant (guarded);
update Case Registry (DB). Fase 2: jalankan dengan --no-embed untuk
verifikasi tanpa infra Qdrant.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from app.config import get_settings
from app.database import SessionLocal, init_db
from pipeline.embedder import EmbedUnavailable, embed_case
from pipeline.parser import parse_file, validate
from pipeline.registry import upsert_case


def _iter_files(args) -> list[Path]:
    if args.file:
        return [Path(args.file)]
    cases_dir = Path(get_settings().cases_dir)
    return sorted(cases_dir.glob("kasus-*.md"))


def main(argv: list[str] | None = None) -> int:
    # Konsol Windows (cp1252) tak bisa cetak ✓/⚠ — paksa UTF-8 tanpa flag.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    ap = argparse.ArgumentParser(description="OphthaSim case ingestion")
    ap.add_argument("--all", action="store_true", help="ingest semua file")
    ap.add_argument("--file", help="ingest satu file markdown")
    ap.add_argument("--no-embed", action="store_true", help="lewati embedding (registry-only)")
    args = ap.parse_args(argv)

    if not args.all and not args.file:
        ap.error("pilih --all atau --file")

    files = _iter_files(args)
    if not files:
        print("Tidak ada file kasus ditemukan.")
        return 1

    init_db()
    db = SessionLocal()
    ok_count = fail_count = embed_skipped = no_disclosure = 0
    try:
        for fp in files:
            try:
                pc = parse_file(fp)
            except ValueError as e:
                print(f"  ✗ {fp.name}: PARSE GAGAL — {e}")
                fail_count += 1
                continue
            errs = validate(pc)
            if errs:
                print(f"  ✗ {pc.filename}: VALIDASI GAGAL — {'; '.join(errs)}")
                fail_count += 1
                continue

            chunk_count, embedded = len(pc.bagian_a_sections), False
            if not args.no_embed:
                try:
                    chunk_count = embed_case(pc)
                    embedded = True
                except EmbedUnavailable as e:
                    embed_skipped += 1
                    print(f"  ⚠ {pc.filename}: embed dilewati ({e})")

            upsert_case(db, pc, embedded=embedded, chunk_count=chunk_count)
            db.commit()
            flag = "" if pc.has_disclosure_layers else "  [⚠ tanpa ### 0 Disclosure Layers]"
            if not pc.has_disclosure_layers:
                no_disclosure += 1
            print(
                f"  ✓ {pc.case_id}: {pc.title_id} "
                f"(ICD {pc.icd10 or '-'}, SKDI {pc.skdi or '-'}, "
                f"{len(pc.bagian_a_sections)} sec){flag}"
            )
            ok_count += 1
    finally:
        db.close()

    print(
        f"\nSelesai: {ok_count} ok · {fail_count} gagal · "
        f"{embed_skipped} embed-dilewati · {no_disclosure} tanpa-disclosure-layer "
        f"(dijadwalkan Fase 3)."
    )
    return 0 if fail_count == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
