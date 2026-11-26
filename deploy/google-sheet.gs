/**
 * Penerima data Kuis Pintar Kelas 3 MI -> Google Sheet.
 * Cara pakai: buka Google Sheet, Ekstensi -> Apps Script, hapus isi Code.gs,
 * tempel seluruh file ini, simpan, lalu Terapkan (Deploy) -> Deployment baru -> Aplikasi web
 * (Jalankan sebagai: Saya; Yang memiliki akses: Siapa saja). Salin URL /exec-nya.
 */
const KOLOM = ['Waktu', 'Nama Orang Tua', 'WhatsApp', 'Link Chat WA', 'Nama Anak', 'Tes', 'Hasil', 'Perangkat', 'Sumber'];

function doGet(e) { return simpan_(e); }
function doPost(e) { return simpan_(e); }

function simpan_(e) {
  const p = (e && e.parameter) || {};
  const wa = String(p.wa || '').replace(/\D/g, '');
  if (!/^628\d{7,11}$/.test(wa)) return ContentService.createTextOutput('tolak');

  // Cegah teks yang dibaca Sheet sebagai rumus (=, +, -, @)
  const aman = (v) => { const s = String(v || '').slice(0, 300); return /^[=+\-@]/.test(s) ? "'" + s : s; };

  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(KOLOM);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, KOLOM.length).setFontWeight('bold');
    }
    sheet.appendRow([
      new Date(), aman(p.ortu), "'" + wa, 'https://wa.me/' + wa, aman(p.anak),
      aman(p.tes), aman(p.hasil), aman(p.perangkat), aman(p.sumber)
    ]);
  } finally {
    kunci.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
