#!/usr/bin/env bash
# Memasang kuis di https://hadirflow.my.id/kuistes (VPS dengan container Docker nginx, atau nginx biasa).
# Jalankan di VPS:  curl -fsSL <URL skrip ini> | sudo bash
# Aman diulang. Setelah dijalankan, SEMUA file kuis (halaman utama, halaman Google, aplikasi) diperbarui
# OTOMATIS dari GitHub setiap 10 menit. Setiap file dicek sidik jari SHA-256 dan hanya file statis yang disalin;
# tidak ada kode yang dijalankan di server.
set -euo pipefail

DOMAIN="hadirflow.my.id"
SUMBER="${SUMBER:-https://raw.githubusercontent.com/novabagusakbar/cliper/claude/kuis-interaktif-google-sites-1311nm/kuistes}"
FOLDER="/var/www/kuistes"
CIRI='name="kuistes-versi"'
KONTAINER="${KONTAINER:-hadirflow_frontend}"
PENANDA="# kuistes-mulai"
CADANGAN="/root/kuistes-cadangan/$(date +%Y%m%d-%H%M%S)"

if [ "$(id -u)" -ne 0 ]; then echo "❌ Jalankan dengan sudo (sebagai root)."; exit 1; fi
mkdir -p "$FOLDER"

# ---------- Menentukan cara HadirFlow dijalankan ----------
MODE="" ROOT="" HOST_DIR="" SALIN=":"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$KONTAINER"; then
  MODE="docker"
  ROOT="$(docker exec "$KONTAINER" sh -c "nginx -T 2>/dev/null | grep -E '^[[:space:]]*root[[:space:]]' | head -1" | awk '{print $2}' | tr -d ';' || true)"
  [ -n "$ROOT" ] || ROOT="/usr/share/nginx/html"
  while IFS='|' read -r SRC DST; do
    [ -n "$DST" ] || continue
    case "$ROOT/" in "$DST"/*) HOST_DIR="$SRC${ROOT#"$DST"}";; esac
  done < <(docker inspect -f '{{range .Mounts}}{{.Source}}|{{.Destination}}{{"\n"}}{{end}}' "$KONTAINER")
  if [ -n "$HOST_DIR" ] && [ -d "$HOST_DIR" ]; then
    SALIN="mkdir -p $HOST_DIR/kuistes && cp -r $FOLDER/. $HOST_DIR/kuistes/"
  else
    HOST_DIR=""
    SALIN="docker exec $KONTAINER mkdir -p $ROOT/kuistes && docker cp $FOLDER/. $KONTAINER:$ROOT/kuistes/"
  fi
elif command -v nginx >/dev/null 2>&1; then
  MODE="nginx"
else
  echo "⚠️  Tidak menemukan container \"$KONTAINER\" maupun nginx di VPS ini."
  echo "    Kirim hasil perintah ini ke Claude: sudo ss -tlnp | grep -E ':80|:443'; sudo docker ps 2>/dev/null | head"
  exit 2
fi

# ---------- 1) Pembaru otomatis ----------
echo "1) Memasang pembaru otomatis..."
{
  printf 'SUMBER=%q\n' "$SUMBER"; printf 'FOLDER=%q\n' "$FOLDER"; printf 'CIRI=%q\n' "$CIRI"; printf 'SALIN=%q\n' "$SALIN"
} > /etc/kuistes.conf
chmod 644 /etc/kuistes.conf
cat > /usr/local/bin/kuistes-perbarui <<'PEMBARU'
#!/usr/bin/env bash
# Pembaru otomatis Tes Gratis HadirFlow (dipasang oleh pasang-di-vps.sh).
# Mengambil daftar-file.txt dari GitHub, lalu hanya mengganti file yang sidik jari SHA-256-nya cocok dengan daftar.
set -uo pipefail
. /etc/kuistes.conf
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
V="?v=$(date +%s)"
curl -fsSL --max-time 60 "$SUMBER/daftar-file.txt$V" -o "$TMP/daftar" || exit 0
grep -qE '^[0-9a-f]{64}  index\.html$' "$TMP/daftar" || exit 0
[ "$(wc -l < "$TMP/daftar")" -le 400 ] || exit 0
BERUBAH=0
while read -r HASH REL; do
  [[ "$HASH" =~ ^[0-9a-f]{64}$ ]] || continue
  [[ "$REL" =~ ^[a-z0-9][a-z0-9._/-]*$ ]] || continue
  [[ "$REL" != *..* ]] || continue
  if [ -f "$FOLDER/$REL" ] && [ "$(sha256sum "$FOLDER/$REL" | cut -d' ' -f1)" = "$HASH" ]; then continue; fi
  curl -fsSL --max-time 60 "$SUMBER/$REL$V" -o "$TMP/f" || continue
  [ "$(sha256sum "$TMP/f" | cut -d' ' -f1)" = "$HASH" ] || continue
  if [ "$REL" = "index.html" ] && ! grep -q "$CIRI" "$TMP/f"; then continue; fi
  mkdir -p "$FOLDER/$(dirname "$REL")"
  install -m 644 "$TMP/f" "$FOLDER/$REL"
  BERUBAH=$((BERUBAH + 1))
done < "$TMP/daftar"
find "$FOLDER" -type d -exec chmod 755 {} +
if [ "$BERUBAH" -gt 0 ] || [ "${1:-}" = "--paksa" ]; then
  eval "$SALIN" >/dev/null 2>&1
  logger -t kuistes "Kuis diperbarui: $BERUBAH file" 2>/dev/null || true
fi
if [ "${1:-}" = "--paksa" ]; then echo "   ✅ $BERUBAH file baru/berubah diambil dari GitHub."; fi
exit 0
PEMBARU
chmod 755 /usr/local/bin/kuistes-perbarui
/usr/local/bin/kuistes-perbarui --paksa
grep -q "$CIRI" "$FOLDER/index.html" 2>/dev/null || { echo "❌ Kuis belum berhasil diunduh dari GitHub. Coba jalankan lagi beberapa menit kemudian."; exit 1; }
echo "*/10 * * * * root /usr/local/bin/kuistes-perbarui >/dev/null 2>&1" > /etc/cron.d/kuistes-perbarui
chmod 644 /etc/cron.d/kuistes-perbarui
echo "   ✅ Pembaruan otomatis aktif: semua file kuis mengikuti GitHub setiap 10 menit."

