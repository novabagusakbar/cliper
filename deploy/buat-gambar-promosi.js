// Membuat gambar Kit Promosi dari src/promosi/promosi.html menjadi kuistes/promosi/*.png
// Jalankan sekali setiap desain berubah: node deploy/buat-gambar-promosi.js
// (butuh Playwright + Chromium; di belakang proxy, set HTTPS_PROXY supaya huruf Google Fonts termuat)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const akar = path.join(__dirname, "..");
  const keluar = path.join(akar, "kuistes", "promosi");
  fs.mkdirSync(keluar, { recursive: true });
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
  const p = await (await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1200, height: 2000 } })).newPage();
  await p.goto("file://" + path.join(akar, "src", "promosi", "promosi.html"));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  const ids = await p.$$eval(".g", (e) => e.map((x) => x.id));
  for (const id of ids) {
    await (await p.$("#" + id)).screenshot({ path: path.join(keluar, id + ".png") });
    console.log("✓", id + ".png");
  }
  await b.close();
})();
