# Kuis Pintar Kelas 3 MI 🦉

Kuis interaktif untuk siswa kelas 3 Madrasah Ibtidaiyah, siap ditempel di **Google Sites**.

Semua isinya ada dalam satu file: `kuis-kelas3-mi.html`.

## Isi kuis
Soal **dibuat otomatis** dari daftar kata, angka, dan fakta, jadi hampir setiap soal berbeda.

| Pelajaran | Perkiraan jumlah soal berbeda | Contoh materi |
|---|---|---|
| 🔢 Matematika | tak terbatas (angka acak) | +, −, ×, :, nilai tempat, pola, pecahan, uang, waktu, satuan, keliling, pembulatan |
| 📖 Bahasa Indonesia | ±2.000+ | lawan kata, persamaan kata, kata benda/kerja/sifat, pemahaman kalimat, tanda baca |
| 🇬🇧 Bahasa Inggris | ±470 | kosakata, angka 1–100, lawan kata, hari, warna |
| 🌙 Bahasa Arab | ±270 | kosakata 13 kelompok, kelompok kata |
| 🌱 IPAS | ±230 | jenis makanan hewan, cara berkembang biak, perubahan wujud, tumbuhan, magnet, energi |
| 🕌 PAI | ±200 | Asmaul Husna, malaikat, rukun iman & Islam, sifat wajib Allah, akhlak, surah pendek, kisah nabi |
| 🤲 Fiqih | ±110 | salat fardu & rawatib, wudu, azan, salat berjamaah, air suci |
| 🎲 Campuran | gabungan semua | |

Fitur:
- Siswa mengisi nama, lalu memilih pelajaran
- **Soal tidak berulang:** soal yang sudah dijawab dicatat per nama siswa dan tidak dimunculkan lagi
- Jika hampir semua soal suatu pelajaran sudah dikerjakan, soal yang paling lama dikerjakan boleh muncul lagi untuk mengulang (siswa diberi tahu)
- **Matematika punya Level 1–3:** naik level jika nilai ≥ 80, turun jika nilai < 50
- Langsung muncul benar/salah beserta penjelasannya
- Suara, nilai 0–100, bintang, konfeti, dan pembahasan soal yang salah
- Bisa dipakai di HP, tablet, dan laptop

## 🌟 Kenali Diriku (tab kedua di halaman awal)
> **Saat ini semua kartu tes membuka https://hadirflow.my.id/kuistes di tab baru.**
> Untuk kembali memakai tes bawaan di bawah ini, buka `src/kuis-kelas3-mi.src.html`, ubah `const LINK_TES = "https://hadirflow.my.id/kuistes";` menjadi `const LINK_TES = "";`, lalu jalankan build.

Permainan untuk mengenal minat dan perasaan anak. Ini **bukan tes psikologi resmi**.

| Tes | Isi | Hasil |
|---|---|---|
| 🧬 Gaya Belajar 5 Mesin | 15 pertanyaan + tanggal lahir | Tipe paling menonjol (terinspirasi konsep STIFIn: Sensing, Thinking, Intuiting, Feeling, Insting), ciri, cara belajar yang cocok, usia |
| 🩸 Golongan Darahku | golongan darah anak, atau ayah & ibu | Info donor, atau kemungkinan golongan darah anak dari ayah & ibu |
| 🏅 Kelebihanku | 30 pernyataan, 10 bidang | 3 kelebihan teratas, 2 bidang yang bisa dilatih, grafik semua bidang |
| 🌤️ Mood Hari Ini | 4 pertanyaan | Saran sesuai perasaan + riwayat perasaan 14 kali terakhir |
| 🧩 Asah Otak (IQ) | 20 soal angka, pola, kata, logika (selalu berganti) | Skor /20, kategori, waktu, kekuatan per bidang, pembahasan |

Catatan penting:
- **STIFIn resmi** memakai sidik jari. Tanggal lahir tidak bisa menentukan tipe, jadi di sini hanya dipakai untuk menghitung usia.
- **Golongan darah** hanya bisa dipastikan dengan tes darah. Golongan darah tidak menentukan sifat anak.
- **Kelebihanku** adalah tes buatan sendiri, **bukan ST-30**.
- **Asah Otak tidak memberi angka IQ**, karena angka IQ yang sah hanya dari tes terstandar oleh psikolog.
- Hasil terakhir setiap tes tersimpan per nama, dan bisa dicetak atau disimpan sebagai PDF.

## Cara memasang di Google Sites
1. Buka file `kuis-kelas3-mi.html`, pilih semua isinya (Ctrl+A), lalu salin (Ctrl+C).
2. Buka situs Anda di **sites.google.com**.
3. Di panel kanan, pilih **Sisipkan → Sematkan** (*Insert → Embed*).
4. Pilih tab **Sematkan kode** (*Embed code*), tempel kodenya (Ctrl+V), lalu klik **Berikutnya → Sisipkan**.
5. Tarik sudut kotak kuis supaya cukup besar (disarankan tinggi ±900 px).
6. Klik **Publikasikan**.

## Mengubah atau menambah soal
Buka file HTML dengan Notepad, cari bagian `BANK SOAL`. Setiap soal ditulis seperti ini:

```js
{ t: "7 × 8 = ...", o: ["54", "56", "48", "64"], j: 1, p: "7 × 8 = 56." },
```

- `t` = pertanyaan
- `o` = empat pilihan jawaban
- `j` = nomor jawaban benar, **dihitung mulai 0** (0 = pilihan pertama, 1 = kedua, dst.)
- `p` = penjelasan yang muncul setelah menjawab

Jumlah soal per kuis bisa diubah di baris `const JUMLAH_SOAL = 10;`.

## Catatan tentang riwayat soal
Riwayat disimpan di browser perangkat yang dipakai siswa (bukan di server). Jadi:
- Siswa harus mengetik nama yang sama setiap kali main.
- Jika ganti HP/laptop, memakai mode penyamaran, atau menghapus data browser, riwayatnya mulai dari awal.
- Jika browser memblokir penyimpanan di Google Sites, soal tetap tidak berulang selama halaman belum ditutup.

Untuk menambah variasi, tambahkan kata/fakta baru ke daftar di bagian pembuat soal (mis. `ANTONIM`, `KOSAKATA_ARAB`, `MALAIKAT`) atau soal baru di `BANK SOAL`.

## Jika pelajaran tidak bisa dipilih
- **Di halaman edit Google Sites, kuis tidak bisa diklik.** Klik di dalam kotak sematan hanya memilih kotaknya. Coba kuis lewat tombol **Pratinjau** (ikon mata) atau di situs yang sudah dipublikasikan.
- Pastikan **seluruh** isi file tersalin (Ctrl+A lalu Ctrl+C), dari `<!DOCTYPE html>` sampai `</html>`.
- Kuis memakai JavaScript versi lama (ES5) supaya jalan di **iPad/iPhone iOS 9 ke atas** dan Android 5 ke atas.
- Jika kuis gagal berjalan, kotak merah **"Memuat kuis..."** tidak hilang atau berisi pesan error. Foto/salin tulisan itu untuk mencari penyebabnya.

## Untuk pengembang
File yang ditempel ke Google Sites (`kuis-kelas3-mi.html`) dibuat dari `src/kuis-kelas3-mi.src.html`:

```
npm install
npm run build
```

Soal di `BANK SOAL` tetap bisa diubah langsung di `kuis-kelas3-mi.html`, tetapi perubahan itu akan tertimpa saat build berikutnya. Jadi lebih baik ubah di file `src`, lalu jalankan build.