LOKAL_OK=""
# ---------- 2a) Mode Docker: HadirFlow di container nginx (lewat Cloudflare Tunnel) ----------
if [ "$MODE" = "docker" ]; then
  echo "2) HadirFlow berjalan di container Docker \"$KONTAINER\" (folder web: $ROOT)."
  KONF_REDIRECT="/etc/nginx/conf.d/00-kuistes-redirect.conf"
  if [ -z "$HOST_DIR" ]; then
    # Jika container dibuat ulang (deploy HadirFlow baru), kuis dan pengaturan pengalihan dipasang lagi otomatis
    cat > /etc/cron.d/kuistes <<CRON
# Dibuat oleh pasang-di-vps.sh: memasang ulang kuis bila container HadirFlow dibuat ulang
*/5 * * * * root docker exec $KONTAINER test -f $ROOT/kuistes/index.html 2>/dev/null || /usr/local/bin/kuistes-perbarui --paksa >/dev/null 2>&1
*/5 * * * * root docker exec $KONTAINER test -f $KONF_REDIRECT 2>/dev/null || { docker exec $KONTAINER sh -c "echo 'absolute_redirect off;' > $KONF_REDIRECT && nginx -t && nginx -s reload" || docker exec $KONTAINER rm -f $KONF_REDIRECT; } >/dev/null 2>&1
CRON
    chmod 644 /etc/cron.d/kuistes
    echo "   ✅ Penjaga otomatis aktif: kuis dipasang ulang bila container HadirFlow diperbarui."
  else
    echo "   ✅ Kuis disalin ke $HOST_DIR/kuistes/ (folder VPS yang dipakai container)."
  fi
  # Lewat Cloudflare Tunnel, container menerima HTTP biasa; absolute_redirect off menjaga pengalihan tetap https
  if ! docker exec "$KONTAINER" test -f "$KONF_REDIRECT" 2>/dev/null; then
    if docker exec "$KONTAINER" sh -c "echo 'absolute_redirect off;' > $KONF_REDIRECT && nginx -t" >/dev/null 2>&1; then
      docker exec "$KONTAINER" nginx -s reload >/dev/null 2>&1 || true
      echo "   ✅ Pengalihan /kuistes diperbaiki (tetap https)."
    else
      docker exec "$KONTAINER" rm -f "$KONF_REDIRECT" >/dev/null 2>&1 || true
    fi
  fi
  LOKAL_OK="$(docker exec "$KONTAINER" sh -c "wget -qO- http://127.0.0.1/kuistes/ 2>/dev/null || curl -s http://127.0.0.1/kuistes/" 2>/dev/null || true)"
