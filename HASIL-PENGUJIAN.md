# Hasil pengujian — CV Shortlister Netlify

Tanggal: 1 November 2026. Dasar source: branch cv-latest-google-login, commit 50b278571795f91530d161b440764678a8307c86.

## Pemeriksaan selesai

| Pemeriksaan | Hasil |
| --- | --- |
| npm run lint | Lolos, tanpa warning ESLint |
| npm run typecheck | Lolos |
| npm run build | Lolos, build production Next.js 14.2.35 |
| npm test | 5 tes unit lolos |
| npm run test:integration | 8 tes integrasi lolos |
| Bundling dua native Netlify Functions | Lolos dengan esbuild dan Prisma eksternal |
| Perbandingan source formula skor, aturan shortlist, prompt AI, schema hasil AI | Tidak berubah |

## Cakupan 13 tes

1. Konteks akun terisolasi walaupun promise berjalan bersamaan; akses tanpa konteks ditolak.
2. Enkripsi token bisa didekripsi kembali; token yang diubah ditolak; key kosong ditolak.
3. Secret worker kosong/salah ditolak, secret yang tepat diterima.
4. Formula weighted score dan bobot nol sesuai perilaku awal.
5. Input posisi dengan bobot negatif atau syarat kosong ditolak.
6. Database menolak baca/update/delete posisi akun lain dan menghubungkan pekerjaan ke posisi akun lain.
7. File CV hanya bisa dibaca pemiliknya.
8. Gmail fixture memeriksa pagination, CV duplikat per akun, dan sync ulang tanpa kandidat ganda.
9. Worker memproses upload yang tersimpan dan menolak eksekusi kedua ketika lease masih aktif.
10. Re-screen Top-N tidak menghitung skor lama kandidat sebagai pesaing dirinya sendiri.
11. Kegagalan re-screen mempertahankan data kandidat lama; pekerjaan gagal setelah tiga percobaan.
12. Callback OAuth memeriksa email terverifikasi, izin Gmail, serta penyimpanan token terenkripsi.
13. Server production menolak API tanpa login; memisahkan daftar posisi, detail/file, dan pengaturan Gmail; menolak mutation lintas origin; tidak mengembalikan token pada GET/PATCH pengaturan.

Integration tests memakai PostgreSQL embedded PGlite melalui socket untuk database sementara, server Next.js production lokal, dan fixture Gmail/AI. Tidak ada email nyata dikirim dan tidak ada panggilan AI berbayar. Konflik database simulasi saat pengembangan diperbaiki dengan mode koneksi tanpa statement cache; seluruh tes akhir lolos.

## Belum diverifikasi di layanan nyata

- Login Google lengkap melalui browser menggunakan OAuth Client milik Anda.
- Penarikan CV dari inbox Gmail asli dan respons model Gemini asli.
- Build/deploy melalui akun Netlify Anda, pemicu cron cloud, kuota paket, dan preview file besar pada runtime Netlify.
- Migration terhadap database PostgreSQL online milik Anda; SQL awal sudah diterapkan ke database pengujian.
- Audit visual browser/Lighthouse pada versi ini dan uji beban banyak akun.

Kode source dan konfigurasi deployment telah disiapkan. Belum ada site yang dideploy dari sesi ini. Ikuti MULAI-DI-SINI.md untuk pengaturan kredensial dan pengujian nyata setelah deploy. Kode tidak berisi secret, database pengguna, atau token Google.

## Batas operasional

Database online baru diperlukan; SQLite lama tidak otomatis dimigrasikan. CV tersimpan sebagai binary di PostgreSQL untuk pilot. Upload manual maksimal 3 MB, Gmail maksimal 10 MB. Satu CV utama per email tetap dipertahankan. Interval sync bukan jaminan selesai dalam satu menit. Outlook belum didukung. SMTP digest mati secara default.
