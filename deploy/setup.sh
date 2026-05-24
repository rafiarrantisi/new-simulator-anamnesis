#!/usr/bin/env bash
# ============================================================
# OphthaSim — bootstrap deploy 1 box (Ubuntu 22.04/24.04 di EC2).
# Idempoten: aman dijalankan ulang. Backend (uvicorn+systemd) +
# frontend statis + nginx reverse-proxy. HTTPS via certbot (langkah
# terpisah, lihat README-DEPLOY.md / output akhir).
#
# Pakai:
#   sudo DOMAIN=namamu.duckdns.org bash deploy/setup.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-${1:-}}"
if [[ -z "$DOMAIN" ]]; then
  echo "ERROR: set DOMAIN. Contoh: sudo DOMAIN=ophthasim.duckdns.org bash deploy/setup.sh" >&2
  exit 1
fi
if [[ $EUID -ne 0 ]]; then
  echo "ERROR: jalankan dengan sudo." >&2
  exit 1
fi

# Repo root = parent dari folder deploy/ (script ini).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_USER="${SUDO_USER:-ubuntu}"
DIST_DIR="$APP_DIR/sistemnya/dist"
# Origin publik utk VITE_API_BASE (frontend same-origin). Default https://
# (saat pakai domain+certbot). Untuk IP/HTTP, set PUBLIC_ORIGIN=http://IP.
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://$DOMAIN}"

echo ">> APP_DIR=$APP_DIR  RUN_USER=$RUN_USER  DOMAIN=$DOMAIN  ORIGIN=$PUBLIC_ORIGIN"

echo ">> [1/8] paket sistem"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx git curl build-essential python3 python3-venv python3-pip

echo ">> [2/8] Node.js 20 LTS (untuk build frontend)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

echo ">> [3/8] backend venv + dependencies"
sudo -u "$RUN_USER" bash -c "
  set -e
  cd '$APP_DIR/backend'
  [[ -d .venv ]] || python3 -m venv .venv
  ./.venv/bin/pip install -q -U pip
  ./.venv/bin/pip install -q -r requirements.txt
"

echo ">> [4/8] cek backend/.env"
if [[ ! -f "$APP_DIR/backend/.env" ]]; then
  cp "$APP_DIR/deploy/env.server.example" "$APP_DIR/backend/.env"
  chown "$RUN_USER:$RUN_USER" "$APP_DIR/backend/.env"
  chmod 600 "$APP_DIR/backend/.env"
  echo ""
  echo "!! backend/.env BARU dibuat dari template."
  echo "!! EDIT dulu: nano $APP_DIR/backend/.env"
  echo "!!   - JWT_SECRET  (jalankan: openssl rand -hex 32)"
  echo "!!   - LLM_API_KEY (key OpenRouter kamu)"
  echo "!!   - CORS_ORIGINS & DATABASE_URL sesuaikan DOMAIN/APP_DIR"
  echo "!! Lalu JALANKAN ULANG script ini."
  exit 2
fi
chmod 600 "$APP_DIR/backend/.env" || true

echo ">> [5/8] ingest 22 kasus markdown → registry DB"
sudo -u "$RUN_USER" bash -c "cd '$APP_DIR/backend' && ./.venv/bin/python -m pipeline.ingest --all --no-embed" \
  || echo "!! ingest gagal (lanjut; bisa di-ingest ulang manual nanti)"

echo ">> [6/8] build frontend (VITE_API_BASE=$PUBLIC_ORIGIN)"
sudo -u "$RUN_USER" bash -c "
  set -e
  cd '$APP_DIR/sistemnya'
  (npm ci || npm install)
  VITE_API_BASE='$PUBLIC_ORIGIN' npm run build
"
[[ -f "$DIST_DIR/index.html" ]] || { echo "ERROR: build frontend gagal ($DIST_DIR/index.html tak ada)" >&2; exit 1; }

echo ">> [7/8] nginx site"
sed -e "s|__DOMAIN__|$DOMAIN|g" -e "s|__DIST__|$DIST_DIR|g" \
  "$APP_DIR/deploy/nginx-ophtha.conf" > /etc/nginx/sites-available/ophtha.conf
ln -sf /etc/nginx/sites-available/ophtha.conf /etc/nginx/sites-enabled/ophtha.conf
rm -f /etc/nginx/sites-enabled/default
# Tier A v0.13.0: map $http_upgrade utk WebSocket — level http (conf.d).
cp "$APP_DIR/deploy/nginx-upgrade-map.conf" /etc/nginx/conf.d/upgrade-map.conf
# Patch idempoten block 443 (jika certbot sudah jalan): pastikan WS headers
# + proxy_read_timeout panjang ada juga di blok HTTPS (certbot kadang
# tak menyalin custom proxy directives saat menambah listen 443 ssl).
SITE=/etc/nginx/sites-available/ophtha.conf
if grep -q "listen 443 ssl" "$SITE" 2>/dev/null && \
   ! grep -q "proxy_read_timeout 600s" "$SITE" 2>/dev/null; then
  echo "!! Blok 443 ada tapi belum punya WS headers/timeout panjang."
  echo "!! Edit MANUAL: tambahkan di location ~ ^/(api|health) blok 443:"
  echo "      proxy_http_version 1.1;"
  echo "      proxy_set_header Upgrade \$http_upgrade;"
  echo "      proxy_set_header Connection \$connection_upgrade;"
  echo "      proxy_read_timeout 600s;  proxy_send_timeout 600s;"
  echo "      http2 on;     # di server-level blok 443"
fi
nginx -t
systemctl reload nginx

echo ">> [8/8] systemd backend service"
sed -e "s|__APP_DIR__|$APP_DIR|g" -e "s|__RUN_USER__|$RUN_USER|g" \
  "$APP_DIR/deploy/ophtha-backend.service" > /etc/systemd/system/ophtha-backend.service
systemctl daemon-reload
systemctl enable --now ophtha-backend
sleep 4
if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo ">> backend OK (/health 200)"
else
  echo "!! backend belum sehat — cek: journalctl -u ophtha-backend -n 50 --no-pager"
fi

cat <<EOF

============================================================
SETUP DASAR SELESAI.

>> APP SUDAH BISA DIBUKA: $PUBLIC_ORIGIN

Untuk HTTPS + domain (setelah DuckDNS '$DOMAIN' menunjuk ke IP ini):
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d $DOMAIN --redirect -m EMAIL_KAMU --agree-tos -n
  # lalu rebuild dgn origin https:
  cd $APP_DIR && sudo PUBLIC_ORIGIN=https://$DOMAIN DOMAIN=$DOMAIN bash deploy/setup.sh

Update kode nanti:
  cd $APP_DIR && git pull && sudo PUBLIC_ORIGIN=$PUBLIC_ORIGIN DOMAIN=$DOMAIN bash deploy/setup.sh
============================================================
EOF
