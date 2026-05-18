#!/usr/bin/env bash
# OPSIONAL — sinkron IP publik EC2 → DuckDNS (kalau TIDAK pakai Elastic IP,
# IP publik berubah saat instance stop/start). Token DuckDNS = RAHASIA →
# JANGAN commit; taruh di /etc/ophtha-duckdns.conf (chmod 600):
#   DUCKDNS_DOMAIN=subdomainmu        # tanpa .duckdns.org
#   DUCKDNS_TOKEN=xxxxxxxx-xxxx-....
#
# Pasang cron (tiap 5 menit):
#   sudo crontab -e
#   */5 * * * * /opt/ophtha/deploy/duckdns-update.sh >/dev/null 2>&1
set -euo pipefail
CONF="${DUCKDNS_CONF:-/etc/ophtha-duckdns.conf}"
[[ -f "$CONF" ]] || { echo "config $CONF tak ada" >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONF"
: "${DUCKDNS_DOMAIN:?set DUCKDNS_DOMAIN di $CONF}"
: "${DUCKDNS_TOKEN:?set DUCKDNS_TOKEN di $CONF}"
RES="$(curl -fsS "https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=")"
echo "$(date -Is) duckdns: $RES"
[[ "$RES" == "OK" ]]