fi

# ---------- 2b) Mode nginx biasa di VPS ----------
if [ "$MODE" = "nginx" ]; then
  echo "2) Mengatur nginx untuk $DOMAIN..."
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
    if grep -q "$PENANDA" "$f"; then continue; fi
    BLOK="$BLOK" DOM="$DOMAIN" awk '
      { print }
      /^[ \t]*server_name[ \t]/ {
        n = split($0, w, /[ \t;]+/)
        for (i = 2; i <= n; i++) if (w[i] == ENVIRON["DOM"] || w[i] == "www." ENVIRON["DOM"]) { print ENVIRON["BLOK"]; break }
      }
    ' "$f" > "$f.kuistes-baru"
    if cmp -s "$f" "$f.kuistes-baru"; then rm -f "$f.kuistes-baru"; continue; fi
    mkdir -p "$CADANGAN$(dirname "$f")"; cp -p "$f" "$CADANGAN$f"
    cat "$f.kuistes-baru" > "$f"; rm -f "$f.kuistes-baru"
    DIUBAH+=("$f"); echo "   ✏️  Ditambahkan ke $f (cadangan: $CADANGAN$f)"
  done
  if nginx -t 2>/tmp/kuistes-nginx-test.log; then
    if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then systemctl reload nginx; else nginx -s reload; fi
    echo "   ✅ nginx dimuat ulang."
  else
    echo "❌ Pengaturan nginx gagal diperiksa. Semua perubahan dibatalkan:"; cat /tmp/kuistes-nginx-test.log
    for f in "${DIUBAH[@]}"; do cat "$CADANGAN$f" > "$f"; done
    exit 4
  fi
  ambil() { curl "$@" 2>/dev/null || true; }
  LOKAL_OK="$(ambil -sk --noproxy "*" --max-time 10 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/kuistes/")$(ambil -s --noproxy "*" --max-time 10 -H "Host: $DOMAIN" "http://127.0.0.1/kuistes/")"
fi

# ---------- 3) Memeriksa hasil ----------
echo "3) Memeriksa hasil..."
PUBLIK="$(curl -s --max-time 15 "https://$DOMAIN/kuistes/?cek=$(date +%s)" 2>/dev/null || true)"
if [[ "$PUBLIK" == *"$CIRI"* ]]; then
  echo "🎉 Berhasil! Buka https://$DOMAIN/kuistes"
elif [[ "$LOKAL_OK" == *"$CIRI"* ]]; then
  echo "✅ Kuis sudah terpasang di VPS, tetapi dari internet belum terlihat. Tunggu 1 menit lalu buka https://$DOMAIN/kuistes"
else
  echo "⚠️  Kuis belum terlihat. Kirim seluruh tulisan di atas ke Claude."
fi
