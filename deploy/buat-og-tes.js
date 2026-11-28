// Membuat gambar pratinjau link (1200×630) untuk setiap tes: kuistes/og/<slug>.png
// Jalankan setiap daftar tes berubah: node deploy/buat-og-tes.js  (butuh Playwright; set HTTPS_PROXY bila perlu)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

// slug, emoji, baris kecil, judul, ajakan, warna latar (dua warna gradasi), warna teks judul
const DAFTAR = [
  ["otak", "🧠", "TES KECERDASAN", "Tes Kecerdasan (ala IQ)", "Berani adu skor?", ["#0a4d3a", "#0f7a5a"], "#f6dc8f"],
  ["majemuk", "🌈", "TES KECERDASAN", "Kecerdasan Majemuk", "Kecerdasanmu yang mana?", ["#ff9ec7", "#ffd27a"], "#3b1240"],
  ["ingat", "💭", "TES KECERDASAN", "Tes Daya Ingat", "Bisa ingat berapa urutan?", ["#ffb877", "#ffe2a8"], "#5a2a08"],
  ["fokus", "🎯", "TES KECERDASAN", "Tes Konsentrasi", "Seberapa tajam fokusmu?", ["#5ec8f2", "#b6ecff"], "#06324d"],
  ["ruang", "🧊", "TES KECERDASAN", "Tes Ruang (Spasial)", "Bisa memutar bentuk di kepala?", ["#8f7cf5", "#d4ccff"], "#1e1457"],
  ["vak", "👁️", "TES GAYA BELAJAR", "Visual, Auditori, atau Kinestetik?", "Gaya belajarmu yang mana?", ["#7db9ff", "#c9f2e6"], "#072B6B"],
  ["vak-ortu", "👨‍👩‍👧", "GAYA BELAJAR SI KECIL", "Gaya Belajar Anak TK", "Diisi Ayah/Bunda, 3 menit", ["#ffcf8a", "#fff0d6"], "#5a2a08"],
  ["mesin", "🧬", "TES GAYA BELAJAR", "Gaya Belajar ala STIFIn", "Mesin kecerdasanmu apa?", ["#c79bff", "#f0e2ff"], "#2b0f57"],
  ["gaya4", "🔄", "TES GAYA BELAJAR", "4 Gaya Belajar Remaja & Dewasa", "Aktivis, Reflektor, Teoris, atau Pragmatis?", ["#6fd3a8", "#e1f7ec"], "#0b3f30"],
  ["mbti", "🧩", "TES KEPRIBADIAN", "Tes MBTI 16 Tipe", "Kamu tipe apa?", ["#7a8cff", "#dde3ff"], "#141f5c"],
  ["disc", "🎯", "TES KEPRIBADIAN", "Tes DISC", "D, I, S, atau C?", ["#ff8c80", "#ffe0dd"], "#5c0f0a"],
  ["temperamen", "🌡️", "TES KEPRIBADIAN", "Tes Temperamen", "Koleris, Sanguinis, Melankolis, atau Plegmatis?", ["#ffcf3c", "#fff4c2"], "#4d3700"],
  ["kekuatan", "💪", "KENALI DIRI", "Kelebihanku", "Apa kelebihan terbesarmu?", ["#ffd23f", "#fff6cc"], "#4d3700"],
  ["darah", "🩸", "KENALI DIRI", "Golongan Darahku", "Golonganmu apa?", ["#ff8fa0", "#ffe0e5"], "#5c0a18"],
  ["kuis", "🏆", "KUIS PELAJARAN TK–SMA", "Bisa kalahkan nilaiku?", "Soal selalu baru, langsung ada nilainya", ["#2fbf8f", "#c9f2dd"], "#0b3f30"],
  ["pas", "📝", "PERSIAPAN UJIAN AKHIR SEMESTER", "Latihan Soal PAS & PAT", "Tryout gratis + peta kesiapan semua pelajaran", ["#5b8def", "#d9e6ff"], "#0b2a6b"],
  ["harian", "🔥", "TANTANGAN HARIAN", "Ikut Tantangan Harian!", "5 soal sehari, berapa hari kamu kuat?", ["#ff9a52", "#ffe2c4"], "#5a1e00"]
];

const kartu = ([slug, emoji, kecil, judul, ajak, [w1, w2], warnaJudul]) => `
<div class="og${slug === "otak" ? " gelap" : ""}" id="${slug}" style="background:linear-gradient(135deg, ${w1}, ${w2})">
  <div class="bul" style="width:380px;height:380px;right:-120px;top:-140px"></div><div class="bul" style="width:260px;height:260px;left:-90px;bottom:-110px"></div>
  <div class="kiri"><div class="emoji">${emoji}</div></div>
  <div class="kanan">
    <div class="merek"><img src="../src/logo-hadirflow-128.png"><span>Hadir<b>Flow</b></span></div>
    <div class="kecil">🎯 ${kecil}</div>
    <div class="judul" style="color:${warnaJudul}">${judul}</div>
    <div class="ajak">${ajak}</div>
    <div class="cta">GRATIS • tanpa daftar • langsung ada hasil</div>
  </div>
</div>`;

(async () => {
  const akar = path.join(__dirname, "..");
  const keluar = path.join(akar, "kuistes", "og");
  fs.mkdirSync(keluar, { recursive: true });
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{font-family:Nunito,sans-serif}
.og{width:1200px;height:630px;position:relative;overflow:hidden;display:flex;align-items:center;padding:0 70px;gap:50px}
.bul{position:absolute;border-radius:50%;background:rgba(255,255,255,.22)}
.kiri{flex:none;width:330px;height:330px;border-radius:50%;background:rgba(255,255,255,.85);display:grid;place-items:center;box-shadow:0 18px 40px rgba(0,0,0,.15)}
.emoji{font-size:190px;line-height:1}
.kanan{flex:1;position:relative}
.merek{display:inline-flex;align-items:center;gap:10px;background:#fff;border-radius:999px;padding:8px 22px 8px 12px;box-shadow:0 6px 18px rgba(0,0,0,.12)}
.merek img{height:42px}.merek span{font-family:Poppins,sans-serif;font-weight:800;font-size:30px;color:#072B6B;letter-spacing:-.6px}.merek b{color:#02a581}
.kecil{margin-top:26px;font-weight:900;font-size:28px;letter-spacing:1px;color:rgba(0,0,0,.55)}
.judul{font-weight:900;font-size:66px;line-height:1.05;margin-top:8px;letter-spacing:-1px}
.ajak{font-weight:800;font-size:36px;margin-top:16px;color:#1d1a2f}
.gelap .kecil{color:rgba(255,255,255,.75)}.gelap .ajak{color:#e3f3ec}.gelap .cta{background:#f6dc8f;color:#0b3f30}
.cta{display:inline-block;margin-top:26px;background:#072B6B;color:#fff;font-weight:900;font-size:28px;border-radius:999px;padding:12px 28px}
</style></head><body>${DAFTAR.map(kartu).join("")}</body></html>`;
  const sumber = path.join(akar, "deploy", ".og-sementara.html");
  fs.writeFileSync(sumber, html);
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
  const p = await (await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1300, height: 800 } })).newPage();
  await p.goto("file://" + sumber); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  for (const [slug] of DAFTAR) { await (await p.$("#" + slug)).screenshot({ path: path.join(keluar, slug + ".png") }); console.log("✓", slug); }
  await b.close();
  fs.unlinkSync(sumber);
})();
