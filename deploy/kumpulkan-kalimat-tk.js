// Mengumpulkan semua kalimat yang dibacakan di kuis TK (soal + pilihan) dari aplikasi hasil build -> src/kalimat-tk.json
// Jalankan: node deploy/kumpulkan-kalimat-tk.js   (butuh Playwright)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const akar = path.join(__dirname, "..");
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto("file://" + path.join(akar, "kuis-kelas3-mi.html"));
  const kalimat = await p.evaluate(() => {
    const kal = new Set();
    ["tka", "tkb"].forEach((k) => mapelKelas(k).forEach((m) => {
      kelasAktif = k; jenjangAktif = KELAS_INFO[k].jenjang;
      for (let n = 0; n < 2000; n++) {
        nama = "x" + Math.random(); jumlahSoalAktif = 10; modeAktif = "latihan";
        pilihSoalBaru(m).terpilih.forEach((s) => { kal.add(teksUcapan(s.t)); s.o.forEach((o) => kal.add(teksUcapan(o))); });
      }
    }));
    return [...kal].filter((x) => x.trim()).sort();
  });
  fs.writeFileSync(path.join(akar, "src", "kalimat-tk.json"), JSON.stringify(kalimat, null, 0));
  console.log(kalimat.length, "kalimat");
  await b.close();
})();
