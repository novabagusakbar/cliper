// Membuat halaman khusus untuk Google (SEO), manifest aplikasi (PWA), dan daftar file untuk pembaru otomatis.
// Dipanggil dari build.js. Semua hasil ditulis ke folder kuistes/.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = "https://hadirflow.my.id/kuistes/";
const OG = BASE + "og.png";
const slugOG = (id) => (id === "kepribadian" ? "mbti" : id === "vakOrtu" ? "vak-ortu" : id);
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
const CSS = `:root{--bg:#f3f6fb;--ink:#14213d;--muted:#5b6478;--hijau:#018f70;--hijau-tua:#016a53;--garis:#e2e8f2;--navy:#072B6B}
.brand-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border-bottom:1px solid var(--garis);padding:8px max(16px,calc((100% - 728px) / 2))}
.brand{display:flex;align-items:center;gap:8px;text-decoration:none}.brand img{height:34px;width:auto}
.wordmark{font-family:Poppins,Nunito,sans-serif;font-weight:800;font-size:22px;color:var(--navy);letter-spacing:-.4px}.wordmark b{color:#02a581}
.brand-cta{font-size:14px;font-weight:800;color:var(--navy);border:2px solid var(--garis);border-radius:999px;padding:4px 12px;text-decoration:none;white-space:nowrap}
@media (max-width:400px){.brand-cta{display:none}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.6 Nunito,"Segoe UI",system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#072B6B}
.kartu{background:#fff;border:2px solid var(--garis);border-radius:22px;padding:20px;margin-top:16px;box-shadow:0 6px 0 rgba(0,0,0,.06)}
h1{font-size:clamp(28px,6vw,40px);line-height:1.15;color:var(--navy);margin:8px 0}h2{font-size:22px;margin:0 0 8px}
.tombol{display:inline-block;background:var(--hijau);color:#fff;font-weight:800;font-size:20px;text-decoration:none;border-radius:18px;padding:12px 24px;box-shadow:0 5px 0 var(--hijau-tua);margin:6px 8px 6px 0}
.tombol.kedua{background:#fff;color:var(--ink);border:3px solid var(--garis);box-shadow:0 5px 0 var(--garis)}
.kecil{color:var(--muted);font-size:15px}.chip{display:inline-block;background:#fff;border:2px solid var(--garis);border-radius:999px;padding:2px 12px;margin:3px 4px 3px 0;font-size:15px;text-decoration:none;color:var(--ink)}
.hf{background:linear-gradient(135deg,#072B6B,#0a4686);color:#fff;border:0}.hf a{color:#ffd23f;font-weight:800}ul{padding-left:22px}
.batang{display:grid;grid-template-columns:130px 1fr 36px;gap:8px;align-items:center;margin:6px 0;font-size:16px}.jalur{height:14px;background:#eef2f8;border-radius:99px;overflow:hidden}.jalur span{display:block;height:100%;background:linear-gradient(90deg,#02c2c1,#02a581);border-radius:99px}
.langkah{counter-reset:l;list-style:none;padding:0}.langkah li{counter-increment:l;position:relative;padding:4px 0 10px 48px}.langkah li::before{content:counter(l);position:absolute;left:0;top:2px;width:34px;height:34px;border-radius:50%;background:var(--hijau);color:#fff;font-weight:800;display:grid;place-items:center}
.grid-manfaat{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}.grid-manfaat div{background:#f6faf8;border:2px solid #d9efe6;border-radius:16px;padding:12px}.grid-manfaat b{display:block}
details{border-top:1px solid var(--garis);padding:10px 0}summary{font-weight:800;cursor:pointer}`;

