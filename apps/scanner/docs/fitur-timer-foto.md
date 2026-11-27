# Fitur Timer Foto di Scanner ("Timer foto")

Fitur ini mengatur **berapa lama jeda sebelum kamera mengambil foto** saat tamu difoto/selfie setelah check-in. Admin perangkat (penerima tamu) memilihnya langsung pada tablet/scanner di aplikasi *Pengaturan* — pengaturannya tersimpan di tiap perangkat, jadi tiap pintu bisa beda-beda sesuai kebutuhan.

## Untuk apa fiturnya?

- **0 detik ("Langsung")** — foto langsung diambil begitu tombol kamera disentuh. Paling cepat, cocok untuk antrean yang ramai agar tamu tidak menunggu.
- **1–5 detik** — ada hitung mundur angka di layar sebelum jepret. Beri waktu tamu untuk memeriksa posisi / senyum sebelum foto diambil.

## Cara mengatur

1. Buka aplikasi scanner, lalu buka tab **Pengaturan** (ikon roda gigi di bawah).
2. Cari bagian **Kamera** di daftar pengaturan.
3. Tap tombol **Timer foto**:
   - **Langsung** = foto langsung (tanpa jeda).
   - **1 – 5** = lama hitung mundur dalam detik sebelum kamera menjepret.
4. Pengaturan tersimpan otomatis di perangkat itu dan langsung berlaku untuk foto berikutnya.

> Catatan: pilihan kamera (Depan/Belakang) berada di bagian Kamera yang sama, terpisah dari Timer foto.

## Cara memotret saat check-in

1. Setelah QR tamu berhasil di-scan, muncul layar foto (ini bagian dari aktivitas setelah check-in di acara).
2. Pilih **"Mulai foto"**.
3. Tekan tombol kamera besar di bawah layar.
4. Tergantung pengaturan Timer foto:
   - **0 (Langsung):** kamera langsung menjepret.
   - **1–5:** angka hitung mundur muncul di tengah layar, lalu kamera menjepret.
5. Hasil foto bisa dipakai (**Pakai foto**), diulang (**Ulangi**), atau dilewati (**Lewati**) jika tidak wajib.

Foto yang dipakai akan disimpan lalu diunggah ke penyimpanan cloud (kanvas/R2), tampil di layar galeri/wall acara, dan menjadi milik mempelai.

## Tips

- **Antrean ramai / gerbang masuk:** gunakan **Langsung (0)** agar tiap tamu hanya butuh ± 5–10 detik dan tidak menahan antrean.
- **Foto grup / keluarga yang ingin berpose:** gunakan timer **3–5 detik** supaya semua anggota siap.
- Nilai default saat perangkat pertama dibuka adalah **Langsung (0)**.

## Di mana kode-nya berada

- Pengaturan: `apps/scanner/src/screens/More.tsx` (bagian "Timer foto")
- Logika jepret: `apps/scanner/src/screens/Activities.tsx`
- Simpan setting per perangkat: `apps/scanner/src/state.tsx`
