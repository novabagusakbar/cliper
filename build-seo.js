// Membuat halaman khusus untuk Google (SEO), manifest aplikasi (PWA), dan daftar file untuk pembaru otomatis.
// Dipanggil dari build.js. Semua hasil ditulis ke folder kuistes/.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = "https://hadirflow.my.id/kuistes/";
const OG = "https://raw.githubusercontent.com/novabagusakbar/cliper/claude/kuis-interaktif-google-sites-1311nm/kuistes/og.png";
const HADIRFLOW = "https://hadirflow.my.id/?utm_source=kuistes&utm_medium=seo";

const KELAS = [["tka", "TK A", "tk", -1], ["tkb", "TK B", "tk", 0]];
for (let k = 1; k <= 12; k++) KELAS.push([String(k), "Kelas " + k, k <= 6 ? "sd" : k <= 9 ? "smp" : "sma", k]);
const JENJANG = { tk: "TK", sd: "SD/MI", smp: "SMP/MTs", sma: "SMA/MA" };
const MAPEL = {
  huruf: ["Mengenal Huruf", "mengenal-huruf", "🔤"], angka: ["Mengenal Angka", "mengenal-angka", "🔢"], warna: ["Warna & Bentuk", "warna-dan-bentuk", "🎨"],
  mtk: ["Matematika", "matematika", "🔢"], bind: ["Bahasa Indonesia", "bahasa-indonesia", "📖"], bing: ["Bahasa Inggris", "bahasa-inggris", "🇬🇧"],
  ipas: ["IPAS", "ipas", "🌱"], ipa: ["IPA", "ipa", "🔬"], fisika: ["Fisika", "fisika", "🧲"], kimia: ["Kimia", "kimia", "⚗️"], biologi: ["Biologi", "biologi", "🦠"],
  pai: ["Pendidikan Agama Islam", "pai", "🕌"], fiqih: ["Fiqih", "fiqih", "🤲"], arab: ["Bahasa Arab", "bahasa-arab", "🌙"]
};
const mapelKelas = (g) => (g <= 0 ? ["huruf", "angka", "warna"] : g <= 6 ? ["mtk", "bind", "bing", "ipas", "pai", "fiqih", "arab"] : g <= 9 ? ["mtk", "bind", "bing", "ipa"] : ["mtk", "bind", "bing", "fisika", "kimia", "biologi"]);
const TRYOUT = { sd: [20, 30], smp: [30, 60], sma: [40, 90] };

