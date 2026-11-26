// Membuat file kuis dari src/kuis-kelas3-mi.src.html:
//  - kuis-kelas3-mi.html : satu file, siap tempel di Google Sites
//  - kuistes/            : folder untuk https://hadirflow.my.id/kuistes/ (halaman utama, halaman SEO, aplikasi/PWA, daftar file)
// Skrip diubah ke JavaScript lama (ES5) supaya jalan di iPad/HP lama (iOS 9+, Android 5+).
// Pakai: npm install && npm run build
const fs = require("fs");
const crypto = require("crypto");
const babel = require("@babel/core");
const { buatSEO, buatPWA, buatDaftar } = require("./build-seo");

fs.mkdirSync("kuistes", { recursive: true });
const VIDEO = fs.existsSync("src/video.json") ? JSON.parse(fs.readFileSync("src/video.json", "utf8")) : {};
const seo = buatSEO("kuistes", VIDEO);
const src = fs.readFileSync("src/kuis-kelas3-mi.src.html", "utf8").replace("<!--TAUTAN_SEO-->", seo.tautanUtama)
  .replace("/*VIDEO_DATA*/{}", JSON.stringify(VIDEO).replace(/</g, "\\u003c"));
const out = src.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => {
  const hasil = babel.transformSync(js, {
    babelrc: false, configFile: false, compact: false, comments: true, sourceType: "script",
    presets: [["@babel/preset-env", { targets: "ios >= 9, safari >= 9, chrome >= 40, android >= 5", modules: false }]]
  }).code;
  return "<script>\n" + hasil + "\n</script>";
});
fs.writeFileSync("kuis-kelas3-mi.html", out);
fs.writeFileSync("kuistes/index.html", out);
buatPWA("kuistes", crypto.createHash("sha256").update(out).digest("hex").slice(0, 10));
const n = buatDaftar("kuistes");
console.log(`Selesai: kuis-kelas3-mi.html (${out.length} karakter), ${seo.jumlah} halaman SEO, ${n} file di kuistes/`);
