# Kuis Pintar Kelas 3 MI 🦉

Kuis interaktif untuk siswa kelas 3 Madrasah Ibtidaiyah, siap ditempel di **Google Sites**.

Semua isinya ada dalam satu file: `kuis-kelas3-mi.html`.

## Isi kuis
| Pelajaran | Jumlah soal |
|---|---|
| 🔢 Matematika | 12 |
| 📖 Bahasa Indonesia | 10 |
| 🌱 IPAS | 10 |
| 🕌 Pendidikan Agama Islam | 12 |
| 🌙 Bahasa Arab | 10 |
| 🎲 Campuran | 10 soal acak dari semua pelajaran |

Fitur:
- Siswa mengisi nama, lalu memilih pelajaran
- Urutan soal dan pilihan jawaban diacak setiap kali main
- Langsung muncul benar/salah beserta penjelasannya
- Suara, nilai 0–100, bintang, konfeti, dan pembahasan soal yang salah
- Bisa dipakai di HP, tablet, dan laptop

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
