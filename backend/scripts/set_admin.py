"""Set / reset akun admin Developer Dashboard LANGSUNG di DB (v0.16.0).

Lebih andal dari seed via .env (tak tergantung restart / parsing $ di hash).
Buat akun baru bila belum ada; update password + set role='admin' bila sudah
ada.

Usage (dari folder backend/):
  ./.venv/bin/python -m scripts.set_admin <email> '<password>'

Contoh:
  ./.venv/bin/python -m scripts.set_admin admin@ophtasim.com 'PasswordKuatRahasia'

Catatan: password muncul di shell history — pakai password yg memang utk ini,
dan ganti kalau bocor.
"""
from __future__ import annotations

import sys

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app.domains.auth.models import User, UserProfile
from app.shared.security import hash_password


def main(argv: list[str] | None = None) -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    argv = argv if argv is not None else sys.argv[1:]
    if len(argv) < 2:
        print("usage: python -m scripts.set_admin <email> '<password>'")
        return 1
    email = argv[0].strip().lower()
    pw = argv[1]
    if len(pw) < 6:
        print("ERROR: password minimal 6 karakter.")
        return 1

    init_db()
    db = SessionLocal()
    try:
        u = db.scalar(select(User).where(User.email == email))
        if u is None:
            u = User(
                email=email,
                hashed_password=hash_password(pw),
                full_name="Developer Admin",
                role="admin",
            )
            u.profile = UserProfile()
            db.add(u)
            print(f"CREATED admin: {email}")
        else:
            u.hashed_password = hash_password(pw)
            u.role = "admin"
            print(f"UPDATED admin: {email} (role=admin, password direset)")
        db.commit()
        print("Sekarang bisa login di web — tombol 'Dev' muncul setelah login.")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
