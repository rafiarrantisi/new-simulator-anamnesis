"""Helper CLI: generate bcrypt hash utk ADMIN_PASSWORD_HASH (.env).

Usage:
    cd backend && python -m scripts.hash_admin_password
    # Prompt password (no-echo) 2x utk konfirmasi → output hash.
    # Paste hash ke backend/.env:
    #   ADMIN_EMAIL=rafi@ophtasim.local
    #   ADMIN_PASSWORD_HASH=$2b$12$...

Saat backend restart (`systemctl restart ophtha-backend`), lifespan() akan
seed user admin ini bila belum ada (idempoten — lihat app/main.py
_seed_admin_user). Kalau email sudah ada dgn role != admin, akan log warning
dan TIDAK auto-promote (safety).
"""
from __future__ import annotations

import getpass
import sys

from app.shared.security import hash_password


def main() -> int:
    print("OphthaSim — generate ADMIN_PASSWORD_HASH (untuk backend/.env)")
    print("Password tidak akan ditampilkan saat diketik.\n")
    pw1 = getpass.getpass("Password: ")
    if len(pw1) < 8:
        print("ERROR: minimal 8 karakter.", file=sys.stderr)
        return 1
    pw2 = getpass.getpass("Konfirmasi: ")
    if pw1 != pw2:
        print("ERROR: password tidak cocok.", file=sys.stderr)
        return 1
    h = hash_password(pw1)
    print("\nADMIN_PASSWORD_HASH=" + h)
    print("\nCopy baris di atas ke backend/.env (plus ADMIN_EMAIL=... terpisah).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
