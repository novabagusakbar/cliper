// Mencari video belajar YouTube untuk setiap kelas × pelajaran, lalu menyimpannya di src/video.json.
// Dijalankan SEKALI oleh pengembang (bukan oleh pengunjung), memakai YouTube Data API v3.
// Kunci API dikirim proxy lingkungan sebagai header X-Goog-Api-Key (atau isi env YT_KEY).
// Kuota: ±101 unit per kombinasi (search 100 + videos 1); 78 kombinasi ≈ 7.900 dari 10.000 unit/hari.
// Aman dijalankan ulang: kombinasi yang sudah ada dilewati (pakai --ulang untuk memaksa).
const fs = require("fs");
const https = require("https");

const BERKAS = "src/video.json";
const ULANG = process.argv.includes("--ulang");
const KUNCI = process.env.YT_KEY || "";
const data = fs.existsSync(BERKAS) ? JSON.parse(fs.readFileSync(BERKAS, "utf8")) : {};

const MAPEL = { huruf: "mengenal huruf", angka: "mengenal angka berhitung", warna: "mengenal warna dan bentuk", mtk: "matematika", bind: "bahasa indonesia", bing: "bahasa inggris",
  ipas: "IPAS", ipa: "IPA", fisika: "fisika", kimia: "kimia", biologi: "biologi", pai: "pendidikan agama islam", fiqih: "fiqih", arab: "bahasa arab" };
const KELAS = [["tka", -1], ["tkb", 0]].concat(Array.from({ length: 12 }, (_, i) => [String(i + 1), i + 1]));
const mapelKelas = (g) => (g <= 0 ? ["huruf", "angka", "warna"] : g <= 6 ? ["mtk", "bind", "bing", "ipas", "pai", "fiqih", "arab"] : g <= 9 ? ["mtk", "bind", "bing", "ipa"] : ["mtk", "bind", "bing", "fisika", "kimia", "biologi"]);
const kataKunci = (m, k, g) => g <= 0 ? `belajar ${MAPEL[m]} anak TK` : `materi ${MAPEL[m]} kelas ${k} ${g <= 6 ? (["pai", "fiqih", "arab"].includes(m) ? "MI" : "SD") : g <= 9 ? "SMP" : "SMA"}`;

function ambil(url) {
  return new Promise((ok, gagal) => {
    https.get(url, { headers: KUNCI ? { "X-Goog-Api-Key": KUNCI } : {} }, (r) => {
      let b = ""; r.on("data", (c) => (b += c)); r.on("end", () => {
        let j; try { j = JSON.parse(b); } catch (e) { return gagal(new Error("Balasan bukan JSON: " + b.slice(0, 200))); }
        if (j.error) return gagal(new Error(j.error.code + " " + j.error.message));
        ok(j);
      });
    }).on("error", gagal);
  });
}
const detik = (iso) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "") || []; return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0); };

(async () => {
  let baru = 0;
  for (const [k, g] of KELAS) for (const m of mapelKelas(g)) {
    const key = k + "|" + m;
    if (data[key] && !ULANG) continue;
    const q = kataKunci(m, k, g);
    try {
      const s = await ambil("https://www.googleapis.com/youtube/v3/search?" + new URLSearchParams({ part: "snippet", type: "video", maxResults: "10", q,
        relevanceLanguage: "id", regionCode: "ID", safeSearch: "strict", videoEmbeddable: "true" }));
      const ids = s.items.map((x) => x.id.videoId).filter(Boolean);
      if (!ids.length) { data[key] = []; continue; }
      const v = await ambil("https://www.googleapis.com/youtube/v3/videos?" + new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(",") }));
      const pilih = v.items
        .filter((x) => x.status.embeddable && x.status.privacyStatus === "public")
        .map((x) => ({ id: x.id, judul: x.snippet.title, channel: x.snippet.channelTitle, durasi: detik(x.contentDetails.duration), tonton: +(x.statistics.viewCount || 0) }))
        .filter((x) => x.durasi >= 120 && x.durasi <= 40 * 60)
        .sort((a, b) => b.tonton - a.tonton).slice(0, 3)
        .map(({ id, judul, channel, durasi }) => ({ id, judul, channel, durasi }));
      data[key] = pilih; baru++;
      console.log(`✅ ${key.padEnd(10)} "${q}" → ${pilih.map((x) => x.judul.slice(0, 40)).join(" | ")}`);
      fs.writeFileSync(BERKAS, JSON.stringify(data, null, 1));
    } catch (e) {
      console.log(`❌ ${key}: ${e.message}`);
      if (/quota/i.test(e.message)) { console.log("Kuota harian habis. Jalankan lagi besok; yang sudah ada tidak diulang."); break; }
      if (/40[13]/.test(e.message)) break;
    }
  }
  fs.writeFileSync(BERKAS, JSON.stringify(data, null, 1));
  console.log(`Selesai: ${baru} kombinasi baru, total ${Object.keys(data).length} di ${BERKAS}`);
})();
