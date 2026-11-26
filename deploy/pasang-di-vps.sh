#!/usr/bin/env bash
# Memasang kuis di https://hadirflow.my.id/kuistes (VPS dengan container Docker nginx, atau nginx biasa).
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

# ---------- Mode Docker: HadirFlow berjalan di container nginx (lewat Cloudflare Tunnel) ----------
KONTAINER="${KONTAINER:-hadirflow_frontend}"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$KONTAINER"; then
  echo "2) HadirFlow berjalan di container Docker \"$KONTAINER\"."
  ROOT="$(docker exec "$KONTAINER" sh -c "nginx -T 2>/dev/null | grep -E '^[[:space:]]*root[[:space:]]' | head -1" | awk '{print $2}' | tr -d ';' || true)"
  [ -n "$ROOT" ] || ROOT="/usr/share/nginx/html"
  echo "   Folder web di dalam container: $ROOT"

  # Jika folder web berasal dari folder di VPS (bind mount), salin ke sana supaya tidak hilang
  HOST_DIR=""
  while IFS='|' read -r SRC DST; do
    [ -n "$DST" ] || continue
    case "$ROOT/" in "$DST"/*) HOST_DIR="$SRC${ROOT#"$DST"}";; esac
  done < <(docker inspect -f '{{range .Mounts}}{{.Source}}|{{.Destination}}{{"\n"}}{{end}}' "$KONTAINER")

  if [ -n "$HOST_DIR" ] && [ -d "$HOST_DIR" ]; then
    mkdir -p "$HOST_DIR/kuistes"
    cp "$FOLDER/index.html" "$HOST_DIR/kuistes/index.html"
    chmod 755 "$HOST_DIR/kuistes"; chmod 644 "$HOST_DIR/kuistes/index.html"
    echo "   ✅ Disalin ke $HOST_DIR/kuistes/ (folder VPS yang dipakai container)"
  else
    docker exec "$KONTAINER" mkdir -p "$ROOT/kuistes"
    docker cp "$FOLDER/index.html" "$KONTAINER:$ROOT/kuistes/index.html"
    docker exec "$KONTAINER" chmod 644 "$ROOT/kuistes/index.html"
    echo "   ✅ Disalin ke dalam container: $ROOT/kuistes/"
    # Jika container dibuat ulang (deploy HadirFlow baru), salin lagi otomatis setiap 5 menit bila hilang
    cat > /etc/cron.d/kuistes <<CRON
# Dibuat oleh pasang-di-vps.sh: memasang ulang kuis bila container HadirFlow dibuat ulang
*/5 * * * * root docker exec $KONTAINER test -f $ROOT/kuistes/index.html 2>/dev/null || { docker exec $KONTAINER mkdir -p $ROOT/kuistes && docker cp $FOLDER/index.html $KONTAINER:$ROOT/kuistes/index.html; } >/dev/null 2>&1
CRON
    chmod 644 /etc/cron.d/kuistes
    echo "   ✅ Penjaga otomatis dipasang (/etc/cron.d/kuistes): kuis dipasang ulang bila container diperbarui."
  fi

  echo "3) Memeriksa hasil..."
  CIRI="Kuis Pintar Kelas 3 MI"
  ISI_LOKAL="$(docker exec "$KONTAINER" sh -c "wget -qO- http://127.0.0.1/kuistes/ 2>/dev/null || curl -s http://127.0.0.1/kuistes/" 2>/dev/null || true)"
  ISI_PUBLIK="$(curl -s --max-time 15 "https://$DOMAIN/kuistes/?cek=$(date +%s)" 2>/dev/null || true)"
  if [[ "$ISI_PUBLIK" == *"$CIRI"* ]]; then
    echo "🎉 Berhasil! Buka https://$DOMAIN/kuistes"
  elif [[ "$ISI_LOKAL" == *"$CIRI"* ]]; then
    echo "✅ Container sudah menyajikan kuis, tetapi dari internet belum terlihat."
    echo "   Tunggu 1 menit lalu buka https://$DOMAIN/kuistes . Jika masih belum, buka Cloudflare → Caching → Purge Everything."
  else
    echo "⚠️  Pengaturan nginx di container belum mengarahkan /kuistes/ ke file kuis."
    echo "    Kirim hasil perintah ini ke Claude:"
    echo "    sudo docker exec $KONTAINER cat /etc/nginx/conf.d/default.conf"
  fi
  exit 0
fi

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
