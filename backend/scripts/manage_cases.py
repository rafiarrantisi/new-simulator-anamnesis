"""Kelola status kasus di registry — lock/unlock/stage (v0.16.0).

Dipakai saat swap batch kasus: kasus lama di-LOCK (tetap tampil di library
tapi tak bisa dimainkan), kasus baru (preklinik approved) jadi aktif.

Usage (dari folder backend/):
  python -m scripts.manage_cases list
  python -m scripts.manage_cases lock kasus-01 kasus-02 ...
  python -m scripts.manage_cases unlock kasus-101 ...
  python -m scripts.manage_cases lock-except kasus-101 kasus-102 ...   # lock SEMUA kecuali ini
  python -m scripts.manage_cases set-stage preklinik kasus-101 ...     # set stage+caseType(practice)

Tak menyentuh markdown — hanya kolom registry (locked/stage/case_type).
"""
from __future__ import annotations

import sys

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.domains.cases.models import CaseRegistry


def _all_ids(db) -> list[str]:
    return list(db.scalars(select(CaseRegistry.case_id).order_by(CaseRegistry.case_id)).all())


def cmd_list(db) -> int:
    rows = db.scalars(select(CaseRegistry).order_by(CaseRegistry.case_id)).all()
    if not rows:
        print("(registry kosong — jalankan `python -m pipeline.ingest --all --no-embed` dulu)")
        return 0
    print(f"{'caseId':14} {'lock':5} {'active':6} {'stage':10} {'type':9} judul")
    print("-" * 70)
    for c in rows:
        lock = "🔒" if getattr(c, "locked", False) else "·"
        active = "yes" if c.is_active else "NO"
        print(f"{c.case_id:14} {lock:5} {active:6} {(c.stage or '-'):10} {(c.case_type or '-'):9} {c.title_id}")
    n_lock = sum(1 for c in rows if getattr(c, "locked", False))
    print(f"\nTotal {len(rows)} kasus · {n_lock} terkunci · {len(rows)-n_lock} aktif-main.")
    return 0


def _set_locked(db, ids: list[str], value: bool) -> int:
    n = 0
    for cid in ids:
        row = db.get(CaseRegistry, cid)
        if row is None:
            print(f"  ! {cid}: tak ada di registry — dilewati")
            continue
        row.locked = value
        n += 1
    db.commit()
    print(f"{'Lock' if value else 'Unlock'} {n} kasus.")
    return 0


def cmd_lock(db, ids: list[str]) -> int:
    return _set_locked(db, ids, True)


def cmd_unlock(db, ids: list[str]) -> int:
    return _set_locked(db, ids, False)


def cmd_lock_except(db, keep_ids: list[str]) -> int:
    keep = set(keep_ids)
    targets = [cid for cid in _all_ids(db) if cid not in keep]
    print(f"Lock semua KECUALI {sorted(keep)} → {len(targets)} kasus akan dikunci.")
    _set_locked(db, targets, True)
    # Pastikan yg di-keep tidak terkunci.
    _set_locked(db, keep_ids, False)
    return 0


def cmd_set_stage(db, stage: str, ids: list[str]) -> int:
    n = 0
    for cid in ids:
        row = db.get(CaseRegistry, cid)
        if row is None:
            print(f"  ! {cid}: tak ada — dilewati")
            continue
        row.stage = stage
        if not row.case_type:
            row.case_type = "practice"
        n += 1
    db.commit()
    print(f"Set stage='{stage}' utk {n} kasus.")
    return 0


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print(__doc__)
        return 1

    init_db()
    db = SessionLocal()
    try:
        cmd, rest = argv[0], argv[1:]
        if cmd == "list":
            return cmd_list(db)
        if cmd == "lock":
            return cmd_lock(db, rest)
        if cmd == "unlock":
            return cmd_unlock(db, rest)
        if cmd == "lock-except":
            if not rest:
                print("ERROR: beri minimal 1 caseId yg di-keep.")
                return 1
            return cmd_lock_except(db, rest)
        if cmd == "set-stage":
            if len(rest) < 2:
                print("ERROR: usage: set-stage <stage> <caseId>...")
                return 1
            return cmd_set_stage(db, rest[0], rest[1:])
        print(f"Perintah tak dikenal: {cmd}")
        print(__doc__)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
