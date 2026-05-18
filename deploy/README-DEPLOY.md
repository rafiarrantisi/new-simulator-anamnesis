# Deploy OphthaSim — AWS EC2 (1 box) + DuckDNS + HTTPS

> **Apa yang sudah disiapkan asisten (di repo ini):** seluruh skrip &
> konfigurasi deploy (`deploy/`). Di server cukup `git clone`/`git pull`
> lalu **2 perintah**.
> **Yang HANYA bisa kamu lakukan** (asisten tak punya akses AWS/SSH-mu):
> launch EC2, security group, DuckDNS, SSH, isi `.env`, jalankan skrip,
> certbot. Dirinci di bawah — runtut.

## 0. Kenapa EC2 (vs Vercel+Render)
Stack ini: SQLite + panggilan LLM 25–75 dtk + custom bundler + langkah
ingest. **1 VM persisten = paling cocok**: tak ada timeout serverless,
tak ada cold start, filesystem permanen. Vercel hanya ideal untuk
frontend; backend-nya tidak. Karena kamu punya AWS → EC2 jalur terbaik.

## 1. Yang kubutuhkan / kamu siapkan
- Akun AWS (ada ✓).
- **Key pair / PEM**: PEM lama **bisa dipakai LAGI** *hanya jika* instance
  baru di-launch dengan **key pair yang sama** (key pair = per-region).
  Saat launch, di bagian "Key pair" pilih key pair lama itu. Kalau region
  beda / key pair sudah dihapus → buat/`Import key pair` baru.
- Subdomain **DuckDNS** gratis (buat di https://www.duckdns.org, login,
  tambah subdomain, catat **token** — token = rahasia).
- **OpenRouter API key** (yang sudah kamu pakai; nanti diisi ke `.env`
  server, bukan dari repo).

## 2. Launch EC2
1. EC2 → Launch instance.
2. AMI: **Ubuntu Server 24.04 LTS** (skrip dites untuk Ubuntu).
3. Tipe: **t3.small** (2 GB) minimum — build frontend (vite) berat.
   *(Kalau pakai free-tier t2.micro/1 GB: bisa OOM saat build → tambah
   swap dulu, lihat §7.)*
4. Key pair: pilih **key pair lama** (yang cocok dgn PEM-mu) atau buat baru.
5. Storage: 16–20 GB gp3.
6. **Security group** (inbound):
   - SSH `22` → **My IP** (jangan 0.0.0.0/0).
   - HTTP `80` → 0.0.0.0/0 (perlu certbot + redirect).
   - HTTPS `443` → 0.0.0.0/0.
7. Launch. **Allocate Elastic IP** lalu **Associate** ke instance
   (sangat disarankan: IP tetap → DuckDNS cukup di-set sekali; tanpa ini
   IP berubah saat stop/start, pakai `duckdns-update.sh` §6).

## 3. Arahkan DuckDNS
Di duckdns.org, isi **current ip** subdomain-mu dengan **Elastic IP** EC2.
Tunggu 1–2 menit, tes dari laptop: `ping SUBDOMAIN.duckdns.org` → IP EC2.

## 4. Deploy (SSH ke server)
```bash
# dari laptop (sesuaikan path PEM & IP/host)
chmod 400 punyamu.pem
ssh -i punyamu.pem ubuntu@SUBDOMAIN.duckdns.org      # AMI Ubuntu → user 'ubuntu'

# di server:
sudo apt-get update -y && sudo apt-get install -y git
sudo mkdir -p /opt/ophtha && sudo chown $USER:$USER /opt/ophtha
git clone https://github.com/rafiarrantisi/new-simulator-anamnesis.git /opt/ophtha
cd /opt/ophtha

# jalankan setup (pertama kali akan minta isi .env lalu berhenti)
sudo DOMAIN=SUBDOMAIN.duckdns.org bash deploy/setup.sh

# isi rahasia:
nano backend/.env
#   JWT_SECRET   → hasil:  openssl rand -hex 32
#   LLM_API_KEY  → key OpenRouter kamu
#   CORS_ORIGINS → ["https://SUBDOMAIN.duckdns.org"]
#   DATABASE_URL → sqlite:////opt/ophtha/backend/ophtha_prod.db

# jalankan ulang (kini lengkap: ingest + build FE + nginx + service)
sudo DOMAIN=SUBDOMAIN.duckdns.org bash deploy/setup.sh
```

## 5. Aktifkan HTTPS (setelah DNS sudah menunjuk)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d SUBDOMAIN.duckdns.org --redirect -m EMAILKAMU --agree-tos -n
```
Buka **https://SUBDOMAIN.duckdns.org** → ibu bisa pakai (Sign up → Library
→ kasus → anamnesis → DDx → Tatalaksana → Debrief).

## 6. (Opsional) Tanpa Elastic IP → auto-update DuckDNS
```bash
sudo tee /etc/ophtha-duckdns.conf >/dev/null <<'EOF'
DUCKDNS_DOMAIN=SUBDOMAIN
DUCKDNS_TOKEN=TOKEN_DUCKDNS_KAMU
EOF
sudo chmod 600 /etc/ophtha-duckdns.conf
( sudo crontab -l 2>/dev/null; echo "*/5 * * * * /opt/ophtha/deploy/duckdns-update.sh >/dev/null 2>&1" ) | sudo crontab -
```

## 7. Update kode / operasional
- **Update**: `cd /opt/ophtha && git pull && sudo DOMAIN=... bash deploy/setup.sh`
  (rebuild FE + restart backend).
- **Log backend**: `journalctl -u ophtha-backend -f`
- **Restart backend**: `sudo systemctl restart ophtha-backend`
- **Cek**: `curl -s localhost:8000/health` ; `sudo nginx -t`
- **Swap (t2.micro 1 GB, agar build tak OOM)** — sekali sebelum setup:
  ```bash
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

## 8. Catatan jujur (penting — penggunanya dokter)
- **Prototipe**, BUKAN materi ajar tervalidasi: konten kasus & sidecar =
  draf, persona/penilaian LLM **belum divalidasi klinis**. Justru bagus
  minta feedback klinis ibu — tapi beri disclaimer itu ke beliau.
- Biaya: EC2 berjalan = ada biaya (Elastic IP gratis hanya saat
  ter-attach ke instance aktif). Matikan instance bila tak dipakai
  (ingat: tanpa Elastic IP, IP berubah).
- `backend/.env` **tak pernah** masuk git (gitignored) — aman.
- Demo 1 pengguna: SQLite cukup. Multi-user serius → Postgres (minta
  bantuan asisten; Alembic sudah disiapkan).
