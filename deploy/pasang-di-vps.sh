#!/usr/bin/env bash
# Memasang kuis di https://hadirflow.my.id/kuistes pada VPS yang memakai nginx.
# Jalankan di VPS:  curl -fsSL <URL skrip ini> | sudo bash
# Aman diulang: menjalankan lagi = memperbarui kuis ke versi terbaru.
set -euo pipefail

DOMAIN="hadirflow.my.id"
SUMBER="https://raw.githubusercontent.com/novabagusakbar/cliper/claude/kuis-interaktif-google-sites-1311nm/kuistes/index.html"
FOLDER="/var/www/kuistes"
PENANDA="# kuistes-mulai"
CADANGAN="/root/kuistes-cadangan/$(date +%Y%m%d-%H%M%S)"

if [ "$(id -u)" -ne 0 ]; then echo "❌ Jalankan dengan sudo (sebagai root)."; exit 1; fi

echo "1) Mengunduh kuis terbaru..."
mkdir -p "$FOLDER"
curl -fsSL "$SUMBER" -o "$FOLDER/index.html.baru"
grep -q "Kuis Pintar Kelas 3 MI" "$FOLDER/index.html.baru" || { echo "❌ File yang diunduh tidak sesuai."; rm -f "$FOLDER/index.html.baru"; exit 1; }
mv "$FOLDER/index.html.baru" "$FOLDER/index.html"
chmod 755 "$FOLDER"; chmod 644 "$FOLDER/index.html"
echo "   ✅ Tersimpan di $FOLDER/index.html"

if ! command -v nginx >/dev/null 2>&1; then
  echo
  echo "⚠️  nginx tidak ditemukan di VPS ini. File kuis sudah diunduh, tetapi web server perlu diatur manual."
  echo "    Kirim hasil perintah berikut ke Claude supaya bisa dibantu:"
  echo "    sudo ss -tlnp | grep -E ':80|:443'; docker ps 2>/dev/null | head"
  exit 2
fi

echo "2) Mencari pengaturan nginx untuk $DOMAIN..."
mapfile -t FILES < <(grep -rlF "$DOMAIN" /etc/nginx/ 2>/dev/null | sort -u || true)
if [ ${#FILES[@]} -eq 0 ]; then
  echo "❌ Tidak ada pengaturan nginx dengan server_name $DOMAIN."
  echo "   Kirim hasil perintah ini ke Claude: sudo nginx -T 2>/dev/null | grep -nE 'server_name|listen|include'"
  exit 3
fi

BLOK="    $PENANDA (dipasang otomatis untuk kuis)
    location = /kuistes { return 301 /kuistes/; }
    location /kuistes/ {
        alias $FOLDER/;
        index index.html;
        add_header Cache-Control \"no-cache\";
    }
    # kuistes-selesai"

declare -a DIUBAH=()
for f in "${FILES[@]}"; do
  if grep -q "$PENANDA" "$f"; then echo "   ↪ $f sudah berisi pengaturan kuis, dilewati."; continue; fi
  # Sisipkan blok tepat setelah baris "server_name" yang memuat domain persis (masih di dalam blok server)
  BLOK="$BLOK" DOM="$DOMAIN" awk '
    { print }
    /^[ \t]*server_name[ \t]/ {
      n = split($0, w, /[ \t;]+/)
      for (i = 2; i <= n; i++) if (w[i] == ENVIRON["DOM"] || w[i] == "www." ENVIRON["DOM"]) { print ENVIRON["BLOK"]; break }
    }
  ' "$f" > "$f.kuistes-baru"
  if cmp -s "$f" "$f.kuistes-baru"; then rm -f "$f.kuistes-baru"; continue; fi
  mkdir -p "$CADANGAN$(dirname "$f")"
  cp -p "$f" "$CADANGAN$f"
  cat "$f.kuistes-baru" > "$f"; rm -f "$f.kuistes-baru"
  DIUBAH+=("$f")
  echo "   ✏️  Ditambahkan ke $f (cadangan: $CADANGAN$f)"
done
if [ ${#DIUBAH[@]} -eq 0 ] && ! grep -rqF "$PENANDA" /etc/nginx/; then
  echo "❌ Tidak ada baris server_name yang persis berisi $DOMAIN."
  echo "   Kirim hasil perintah ini ke Claude: sudo nginx -T 2>/dev/null | grep -nE 'server_name|listen|include'"
  exit 3
fi

echo "3) Memeriksa pengaturan nginx..."
if nginx -t 2>/tmp/kuistes-nginx-test.log; then
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then systemctl reload nginx; else nginx -s reload; fi
  echo "   ✅ nginx dimuat ulang."
else
  echo "❌ Pengaturan nginx gagal diperiksa. Semua perubahan dibatalkan:"
  cat /tmp/kuistes-nginx-test.log
  for f in "${DIUBAH[@]}"; do cat "$CADANGAN$f" > "$f"; done
  echo "   Pengaturan lama sudah dikembalikan."
  exit 4
fi

echo "4) Memeriksa hasil..."
CIRI="Kuis Pintar Kelas 3 MI"
ambil() { curl "$@" 2>/dev/null || true; }   # baca dulu seluruh halaman, baru dicari (aman dengan pipefail)
LOKAL=tidak
ISI_LOKAL="$(ambil -sk --noproxy "*" --max-time 10 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/kuistes/")$(ambil -s --noproxy "*" --max-time 10 -H "Host: $DOMAIN" "http://127.0.0.1/kuistes/")"
[[ "$ISI_LOKAL" == *"$CIRI"* ]] && LOKAL=ya
ISI_PUBLIK="$(ambil -s --max-time 15 "https://$DOMAIN/kuistes/?cek=$(date +%s)")"
if [[ "$ISI_PUBLIK" == *"$CIRI"* ]]; then
  echo "🎉 Berhasil! Buka https://$DOMAIN/kuistes"
elif [ "$LOKAL" = ya ]; then
  echo "✅ nginx di VPS sudah menyajikan kuis, tetapi dari internet belum terlihat."
  echo "   Kemungkinan tertahan cache Cloudflare: buka dasbor Cloudflare → Caching → Purge Everything, lalu coba lagi."
else
  echo "⚠️  Kuis belum terlihat. Kirim seluruh tulisan di atas dan hasil perintah ini ke Claude:"
  echo "    sudo nginx -T 2>/dev/null | grep -nE 'server_name|listen|location|proxy_pass|include'"
fi
