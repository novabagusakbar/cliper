// Membuat kuis-kelas3-mi.html (siap tempel di Google Sites) dari src/kuis-kelas3-mi.src.html.
// Skrip diubah ke JavaScript lama (ES5) supaya jalan di iPad/HP lama (iOS 9+, Android 5+).
// Pakai: npm install && npm run build
const fs = require("fs");
const babel = require("@babel/core");
const src = fs.readFileSync("src/kuis-kelas3-mi.src.html", "utf8");
const out = src.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => {
  const hasil = babel.transformSync(js, {
    babelrc: false, configFile: false, compact: false, comments: true, sourceType: "script",
    presets: [["@babel/preset-env", { targets: "ios >= 9, safari >= 9, chrome >= 40, android >= 5", modules: false }]]
  }).code;
  return "<script>\n" + hasil + "\n</script>";
});
fs.writeFileSync("kuis-kelas3-mi.html", out);
console.log("Selesai: kuis-kelas3-mi.html (" + out.length + " karakter)");
