#!/usr/bin/env bash
# ============================================================
# OphthaSim — apply update v0.15.0 + v0.16.0 di EC2 (idempoten).
#
# Jalankan SETELAH `git pull`, dari /opt/ophtha:
#
#   cd /opt/ophtha && git pull
#   sudo ADMIN_EMAIL=admin@ophtasim.com ADMIN_PASSWORD='GantiPasswordKuat' \
#        DOMAIN=ophtasim.duckdns.org PUBLIC_ORIGIN=https://ophtasim.duckdns.org \
#        bash deploy/apply-update.sh
#
# ADMIN_EMAIL & ADMIN_PASSWORD OPSIONAL:
#   - Diisi  → akun admin Developer Dashboard di-set (tombol "Dev" muncul).
#   - Kosong → skip admin (kasus & chat UI tetap ter-update).
#
# Yang dilakukan: setup.sh (build frontend + ingest 31 kasus + restart) →
# kunci 22 kasus lama → atur stage (9 baru=preklinik, 22 lama=koas) →
# verifikasi. Tidak menyentuh markdown; status kasus hanya di DB.
# ============================================================
set -uo pipefail

DOMAIN="${DOMAIN:-ophtasim.duckdns.org}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$DOMAIN}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_USER="${SUDO_USER:-ubuntu}"
ENV_FILE="$APP_DIR/backend/.env"
PY="$APP_DIR/backend/.venv/bin/python"

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: jalankan dengan sudo." >&2
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE tidak ada — server belum pernah di-setup. Jalankan deploy/setup.sh dulu." >&2
  exit 1
fi

NEW="kasus-101 kasus-102 kasus-103 kasus-104 kasus-105 kasus-106 kasus-107 kasus-108 kasus-109"
OLD=""
for i in $(seq -w 1 22); do OLD="$OLD kasus-$i"; done

# ── 1) Akun admin (opsional) ────────────────────────────────
if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  echo ">> [1/4] Set akun admin dashboard: $ADMIN_EMAIL"
  HASH="$(cd "$APP_DIR/backend" && ADMIN_PASSWORD="$ADMIN_PASSWORD" "$PY" -c \
    "import os; from app.shared.security import hash_password; print(hash_password(os.environ['ADMIN_PASSWORD']))")"
  if [[ -z "$HASH" ]]; then
    echo "   ! gagal generate hash — lewati setup admin."
  else
    # Upsert: hapus baris lama lalu append baru.
    sed -i '/^ADMIN_EMAIL=/d; /^ADMIN_PASSWORD_HASH=/d' "$ENV_FILE"
    printf 'ADMIN_EMAIL=%s\n' "$ADMIN_EMAIL" >> "$ENV_FILE"
    printf 'ADMIN_PASSWORD_HASH=%s\n' "$HASH"  >> "$ENV_FILE"
    chown "$RUN_USER:$RUN_USER" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo "   admin disimpan ke .env (akan di-seed saat restart)."
  fi
else
  echo ">> [1/4] ADMIN_EMAIL/ADMIN_PASSWORD kosong — skip setup admin."
fi

# ── 2) setup.sh: build frontend + ingest semua kasus + restart ──
echo ">> [2/4] setup.sh (build + ingest 31 kasus + restart)..."
PUBLIC_ORIGIN="$PUBLIC_ORIGIN" DOMAIN="$DOMAIN" bash "$APP_DIR/deploy/setup.sh"

# ── 3) Migrasi batch kasus (lock lama, atur stage) ──────────
echo ">> [3/4] Kunci 22 kasus lama + atur stage..."
run_mc() { sudo -u "$RUN_USER" bash -c "cd '$APP_DIR/backend' && ./.venv/bin/python -m scripts.manage_cases $*"; }
run_mc lock-except $NEW
run_mc set-stage koas $OLD
run_mc set-stage preklinik $NEW
echo "--- Status registry ---"
run_mc list

# ── 4) Verifikasi ───────────────────────────────────────────
echo ">> [4/4] Verifikasi..."
sleep 3
echo -n "   HTTP: ";   curl -sI "$PUBLIC_ORIGIN" | head -1 || true
echo -n "   Health: "; curl -s "$PUBLIC_ORIGIN/health" || true; echo ""
N="$(curl -s "$PUBLIC_ORIGIN/api/cases" | grep -o '"caseId":"kasus-10[0-9]"' | wc -l | tr -d ' ')"
echo "   Kasus preklinik baru ter-serve: ${N:-0} (harusnya 9)"
if [[ -n "${ADMIN_EMAIL:-}" ]]; then
  echo -n "   Seed admin log: "
  journalctl -u ophtha-backend -n 40 --no-pager 2>/dev/null | grep -i "seed-admin" | tail -1 || echo "(cek manual: journalctl -u ophtha-backend | grep seed-admin)"
fi

cat <<EOF

============================================================
SELESAI. Buka di browser: $PUBLIC_ORIGIN

Cek manual (gak bisa otomatis):
  - Library tab Preklinik/Latihan → 9 kasus baru, playable
  - Library tab Koas → 22 kasus lama greyed + "Terkunci"
  - Masuk kasus baru → chat lebih ramping
  - (kalau set admin) login admin → tombol "Dev" muncul
============================================================
EOF