function halaman({ judul, deskripsi, url, h1, isi, noindex, og }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(judul)}</title>
<meta name="description" content="${esc(deskripsi)}">
<link rel="canonical" href="${url}">${noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="website"><meta property="og:site_name" content="HadirFlow">
<meta property="og:url" content="${url}"><meta property="og:title" content="${esc(judul)}"><meta property="og:description" content="${esc(deskripsi)}">
<meta property="og:image" content="${og || OG}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#072B6B">
<link rel="manifest" href="${BASE}manifest.json"><link rel="icon" type="image/png" sizes="32x32" href="${BASE}favicon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="${BASE}ikon-192.png"><link rel="apple-touch-icon" href="${BASE}ikon-192.png">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Poppins:wght@800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<header class="brand-bar"><a class="brand" href="${BASE}"><img src="${BASE}logo-hadirflow.png" alt="" width="29" height="34"><span class="wordmark">Hadir<b>Flow</b></span></a><a class="brand-cta" href="${HADIRFLOW}">Absensi &amp; Gaji Otomatis ↗</a></header>
<main>
<p class="kecil"><a href="${BASE}">🦉 Tes Gratis HadirFlow</a></p>
<h1>${esc(h1)}</h1>
${isi}
<div class="kartu hf"><img src="${BASE}logo-hadirflow.png" alt="HadirFlow" width="41" height="48" style="float:right;height:48px;width:auto;background:#fff;border-radius:12px;padding:4px 6px;margin:0 0 8px 10px"><h2>🏫 Untuk Bapak/Ibu Guru, Kepala Sekolah & Pemilik Usaha</h2>
<p>Masih absen manual? <b>HadirFlow</b>: absensi wajah anti titip absen untuk guru dan karyawan, gaji dihitung otomatis. <a href="${HADIRFLOW}">Coba HadirFlow →</a></p></div>
</main></body></html>
`;
}

function buatSEO(dirOut, VIDEO) {
  VIDEO = VIDEO || {};
  const halamanList = [];
  const tulisHalaman = (slug, html, tanpaSitemap) => {
    const d = path.join(dirOut, slug);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, "index.html"), html);
    if (!tanpaSitemap) halamanList.push(BASE + slug + "/");
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
${(VIDEO[x.k + "|" + x.m] || []).length ? `<div class="kartu"><h2>📺 Video belajar ${esc(nm)} ${esc(lk)}</h2>${VIDEO[x.k + "|" + x.m].map((v) => `<p><a href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}" rel="noopener"><img loading="lazy" src="https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/mqdefault.jpg" alt="${esc(v.judul)}" width="320" height="180" style="width:100%;max-width:320px;height:auto;border-radius:12px;display:block"></a><b>${esc(v.judul)}</b><br><span class="kecil">${esc(v.channel)} • ${Math.round(v.durasi / 60)} menit</span></p>`).join("")}</div>` : ""}
<div class="kartu"><h2>✨ Kenapa latihan di sini?</h2><ul>
<li>Soal selalu berganti, jadi tidak bosan dan tidak hafal jawaban.</li>
<li>Langsung ada pembahasan setiap kali menjawab.</li>
${to ? `<li>Mode tryout dengan batas waktu untuk persiapan ujian.</li>` : ""}
<li>Rapor perkembangan dan piagam prestasi untuk anak.</li>
${x.g <= 2 ? "<li>Soal bisa dibacakan suara, cocok untuk anak yang belum lancar membaca.</li>" : ""}
<li>Guru bisa membuat link kuis untuk kelas, nilainya masuk ke WhatsApp guru.</li></ul></div>
${saudara ? `<div class="kartu"><h2>📖 Pelajaran lain ${esc(lk)}</h2>${saudara}</div>` : ""}
<div class="kartu"><h2>🏫 ${esc(nm)} kelas lain</h2>${kelasLain}</div>
<div class="kartu"><h2>🧠 Tes gratis lainnya</h2><a class="chip" href="${BASE}tes-iq-anak/">Tes Kecerdasan (ala IQ)</a><a class="chip" href="${BASE}tes-gaya-belajar/">Tes Gaya Belajar (ala STIFIn)</a><a class="chip" href="${BASE}tes-mbti/">Tes MBTI</a><a class="chip" href="${BASE}tes-disc/">Tes DISC</a><a class="chip" href="${BASE}tes-temperamen/">Tes Temperamen</a><a class="chip" href="${BASE}sekolah/">🏫 Untuk Sekolah</a><a class="chip" href="${BASE}tes-gaya-belajar-vak/">Gaya Belajar VAK</a><a class="chip" href="${BASE}tes-gaya-belajar-anak-tk/">Gaya Belajar Anak TK</a><a class="chip" href="${BASE}tes-gaya-belajar-dewasa/">4 Gaya Belajar Dewasa</a><a class="chip" href="${BASE}tes-kecerdasan-majemuk/">Kecerdasan Majemuk</a><a class="chip" href="${BASE}tes-daya-ingat/">Tes Daya Ingat</a><a class="chip" href="${BASE}tes-konsentrasi/">Tes Konsentrasi</a><a class="chip" href="${BASE}tes-spasial/">Tes Ruang (Spasial)</a></div>`;
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
    ["tes-kecerdasan-majemuk", "majemuk", "Tes Kecerdasan Majemuk Anak Online Gratis (8 Kecerdasan)", "Tes kecerdasan majemuk gratis: 40 pernyataan untuk menemukan kecerdasan anak yang paling menonjol dari 8 jenis (bahasa, logika, visual, musik, gerak, bergaul, intrapersonal, alam), lengkap dengan cara belajar dan cita-cita yang cocok.",
      "<p>Setiap anak cerdas dengan caranya sendiri. Lewat <b>40 pernyataan</b>, tes ini memetakan <b>8 kecerdasan</b>: bahasa, logika-matematika, gambar (visual-spasial), musik, gerak (kinestetik), bergaul (interpersonal), mengenal diri (intrapersonal), dan alam (naturalis).</p><p>Hasilnya 3 kecerdasan terkuat anak, cara belajar yang cocok, kegiatan atau ekstrakurikuler yang mendukung, contoh cita-cita, serta kartu untuk Status WA.</p><p class=\"kecil\">Catatan: berdasarkan teori Kecerdasan Majemuk Howard Gardner. Soal disusun sendiri, bukan tes psikologi resmi.</p>"],
    ["tes-daya-ingat", "ingat", "Tes Daya Ingat Anak Online Gratis", "Tes daya ingat gratis: ingat urutan angka, gambar, dan posisi kotak yang makin panjang. Hasilnya rentang ingatan anak dibandingkan dengan rata-rata seusianya, plus tips melatih ingatan.",
      "<p>Ada <b>3 permainan ingatan</b>: urutan angka, urutan gambar, dan posisi kotak yang menyala. Urutannya makin panjang sampai anak dua kali belum tepat. Hasilnya <b>rentang ingatan</b> anak, dibandingkan dengan rentang yang umum untuk tingkat SD, SMP, SMA, atau dewasa.</p><p class=\"kecil\">Catatan: ini latihan ingatan jangka pendek, bukan tes psikologi resmi.</p>"],
    ["tes-konsentrasi", "fokus", "Tes Konsentrasi Anak Online Gratis", "Tes konsentrasi gratis: cari dan tekan semua simbol target secepat mungkin dalam batas waktu. 3 babak dengan simbol yang mirip, hasil skor fokus, ketuntasan, dan ketelitian.",
      "<p>Dalam <b>3 babak</b>, anak mencari semua gambar yang sama dengan target secepat mungkin, misalnya huruf <b>b</b> di antara d, p, dan q. Salah tekan mengurangi nilai, jadi anak harus cepat sekaligus teliti.</p><p>Hasilnya skor konsentrasi 0–100, ketuntasan, ketelitian, dan tips melatih fokus.</p><p class=\"kecil\">Catatan: ini latihan perhatian dan ketelitian, bukan tes psikologi resmi.</p>"],
    ["tes-spasial", "ruang", "Tes Kemampuan Ruang (Spasial) Online Gratis", "Tes spasial gratis: 16 soal bergambar tentang memutar bentuk, bayangan cermin, memutar pola, dan jaring-jaring kubus. Ada tingkat SD, SMP, SMA, dan dewasa.",
      "<p>Kemampuan ruang (spasial) adalah kemampuan membayangkan bentuk yang diputar, dibalik, atau dilipat. Tes ini berisi <b>16 soal bergambar</b>: memutar bentuk, bayangan cermin, memutar pola, dan <b>jaring-jaring kubus</b>. Soal selalu berganti.</p><p class=\"kecil\">Catatan: ini latihan, bukan tes psikologi resmi.</p>"],
    ["tes-gaya-belajar-vak", "vak", "Tes Gaya Belajar VAK Online Gratis (Visual, Auditori, Kinestetik)", "Tes gaya belajar VAK gratis: 20 pertanyaan untuk mengetahui apakah anak lebih mudah belajar dengan melihat (visual), mendengar (auditori), atau bergerak (kinestetik), plus tips belajar di rumah dan di kelas.",
      "<p>Lewat <b>20 pertanyaan</b> tentang kebiasaan sehari-hari, tes ini menunjukkan gaya belajar anak: <b>Visual</b> (melihat), <b>Auditori</b> (mendengar), <b>Kinestetik</b> (bergerak), atau gabungannya. Hasilnya dilengkapi persentase, ciri-ciri, tips belajar di rumah, dan tips untuk guru di kelas.</p><p>Cocok untuk SD kelas 3 sampai dewasa. Untuk anak TK, pakai <a href=\"" + BASE + "tes-gaya-belajar-anak-tk/\">versi yang diisi orang tua</a>.</p><p class=\"kecil\">Catatan: soal disusun sendiri, bukan tes psikologi resmi.</p>"],
    ["tes-gaya-belajar-anak-tk", "vakOrtu", "Tes Gaya Belajar Anak TK & SD Kelas Bawah (Diisi Orang Tua)", "Kenali gaya belajar anak usia dini: 15 pertanyaan pengamatan yang diisi orang tua, hasil Visual, Auditori, atau Kinestetik beserta ide kegiatan belajar di rumah.",
      "<p>Anak TK dan SD kelas 1–2 belum bisa menilai dirinya sendiri, jadi tes ini <b>diisi oleh Ayah/Bunda</b> berdasarkan kebiasaan anak sehari-hari. Ada <b>15 pertanyaan</b>, misalnya cara anak menghafal doa, mainan favoritnya, dan caranya bereaksi saat senang.</p><p>Hasilnya gaya belajar <b>Visual, Auditori, atau Kinestetik</b> dengan ide kegiatan belajar di rumah.</p><p class=\"kecil\">Catatan: soal disusun sendiri, bukan tes psikologi resmi.</p>"],
    ["tes-gaya-belajar-dewasa", "gaya4", "Tes 4 Gaya Belajar Remaja & Dewasa: Aktivis, Reflektor, Teoris, Pragmatis", "Tes gaya belajar untuk SMP, SMA, mahasiswa, guru, dan karyawan: 20 kelompok pernyataan, hasil Aktivis, Reflektor, Teoris, atau Pragmatis, lengkap dengan cara belajar yang cocok.",
      "<p>Pilih pernyataan yang paling menggambarkan dirimu di <b>20 kelompok</b>. Hasilnya satu dari 4 gaya belajar: <b>Aktivis</b> (belajar dengan mencoba), <b>Reflektor</b> (mengamati), <b>Teoris</b> (memahami konsep), atau <b>Pragmatis</b> (menerapkan), beserta kekuatan, tantangan, dan cara belajar yang cocok.</p><p class=\"kecil\">Catatan: soal disusun sendiri, terinspirasi model Honey & Mumford. Bukan tes resmi.</p>"],
    ["tes-gaya-belajar", "mesin", "Tes Gaya Belajar Anak (ala STIFIn) Online Gratis", "Kenali gaya belajar anak: Sensing, Thinking, Intuiting, Feeling, atau Insting. 30 pertanyaan, hasil langsung dengan tips cara belajar yang cocok.",
      "<p>Lewat <b>30 pertanyaan</b> sederhana, kenali kecenderungan gaya belajar anak: <b>Si Pengingat (Sensing), Si Pemikir (Thinking), Si Kreatif (Intuiting), Si Perasa (Feeling), atau Si Serba Bisa (Insting)</b>. Hasilnya dilengkapi ciri-ciri dan cara belajar yang cocok.</p><p class=\"kecil\">Catatan: terinspirasi konsep STIFIn. Tes STIFIn resmi memakai pemindaian sidik jari oleh lembaga resminya.</p>"],
    ["tes-kepribadian", "kepribadian", "Tes Kepribadian Online Gratis: MBTI, DISC, dan Temperamen", "Tiga tes kepribadian gratis: MBTI (16 tipe, 40 pernyataan), DISC (24 kelompok), dan Temperamen (32 kelompok). Soal disusun sendiri, hasil lengkap dengan kartu Status WA.",
      "<p>Pilih tes yang ingin kamu coba. Masing-masing berdiri sendiri dan soalnya cukup banyak supaya hasilnya lebih stabil:</p><ul><li><a href=\"" + BASE + "tes-mbti/\"><b>Tes MBTI</b></a>: 40 pernyataan, hasil 16 tipe dengan persentase setiap kecenderungan.</li><li><a href=\"" + BASE + "tes-disc/\"><b>Tes DISC</b></a>: 24 kelompok pilihan, gaya utama dan pendukung (D, I, S, C).</li><li><a href=\"" + BASE + "tes-temperamen/\"><b>Tes Temperamen</b></a>: 32 kelompok, Koleris, Sanguinis, Melankolis, atau Plegmatis beserta campurannya.</li></ul><p class=\"kecil\">Catatan: soal disusun sendiri untuk refleksi diri, bukan tes psikologi resmi.</p>"],
    ["tes-mbti", "mbti", "Tes MBTI Online Gratis (16 Tipe Kepribadian)", "Tes MBTI gratis dalam bahasa Indonesia: 40 pernyataan dengan skala setuju, hasil 16 tipe kepribadian lengkap dengan persentase E/I, S/N, T/F, J/P, cara belajar, dan pekerjaan yang cocok.",
      "<p>Jawab <b>40 pernyataan</b> dengan pilihan Sangat setuju sampai Sangat tidak setuju. Hasilnya satu dari <b>16 tipe kepribadian</b> (misalnya INFJ, ENTP, ISTJ) beserta <b>persentase</b> setiap kecenderungan: Ekstrover/Introver, Sensing/Intuition, Thinking/Feeling, Judging/Perceiving.</p><p>Pernyataan disusun seimbang ke dua arah, sehingga kebiasaan menjawab \"setuju\" terus tidak membuat hasil berat sebelah.</p><p class=\"kecil\">Catatan: terinspirasi teori tipe kepribadian MBTI. Soal disusun sendiri dan bukan tes MBTI resmi berlisensi.</p>"],
    ["tes-disc", "disc", "Tes DISC Online Gratis (Gaya Perilaku)", "Tes DISC gratis: 24 kelompok pilihan untuk mengetahui gaya perilaku Dominance, Influence, Steadiness, atau Conscientiousness, lengkap dengan motivasi, cara belajar, dan cara berkomunikasi.",
      "<p>Pilih satu dari 4 pilihan yang paling menggambarkan dirimu di <b>24 kelompok</b>. Hasilnya gaya utama dan pendukung: <b>D (Dominance)</b>, <b>I (Influence)</b>, <b>S (Steadiness)</b>, atau <b>C (Conscientiousness)</b>, lengkap dengan hal yang membuatmu bersemangat, perilaku saat tertekan, dan cara terbaik berkomunikasi denganmu.</p><p class=\"kecil\">Catatan: soal disusun sendiri untuk refleksi diri, bukan tes DISC resmi.</p>"],
    ["tes-temperamen", "temperamen", "Tes Temperamen Online Gratis (Koleris, Sanguinis, Melankolis, Plegmatis)", "Tes temperamen gratis: 32 kelompok sifat (kelebihan dan kelemahan) untuk mengetahui temperamen Koleris, Sanguinis, Melankolis, atau Plegmatis beserta campurannya.",
      "<p>Pilih sifat yang paling menggambarkan dirimu di <b>32 kelompok</b>: 16 kelompok kelebihan dan 16 kelompok kelemahan. Hasilnya temperamen utama (<b>Koleris, Sanguinis, Melankolis, atau Plegmatis</b>), campurannya, kelebihan, hal yang perlu dijaga, dan kegiatan yang cocok.</p><p class=\"kecil\">Catatan: soal disusun sendiri untuk refleksi diri, bukan tes psikologi resmi.</p>"]
  ];
  TES.forEach(([slug, id, judul, desk, isi]) => tulisHalaman(slug, halaman({ judul: judul + " | HadirFlow", deskripsi: desk, url: BASE + slug + "/", h1: judul, og: BASE + "og/" + slugOG(id) + ".png",
    isi: isi + `<p><a class="tombol" href="${BASE}?tes=${id}">🚀 Mulai Tes Sekarang</a></p>
<div class="kartu"><h2>📚 Kuis pelajaran gratis TK–SMA</h2>${["tka", "1", "3", "5", "7", "9", "10", "12"].map((k) => { const x = semua.find((y) => y.k === k && (y.m === "mtk" || y.m === "angka")); return `<a class="chip" href="${BASE}${slugKuis(x)}/">${MAPEL[x.m][0]} ${labelKelas(x)}</a>`; }).join("")}</div>` })));

  // Halaman untuk sekolah: bisa dikirim ke kepala sekolah/yayasan
  const HF_SEKOLAH = HADIRFLOW.replace("utm_medium=seo", "utm_medium=sekolah");
  const ajakGuru = encodeURIComponent("Assalamu'alaikum Bapak/Ibu, ini alat gratis untuk mengenali gaya belajar dan kecerdasan murid satu kelas. Hasil murid langsung masuk ke WhatsApp guru, lalu ada rekap kelas dan saran mengajarnya. Tanpa daftar.\n\n👉 " + BASE + "sekolah/");
  tulisHalaman("sekolah", halaman({ judul: "Tes Gaya Belajar & Kuis Gratis untuk Sekolah | HadirFlow", url: BASE + "sekolah/",
    deskripsi: "Alat gratis untuk guru dan sekolah: bagikan tes gaya belajar, kecerdasan, atau kuis pelajaran ke satu kelas, hasil murid masuk ke WhatsApp guru, lalu rekap kelas dan saran mengajar keluar otomatis.",
    h1: "Kenali Gaya Belajar Setiap Murid, Gratis untuk Sekolah",
    isi: `<p>Satu link untuk satu kelas. Murid mengerjakan tes atau kuis di HP masing-masing, hasilnya langsung masuk ke <b>WhatsApp guru</b>, lalu guru mendapat <b>rekap kelas</b> lengkap dengan saran mengajar. Tanpa daftar, tanpa aplikasi tambahan, tanpa biaya.</p>
<p><a class="tombol" href="${BASE}?tab=guru">🔗 Buat Link untuk Kelas</a><a class="tombol kedua" href="https://wa.me/?text=${ajakGuru}">💬 Bagikan ke rekan guru</a></p>
<div class="kartu"><h2>✨ Yang didapat sekolah</h2><div class="grid-manfaat">
<div><b>👁️ Peta gaya belajar kelas</b>Berapa murid Visual, Auditori, dan Kinestetik, beserta cara mengajar yang paling cocok.</div>
<div><b>🧠 Profil kecerdasan</b>Kecerdasan majemuk, daya ingat, konsentrasi, dan kemampuan ruang setiap murid.</div>
<div><b>📚 Kuis pelajaran TK–SMA</b>Soal selalu baru, nilai langsung ke WA guru, rekap bisa diunduh untuk Excel.</div>
<div><b>🏅 Piagam & laporan anak</b>Murid mendapat piagam, orang tua mendapat Profil Lengkap Anak yang bisa dicetak.</div></div></div>
<div class="kartu"><h2>🚀 Cara pakai dalam 3 langkah</h2><ol class="langkah">
<li><b>Buat link.</b> Buka tab <a href="${BASE}?tab=guru">Guru</a>, isi nama dan nomor WhatsApp, pilih <i>Tes kenali diri</i> (misalnya Gaya Belajar VAK) atau <i>Kuis pelajaran</i>.</li>
<li><b>Kirim ke grup kelas.</b> Murid membuka link, menulis nama, mengerjakan, lalu menekan <b>Kirim hasil ke guru</b>.</li>
<li><b>Buat rekap.</b> Salin pesan-pesan hasil dari WhatsApp, tempel di kotak Rekap. Sebaran kelas dan saran mengajar langsung tampil, siap dicetak.</li></ol></div>
<div class="kartu"><h2>📊 Contoh rekap: Gaya Belajar VAK kelas 5A (32 murid)</h2>
<div class="batang"><span>👁️ Visual</span><div class="jalur"><span style="width:44%"></span></div><b>14</b></div>
<div class="batang"><span>✋ Kinestetik</span><div class="jalur"><span style="width:34%"></span></div><b>11</b></div>
<div class="batang"><span>👂 Auditori</span><div class="jalur"><span style="width:22%"></span></div><b>7</b></div>
<p><b>💡 Saran mengajar:</b> paling banyak murid Visual. Tuliskan poin penting dan langkah di papan, gunakan gambar, diagram, dan warna. Tetap selingi praktik dan diskusi supaya murid Kinestetik dan Auditori ikut terlayani.</p>
<p class="kecil">Contoh tampilan. Angka di rekap Anda mengikuti hasil murid yang sebenarnya.</p></div>
<div class="kartu"><h2>🧩 Tes yang bisa dibagikan ke satu kelas</h2>
<a class="chip" href="${BASE}tes-gaya-belajar-vak/">👁️ Gaya Belajar VAK</a><a class="chip" href="${BASE}tes-gaya-belajar-anak-tk/">👨‍👩‍👧 Gaya Belajar Si Kecil (TK)</a><a class="chip" href="${BASE}tes-gaya-belajar/">🧬 Gaya Belajar ala STIFIn</a><a class="chip" href="${BASE}tes-gaya-belajar-dewasa/">🔄 4 Gaya Belajar (SMP–SMA)</a><a class="chip" href="${BASE}tes-kecerdasan-majemuk/">🌈 Kecerdasan Majemuk</a><a class="chip" href="${BASE}tes-iq-anak/">🧠 Tes Kecerdasan</a><a class="chip" href="${BASE}tes-daya-ingat/">💭 Daya Ingat</a><a class="chip" href="${BASE}tes-konsentrasi/">🎯 Konsentrasi</a><a class="chip" href="${BASE}tes-spasial/">🧊 Ruang (Spasial)</a><a class="chip" href="${BASE}tes-mbti/">🧩 MBTI</a><a class="chip" href="${BASE}tes-disc/">🎯 DISC</a><a class="chip" href="${BASE}tes-temperamen/">🌡️ Temperamen</a></div>
<div class="kartu hf"><img src="${BASE}logo-hadirflow.png" alt="HadirFlow" width="41" height="48" style="float:right;height:48px;width:auto;background:#fff;border-radius:12px;padding:4px 6px;margin:0 0 8px 10px">
<h2>🏫 Sudah rapi untuk murid, bagaimana dengan absensi guru?</h2>
<p><b>HadirFlow</b> membantu sekolah, madrasah, dan pesantren mengurus kehadiran dan penggajian:</p>
<ul><li>📸 Absensi wajah guru dan karyawan, anti titip absen</li><li>📍 Absen dari HP dengan GPS dan radius lokasi sekolah</li><li>📝 Izin, cuti, dan lembur diajukan langsung dari HP</li><li>💰 Gaji dihitung otomatis dari kehadiran, slip gaji bisa dikirim ke WhatsApp</li><li>📊 Laporan rekap gaji siap pakai untuk yayasan</li></ul>
<p><a class="tombol" style="background:#ffd23f;color:#072B6B;box-shadow:0 5px 0 #c9a200" href="${HF_SEKOLAH}">🚀 Lihat HadirFlow untuk Sekolah</a></p></div>
<div class="kartu"><h2>❓ Pertanyaan yang sering diajukan</h2>
<details><summary>Apakah benar-benar gratis?</summary><p>Ya. Tes, kuis, link kelas, rekap, piagam, dan profil anak gratis tanpa batas dan tanpa daftar.</p></details>
<details><summary>Di mana data murid disimpan?</summary><p>Hasil tersimpan di HP masing-masing murid. Hasil hanya terkirim ke guru ketika murid menekan tombol kirim di WhatsApp. Tidak ada data murid yang disimpan di server kami.</p></details>
<details><summary>Apakah ini tes psikologi resmi?</summary><p>Bukan. Tes disusun untuk mengenal kecenderungan belajar dan minat murid, sebagai bahan pertimbangan guru. Untuk asesmen resmi, hubungi psikolog.</p></details>
<details><summary>Bisa dipakai untuk TK?</summary><p>Bisa. Pakai <a href="${BASE}tes-gaya-belajar-anak-tk/">Gaya Belajar Si Kecil</a> yang diisi orang tua, dan kuis pelajaran TK A/TK B yang soalnya bisa dibacakan otomatis.</p></details></div>` }));

  // Halaman tantangan /t/<slug>/: pratinjau WhatsApp khusus per tes, lalu langsung diteruskan ke aplikasi (query ikut)
  const TANTANG = [["otak", "Tes Kecerdasan (ala IQ)", "Berani adu skor?"], ["majemuk", "Kecerdasan Majemuk", "Kecerdasanmu yang mana?"], ["ingat", "Tes Daya Ingat", "Bisa ingat berapa urutan?"],
    ["fokus", "Tes Konsentrasi", "Seberapa tajam fokusmu?"], ["ruang", "Tes Ruang (Spasial)", "Bisa memutar bentuk di kepala?"], ["vak", "Tes Gaya Belajar VAK", "Visual, Auditori, atau Kinestetik?"],
    ["vak-ortu", "Gaya Belajar Si Kecil", "Anakmu tipe belajar yang mana?"], ["mesin", "Tes Gaya Belajar ala STIFIn", "Mesin kecerdasanmu apa?"], ["gaya4", "4 Gaya Belajar", "Aktivis, Reflektor, Teoris, atau Pragmatis?"],
    ["mbti", "Tes MBTI 16 Tipe", "Kamu tipe apa?"], ["disc", "Tes DISC", "D, I, S, atau C?"], ["temperamen", "Tes Temperamen", "Koleris, Sanguinis, Melankolis, atau Plegmatis?"],
    ["kekuatan", "Tes Kelebihanku", "Apa kelebihan terbesarmu?"], ["darah", "Golongan Darahku", "Golonganmu apa?"], ["kuis", "Kuis Pelajaran", "Bisa kalahkan nilaiku?"], ["harian", "Tantangan Harian", "Berapa hari kamu kuat berturut-turut?"]];
  TANTANG.forEach(([slug, nm, ajak]) => {
    const d = path.join(dirOut, "t", slug); fs.mkdirSync(d, { recursive: true });
    const judul = `🎯 Kamu ditantang: ${nm}! ${ajak}`, desk = "Gratis, tanpa daftar, langsung ada hasilnya. Kerjakan, lalu bandingkan hasilmu dengan temanmu. Dari HadirFlow.";
    fs.writeFileSync(path.join(d, "index.html"), `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(judul)}</title><meta name="description" content="${esc(desk)}"><meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:site_name" content="HadirFlow"><meta property="og:url" content="${BASE}t/${slug}/">
<meta property="og:title" content="${esc(judul)}"><meta property="og:description" content="${esc(desk)}">
<meta property="og:image" content="${BASE}og/${slug}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="1;url=${BASE}"><script>location.replace(${JSON.stringify(BASE)} + location.search + location.hash);</script>
</head><body style="font-family:sans-serif;text-align:center;padding:40px"><p>Membuka tantangan… <a href="${BASE}">Klik di sini kalau tidak terbuka</a>.</p></body></html>
`);
  });

  // Kit Promosi: gambar & pesan siap sebar (tidak diindeks Google)
  const GAMBAR_PROMO = [["semua-tes-status", "Semua tes (Status)"], ["gaya-belajar-status", "Gaya belajar (Status)"], ["guru-status", "Untuk guru (Status)"],
    ["kecerdasan-postingan", "Kecerdasan (Postingan)"], ["kepribadian-postingan", "Kepribadian (Postingan)"], ["tantangan-harian-postingan", "Tantangan Harian (Postingan)"]];
  const PESAN_PROMO = [
    ["👨‍👩‍👧 Grup wali murid", "Assalamu'alaikum Ayah/Bunda 🙏\nAda tes gratis untuk mengenal anak kita: gaya belajar (Visual, Auditori, Kinestetik), kecerdasan, sampai kepribadian. Hasilnya langsung keluar, ada piagamnya, tanpa daftar.\nAnak TK juga bisa (versi yang diisi orang tua). Silakan dicoba 👇\n" + BASE],
    ["👩‍🏫 Grup guru", "Assalamu'alaikum Bapak/Ibu Guru 🙏\nMau tahu gaya belajar murid satu kelas? Ada alat gratis: guru membuat 1 link, murid mengerjakan di HP, hasilnya langsung masuk ke WhatsApp guru, lalu keluar rekap kelas dan saran mengajarnya. Piagam murid bisa memakai nama sekolah.\nPanduannya di sini 👇\n" + BASE + "sekolah/"],
    ["🏫 Kepala sekolah / yayasan", "Assalamu'alaikum Bapak/Ibu Kepala Sekolah 🙏\nKami dari HadirFlow menyediakan alat gratis untuk guru: tes gaya belajar, kecerdasan, dan kuis pelajaran untuk satu kelas, dengan rekap otomatis dan piagam bernama sekolah.\nSelain itu, HadirFlow juga membantu absensi guru dan karyawan (wajah + GPS) dan menghitung gaji secara otomatis.\nPanduan untuk sekolah 👇\n" + BASE + "sekolah/"],
    ["😄 Keluarga & teman", "Iseng coba deh 😄 Tes MBTI, IQ, gaya belajar, sampai golongan darah, gratis dan langsung ada hasilnya. Aku dapat ___, kamu apa? 👇\n" + BASE],
    ["📱 Teks Status WA (pendek)", "Anakmu Visual, Auditori, atau Kinestetik? 🤔 Cek gratis 5 menit 👉 hadirflow.my.id/kuistes"]
  ];
  const CAPTION_PROMO = [
    ["Instagram / Facebook", "Setiap anak punya cara belajar yang berbeda 🌈\nAda yang cepat paham lewat gambar, ada yang lewat mendengar, ada juga yang harus bergerak dulu.\n\nCari tahu gaya belajar si kecil GRATIS (5 menit, langsung ada hasil + tips belajar di rumah) 👉 link di bio\n\n#gayabelajar #parenting #parentingislami #tesgratis #anakpintar #belajardirumah #HadirFlow"],
    ["TikTok / Reels", "Ternyata anakku Kinestetik 😅 pantas nggak bisa diam! Kalau anakmu? Tes gratis, link di bio 👆 #gayabelajar #parenting #tesiq #fyp #ibuibu #HadirFlow"],
    ["Untuk guru (IG/FB)", "Bapak/Ibu Guru, ini cara cepat mengenal gaya belajar satu kelas 👩‍🏫\n1️⃣ Buat link di tab Guru\n2️⃣ Kirim ke grup kelas\n3️⃣ Hasil murid masuk WhatsApp + rekap kelas & saran mengajar\nGratis, tanpa daftar 👉 hadirflow.my.id/kuistes/sekolah\n\n#guruindonesia #gurukreatif #merdekabelajar #gayabelajar #HadirFlow"]
  ];
  const kotakSalin = ([judul, teks], i) => `<div class="kartu"><h2>${judul}</h2><textarea id="t${i}" readonly rows="6" style="width:100%;font:inherit;font-size:16px;border:2px solid var(--garis);border-radius:12px;padding:10px">${esc(teks)}</textarea>
<p><button class="tombol" type="button" data-salin="t${i}" style="border:0;cursor:pointer">📋 Salin</button><a class="tombol kedua" href="https://wa.me/?text=${encodeURIComponent(teks)}">💬 Kirim ke WhatsApp</a></p></div>`;
  tulisHalaman("promosi", halaman({ judul: "Kit Promosi Tes Gratis HadirFlow", url: BASE + "promosi/", noindex: true,
    deskripsi: "Gambar, pesan WhatsApp, dan caption siap sebar untuk mengenalkan Tes Gratis HadirFlow.",
    h1: "📣 Kit Promosi Tes Gratis HadirFlow",
    isi: `<p>Semua bahan di halaman ini siap dipakai: <b>unduh gambar</b>, <b>salin pesan</b>, lalu sebarkan. Bola saljunya berputar sendiri setelah itu, karena setiap orang yang selesai tes mendapat kartu hasil dan link tantangan untuk dibagikan lagi.</p>
<div class="kartu"><h2>🚀 Cara paling cepat menyalakan bola salju</h2><ol class="langkah">
<li><b>Kerjakan satu tes sendiri</b> (misalnya MBTI), lalu bagikan kartu hasilmu ke Status WA. Link di kartumu adalah link tantangan, jadi teman yang membuka langsung bisa membandingkan hasil.</li>
<li><b>Kirim pesan</b> ke 5–10 grup wali murid dan grup guru yang Anda kenal (template di bawah).</li>
<li><b>Pasang gambar promosi</b> di Status WA dan media sosial selama 14 hari (jadwal di bawah).</li></ol></div>
<h2 style="margin-top:28px">🖼️ Gambar promosi</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">${GAMBAR_PROMO.map(([id, nm]) => `<div class="kartu" style="margin:0;padding:12px;text-align:center"><img src="${BASE}promosi/${id}.png" alt="${esc(nm)}" loading="lazy" style="width:100%;border-radius:12px"><p style="margin:8px 0 6px;font-weight:800">${esc(nm)}</p><a class="tombol" style="font-size:16px;padding:8px 16px" href="${BASE}promosi/${id}.png" download="${id}.png">💾 Unduh</a></div>`).join("")}</div>
<p class="kecil">Status = ukuran tegak untuk Status WA, IG Story, TikTok. Postingan = ukuran kotak untuk feed Instagram dan Facebook.</p>
<h2 style="margin-top:28px">💬 Pesan WhatsApp siap kirim</h2>
${PESAN_PROMO.map(kotakSalin).join("")}
<h2 style="margin-top:28px">✍️ Caption media sosial</h2>
${CAPTION_PROMO.map((x, i) => kotakSalin(x, i + 20)).join("")}
<div class="kartu"><h2>🎬 Ide video pendek (TikTok / Reels, 15–30 detik)</h2><ol>
<li><b>"Ternyata anakku tipe…"</b>: rekam layar saat anak mengerjakan Tes Gaya Belajar, tampilkan hasilnya. Teks: <i>"Pantas nggak bisa diam, ternyata Kinestetik 😅"</i>.</li>
<li><b>Duel skor keluarga</b>: ayah vs ibu vs kakak mengerjakan Tes Kecerdasan, tunjukkan kotak "Kamu vs …" di akhir.</li>
<li><b>Guru: 1 link, 1 kelas</b>: rekam layar membuat link di tab Guru, lalu tampilkan rekap sebaran gaya belajar kelas.</li>
<li><b>Tantangan Harian 🔥</b>: anak menunjukkan hitungan hari beruntun dan lencananya setiap pekan.</li></ol></div>
<div class="kartu"><h2>🗓️ Jadwal 14 hari</h2><table style="width:100%;border-collapse:collapse;font-size:16px">
${[["1", "Kerjakan tes MBTI, bagikan kartu hasil ke Status WA", "Status WA"], ["2", "Gambar \"Semua tes\" + pesan grup wali murid", "Status + 3 grup"], ["3", "Gambar \"Gaya belajar\" + caption IG/FB", "IG, FB"], ["4", "Pesan ke grup guru + gambar \"Untuk guru\"", "2–3 grup guru"], ["5", "Video \"Ternyata anakku tipe…\"", "TikTok, Reels"], ["6", "Gambar \"Kecerdasan\" (adu skor)", "Status, IG"], ["7", "Bagikan Profil Lengkap anak", "Status WA"], ["8", "Gambar \"Kepribadian\" + pesan keluarga", "Status + grup keluarga"], ["9", "Pesan ke 3 kepala sekolah / yayasan", "WA pribadi"], ["10", "Video duel skor keluarga", "TikTok, Reels"], ["11", "Gambar \"Tantangan Harian\"", "Status, IG"], ["12", "Bagikan lencana Tantangan Harian", "Status WA"], ["13", "Video \"Guru: 1 link, 1 kelas\"", "TikTok, FB"], ["14", "Ulangi gambar terbaik + ucapan terima kasih", "Status, IG"]].map(([h, apa, di]) => `<tr><td style="border-top:1px solid var(--garis);padding:6px 4px;font-weight:800">Hari ${h}</td><td style="border-top:1px solid var(--garis);padding:6px 4px">${apa}</td><td style="border-top:1px solid var(--garis);padding:6px 4px;color:var(--muted)">${di}</td></tr>`).join("")}</table></div>
<script>document.querySelectorAll("[data-salin]").forEach(function (b) { b.addEventListener("click", function () { var t = document.getElementById(b.getAttribute("data-salin")); t.select(); var cadangan = function () { try { document.execCommand("copy"); } catch (e) {} }; try { navigator.clipboard.writeText(t.value).catch(cadangan); } catch (e) { cadangan(); } b.textContent = "✅ Tersalin"; setTimeout(function () { b.textContent = "📋 Salin"; }, 1800); }); });</script>` }), true);

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
    start_url: "/kuistes/?sumber=aplikasi", scope: "/kuistes/", display: "standalone", background_color: "#f3f6fb", theme_color: "#072B6B", lang: "id",
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