// Materi per pelajaran per kelas (sesuai pembuat soal di kuis)
function topik(m, g) {
  const T = {
    huruf: "huruf awal nama benda, urutan abjad, huruf besar dan huruf kecil",
    angka: g < 0 ? "menghitung gambar 1–5, angka sebelum dan sesudah, membaca angka, membandingkan banyak benda" : "menghitung gambar sampai 10, angka sebelum dan sesudah sampai 20, membaca angka, penjumlahan bergambar",
    warna: "warna benda, campuran warna, bentuk benda di sekitar kita, jumlah sisi bangun datar",
    mtk: ({ 1: "penjumlahan dan pengurangan sampai 20, puluhan dan satuan, membandingkan bilangan, membaca jam, bangun datar",
      2: "penjumlahan dan pengurangan sampai 100, perkalian 1–5, pembagian, nilai tempat ratusan, jam setengah, uang, pola bilangan",
      3: "penjumlahan dan pengurangan ratusan sampai ribuan, perkalian, pembagian, nilai tempat, pecahan sederhana, satuan panjang dan berat, waktu, keliling, uang, pembulatan",
      4: "KPK dan FPB, pecahan senilai, luas dan keliling persegi panjang, perkalian dan pembagian bersusun, pembulatan ribuan",
      5: "penjumlahan pecahan, pecahan dan desimal, persen, volume kubus dan balok, kecepatan, skala peta",
      6: "bilangan bulat negatif, luas dan keliling lingkaran, volume tabung, rata-rata dan modus, KPK dalam soal cerita",
      7: "operasi bilangan bulat, bentuk aljabar, persamaan linear satu variabel, perbandingan, diskon dan keuntungan",
      8: "pola bilangan, fungsi, gradien garis, teorema Pythagoras, sistem persamaan linear dua variabel",
      9: "perpangkatan, akar kuadrat, persamaan kuadrat, volume kerucut, peluang",
      10: "eksponen, logaritma, fungsi komposisi, barisan geometri, trigonometri sudut istimewa",
      11: "limit fungsi, turunan, determinan matriks, kombinasi dan permutasi",
      12: "integral tentu dan tak tentu, vektor, deret geometri tak hingga, peluang" })[g],
    bind: g <= 2 ? "huruf awal, suku kata, lawan kata, persamaan kata, kata benda/kerja/sifat, memahami kalimat, tanda baca"
      : g <= 4 ? "lawan kata, persamaan kata, jenis kata, memahami bacaan, tanda baca dan jenis kalimat"
      : g <= 6 ? "lawan kata, persamaan kata, jenis kata, memahami bacaan, imbuhan me-, peribahasa, kata baku"
      : g <= 9 ? "peribahasa, majas, kata baku, imbuhan me-, jenis teks, lawan kata dan persamaan kata" : "majas, kata baku, jenis teks, peribahasa, imbuhan me-",
    bing: g <= 3 ? "kosakata (hewan, warna, keluarga, anggota tubuh, benda di sekolah, buah, hari, bulan), angka 1–100, lawan kata, warna benda"
      : g <= 6 ? "kosakata sehari-hari, angka 1–100, to be (am/is/are), bentuk jamak (plural), kata ganti (pronoun)"
      : g <= 9 ? "simple present, simple past, present continuous, comparative dan superlative, pronoun, plural"
      : "irregular verbs (V2/V3), passive voice, present perfect, conditional tipe 1, question tag, comparative",
    ipas: g <= 4 ? "makhluk hidup dan benda mati, makanan hewan, cara berkembang biak, perubahan wujud benda, bagian tumbuhan, alat indra, magnet, sumber energi"
      : "makhluk hidup, perubahan wujud, energi, tata surya, organ tubuh manusia, sifat cahaya, daur air",
    ipa: ({ 7: "besaran dan satuan SI, suhu, massa jenis, unsur kimia, asam dan basa, klasifikasi hewan vertebrata, tata surya",
      8: "gaya dan percepatan, tekanan, gerak lurus, organ tubuh, sel darah, usaha, sifat cahaya",
      9: "listrik (hukum Ohm), rangkaian hambatan, gelombang, pewarisan sifat, unsur, asam basa, energi potensial" })[g],
    fisika: ({ 10: "gerak lurus berubah beraturan, konversi satuan kecepatan, hukum Newton, besaran SI", 11: "usaha, energi potensial dan kinetik, daya, momentum", 12: "listrik (hukum Ohm), rangkaian hambatan, gelombang, momentum, daya" })[g],
    kimia: ({ 10: "nomor atom, elektron valensi, lambang unsur, ikatan ion dan kovalen, nama senyawa", 11: "massa molekul relatif (Mr), konsep mol, pH larutan, rumus dan nama senyawa", 12: "konsep mol, massa molekul relatif, pH, elektron valensi, tata nama senyawa" })[g],
    biologi: ({ 10: "lima kingdom, urutan takson, rantai makanan, hewan vertebrata, mikroorganisme", 11: "organel sel, sel darah, enzim pencernaan, organ tubuh, jaringan tumbuhan, hormon, sendi, ekskresi, pernapasan", 12: "genetika Mendel, organel sel, enzim, rantai makanan, hormon, mikroorganisme" })[g],
    pai: "rukun iman dan rukun Islam, Asmaul Husna, malaikat dan tugasnya, kitab suci, sifat wajib Allah, akhlak terpuji, surah pendek, kisah nabi",
    fiqih: "salat fardu dan jumlah rakaat, waktu salat, salat sunah rawatib, wudu, azan, salat berjamaah, zikir setelah salat, air suci",
    arab: "kosakata benda, tempat, keluarga, angka, warna, anggota tubuh, hewan, buah, hari, kegiatan, pekerjaan, dan ungkapan sehari-hari"
  };
  return T[m];
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugKelas = (k, j) => (j === "tk" ? (k === "tka" ? "tk-a" : "tk-b") : `kelas-${k}-${j}`);
const CSS = `:root{--bg:#fff8e7;--ink:#2d2a32;--muted:#6b6475;--hijau:#2f9e6e;--hijau-tua:#227a54;--garis:#f0e6cf}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.6 "Baloo 2",system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#072B6B}
.kartu{background:#fff;border:3px solid var(--garis);border-radius:22px;padding:20px;margin-top:16px;box-shadow:0 6px 0 rgba(0,0,0,.06)}
h1{font-size:clamp(28px,6vw,40px);line-height:1.15;color:var(--hijau-tua);margin:8px 0}h2{font-size:22px;margin:0 0 8px}
.tombol{display:inline-block;background:var(--hijau);color:#fff;font-weight:800;font-size:20px;text-decoration:none;border-radius:18px;padding:12px 24px;box-shadow:0 5px 0 var(--hijau-tua);margin:6px 8px 6px 0}
.tombol.kedua{background:#fff;color:var(--ink);border:3px solid var(--garis);box-shadow:0 5px 0 var(--garis)}
.kecil{color:var(--muted);font-size:15px}.chip{display:inline-block;background:#fff;border:2px solid var(--garis);border-radius:999px;padding:2px 12px;margin:3px 4px 3px 0;font-size:15px;text-decoration:none;color:var(--ink)}
.hf{background:#072B6B;color:#fff;border:0}.hf a{color:#ffd23f;font-weight:800}ul{padding-left:22px}`;

function halaman({ judul, deskripsi, url, h1, isi }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(judul)}</title>
<meta name="description" content="${esc(deskripsi)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="HadirFlow">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(judul)}"><meta property="og:description" content="${esc(deskripsi)}">
<meta property="og:image" content="${OG}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2f9e6e">
<link rel="manifest" href="${BASE}manifest.json"><link rel="icon" href="${BASE}ikon-192.png">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body><main>
<p class="kecil"><a href="${BASE}">🦉 Tes Gratis HadirFlow</a></p>
<h1>${esc(h1)}</h1>
${isi}
<div class="kartu hf"><h2>🏫 Untuk Bapak/Ibu Guru, Kepala Sekolah & Pemilik Usaha</h2>
<p>Masih absen manual? <b>HadirFlow</b>: absensi wajah anti titip absen untuk guru dan karyawan, gaji dihitung otomatis. <a href="${HADIRFLOW}">Coba HadirFlow →</a></p></div>
</main></body></html>
`;
}

function buatSEO(dirOut) {
  const halamanList = [];
  const tulisHalaman = (slug, html) => {
    const d = path.join(dirOut, slug);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "index.html"), html);
    halamanList.push(BASE + slug + "/");
  };
  const semua = [];
  KELAS.forEach(([k, namaK, j, g]) => mapelKelas(g).forEach((m) => semua.push({ k, namaK, j, g, m })));
  const slugKuis = (x) => `kuis-${MAPEL[x.m][1]}-${slugKelas(x.k, x.j)}`;
  const labelKelas = (x) => (x.j === "tk" ? x.namaK : `${x.namaK} ${JENJANG[x.j]}`);

  // Halaman per pelajaran per kelas
  semua.forEach((x) => {
    const [nm, , ikon] = MAPEL[x.m], lk = labelKelas(x), to = TRYOUT[x.j];
    const saudara = semua.filter((y) => y.k === x.k && y.m !== x.m).map((y) => `<a class="chip" href="${BASE}${slugKuis(y)}/">${MAPEL[y.m][2]} ${MAPEL[y.m][0]}</a>`).join("");
    const kelasLain = semua.filter((y) => y.m === x.m && y.k !== x.k).map((y) => `<a class="chip" href="${BASE}${slugKuis(y)}/">${labelKelas(y)}</a>`).join("");
    const isi = `<p>Latihan soal <b>${nm} ${lk}</b> secara online dan <b>gratis</b>. Soal dibuat otomatis sehingga selalu baru, lengkap dengan pembahasan setelah menjawab.</p>
<p><a class="tombol" href="${BASE}?k=${x.k}&amp;m=${x.m}">${ikon} Mulai Latihan ${esc(nm)}</a>${to ? `<a class="tombol kedua" href="${BASE}?k=${x.k}&amp;m=${x.m}&amp;mode=tryout">⏱️ Tryout ${to[0]} soal, ${to[1]} menit</a>` : ""}</p>
<div class="kartu"><h2>📚 Materi yang dilatih</h2><p>${esc(topik(x.m, x.g))}.</p></div>
<div class="kartu"><h2>✨ Kenapa latihan di sini?</h2><ul>
<li>Soal selalu berganti, jadi tidak bosan dan tidak hafal jawaban.</li>
<li>Langsung ada pembahasan setiap kali menjawab.</li>
${to ? `<li>Mode tryout dengan batas waktu untuk persiapan ujian.</li>` : ""}
<li>Rapor perkembangan dan piagam prestasi untuk anak.</li>
${x.g <= 2 ? "<li>Soal bisa dibacakan suara, cocok untuk anak yang belum lancar membaca.</li>" : ""}
<li>Guru bisa membuat link kuis untuk kelas, nilainya masuk ke WhatsApp guru.</li></ul></div>
${saudara ? `<div class="kartu"><h2>📖 Pelajaran lain ${esc(lk)}</h2>${saudara}</div>` : ""}
<div class="kartu"><h2>🏫 ${esc(nm)} kelas lain</h2>${kelasLain}</div>
<div class="kartu"><h2>🧠 Tes gratis lainnya</h2><a class="chip" href="${BASE}tes-iq-anak/">Tes Kecerdasan (ala IQ)</a><a class="chip" href="${BASE}tes-gaya-belajar/">Tes Gaya Belajar (ala STIFIn)</a><a class="chip" href="${BASE}tes-kepribadian/">Tes Kepribadian (ala MBTI)</a></div>`;
    tulisHalaman(slugKuis(x), halaman({
      judul: `Latihan Soal ${nm} ${lk} Online Gratis + Pembahasan | HadirFlow`,
      deskripsi: `Latihan soal ${nm} ${lk} gratis dan selalu baru: ${topik(x.m, x.g)}. Ada pembahasan${to ? ", tryout," : ""} rapor, dan piagam.`,
      url: BASE + slugKuis(x) + "/", h1: `Latihan Soal ${nm} ${lk}`, isi
    }));
  });

  // Halaman tes
  const TES = [
    ["tes-iq-anak", "otak", "Tes Kecerdasan Anak (ala IQ) Online Gratis", "Tes kecerdasan anak online gratis: 20 soal angka, pola gambar, kata, dan logika, dengan tingkat SD, SMP, SMA, dan dewasa. Hasil langsung keluar per bidang.",
      "<p>Tes ini melatih kemampuan berpikir anak lewat <b>20 soal</b> tentang angka, pola gambar, kata, dan logika. Pilih tingkat sesuai usia: SD kelas 1–3, SD kelas 4–6, SMP, atau SMA & dewasa. Hasilnya berupa skor, kategori, kekuatan per bidang, dan pembahasan.</p><p class=\"kecil\">Catatan: ini latihan kemampuan berpikir, bukan tes IQ resmi. Skor IQ yang sah hanya dari tes terstandar oleh psikolog.</p>"],
    ["tes-gaya-belajar", "mesin", "Tes Gaya Belajar Anak (ala STIFIn) Online Gratis", "Kenali gaya belajar anak: Sensing, Thinking, Intuiting, Feeling, atau Insting. 15 pertanyaan, hasil langsung dengan tips cara belajar yang cocok.",
      "<p>Lewat <b>15 pertanyaan</b> sederhana, kenali kecenderungan gaya belajar anak: <b>Si Pengingat (Sensing), Si Pemikir (Thinking), Si Kreatif (Intuiting), Si Perasa (Feeling), atau Si Serba Bisa (Insting)</b>. Hasilnya dilengkapi ciri-ciri dan cara belajar yang cocok.</p><p class=\"kecil\">Catatan: terinspirasi konsep STIFIn. Tes STIFIn resmi memakai pemindaian sidik jari oleh lembaga resminya.</p>"],
    ["tes-kepribadian", "kepribadian", "Tes Kepribadian (ala MBTI, DISC, Temperamen) Online Gratis", "Tes kepribadian gratis: MBTI, DISC, dan 4 temperamen dalam 28 pertanyaan. Hasil lengkap dengan kartu untuk Status WhatsApp.",
      "<p>Kenali diri lewat <b>28 pertanyaan singkat</b>: tipe <b>MBTI</b> (16 tipe), gaya <b>DISC</b>, dan <b>temperamen</b> (Koleris, Sanguinis, Melankolis, Plegmatis). Cocok untuk anak sampai orang tua. Hasilnya bisa dibagikan sebagai kartu Status WA.</p><p class=\"kecil\">Catatan: untuk hiburan dan refleksi diri, bukan pengganti tes psikologi resmi.</p>"]
  ];
  TES.forEach(([slug, id, judul, desk, isi]) => tulisHalaman(slug, halaman({ judul: judul + " | HadirFlow", deskripsi: desk, url: BASE + slug + "/", h1: judul,
    isi: isi + `<p><a class="tombol" href="${BASE}?tes=${id}">🚀 Mulai Tes Sekarang</a></p>
<div class="kartu"><h2>📚 Kuis pelajaran gratis TK–SMA</h2>${["tka", "1", "3", "5", "7", "9", "10", "12"].map((k) => { const x = semua.find((y) => y.k === k && (y.m === "mtk" || y.m === "angka")); return `<a class="chip" href="${BASE}${slugKuis(x)}/">${MAPEL[x.m][0]} ${labelKelas(x)}</a>`; }).join("")}</div>` })));

  // Tautan untuk halaman utama (dibaca Google), dikelompokkan per jenjang
  const tautanUtama = Object.keys(JENJANG).map((j) => `<p class="judul">${JENJANG[j]}</p><p>` +
    semua.filter((x) => x.j === j).map((x) => `<a class="chip-seo" href="${BASE}${slugKuis(x)}/">${MAPEL[x.m][0]} ${x.namaK}</a>`).join(" ") + "</p>").join("") +
    `<p class="judul">Tes</p><p>${TES.map(([slug, , judul]) => `<a class="chip-seo" href="${BASE}${slug}/">${judul.replace(" Online Gratis", "")}</a>`).join(" ")}</p>`;

  // Peta situs untuk Google Search Console
  const urls = [BASE].concat(halamanList);
  fs.writeFileSync(path.join(dirOut, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") + "\n</urlset>\n");
  return { jumlah: halamanList.length, tautanUtama };
}

// Manifest aplikasi & service worker (lingkup hanya /kuistes/, tidak mengganggu aplikasi HadirFlow)
function buatPWA(dirOut, versi) {
  fs.writeFileSync(path.join(dirOut, "manifest.json"), JSON.stringify({
    name: "Tes Gratis HadirFlow", short_name: "Tes HadirFlow", description: "Tes kecerdasan, gaya belajar, kepribadian, dan kuis pelajaran TK–SMA gratis.",
    start_url: "/kuistes/?sumber=aplikasi", scope: "/kuistes/", display: "standalone", background_color: "#fff8e7", theme_color: "#2f9e6e", lang: "id",
    icons: [{ src: "/kuistes/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" }, { src: "/kuistes/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }]
  }, null, 2));
  fs.writeFileSync(path.join(dirOut, "sw.js"), `// Service worker Tes Gratis HadirFlow. Lingkup: /kuistes/ saja.
const CACHE = "kuistes-${versi}";
const INTI = ["/kuistes/", "/kuistes/ikon-192.png", "/kuistes/manifest.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf("kuistes-") === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.indexOf("/kuistes/") !== 0) return;
  // Jaringan dulu (supaya selalu versi terbaru), cadangan dari cache saat sinyal hilang
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const salin = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, salin)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/kuistes/"))));
});
`);
}

// Daftar file + sidik jari SHA-256 untuk pembaru otomatis di VPS
function buatDaftar(dirOut) {
  const hasil = [];
  (function jelajah(d) {
    fs.readdirSync(d).sort().forEach((n) => {
      const p = path.join(d, n), rel = path.relative(dirOut, p).split(path.sep).join("/");
      if (fs.statSync(p).isDirectory()) return jelajah(p);
      if (rel === "daftar-file.txt") return;
      hasil.push(crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex") + "  " + rel);
    });
  })(dirOut);
  fs.writeFileSync(path.join(dirOut, "daftar-file.txt"), hasil.join("\n") + "\n");
  return hasil.length;
}

module.exports = { buatSEO, buatPWA, buatDaftar };
