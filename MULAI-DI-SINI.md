# CV Shortlister — paket Netlify

Source lengkap berdasarkan branch `cv-latest-google-login`, commit `50b2785`.
Tidak perlu merge branch lama untuk memakai paket ini. Desain dan prompt AI dipertahankan.

## Apa yang sudah dikerjakan

- Satu tombol Masuk dengan Google sekaligus meminta izin baca Gmail. Tidak ada password demo.
- Akun dibuat otomatis. Gmail, posisi, kandidat, ekspor, file CV, dan antrean dipisahkan per pengguna.
- Pemeriksaan email dijadwalkan setiap menit pada deploy utama Netlify. Interval per pengguna dihormati.
- Screening berjalan melalui background worker dengan antrean, percobaan ulang, dan pengunci agar satu akun tidak diproses bersamaan.
- Database PostgreSQL online menyimpan data dan file CV, sehingga tidak hilang saat function berhenti atau saat redeploy.
- Sync tidak lagi melaporkan sukses palsu. Hasil terakhir/error terlihat di Pengaturan; halaman Kandidat/Ringkasan diperbarui berkala.

## Yang tetap harus Anda isi satu kali

ZIP berisi kode lengkap, bukan akun hosting atau kredensial milik Anda. Jangan mengirim password atau secret ke chat.

1. Satu database **PostgreSQL online**. Gunakan database baru khusus aplikasi ini. Siapkan URL koneksi pooled (`DATABASE_URL`) dan URL direct (`DIRECT_URL`). Keduanya bisa sama jika penyedia tidak memakai pooler. Tambahkan `sslmode=require` sesuai penyedia; runtime disarankan `connection_limit=3`. Penyimpanan file memakai kolom binary database, jadi kapasitas database ikut terpakai oleh CV.
2. Google Cloud OAuth Client bertipe **Web application**, Gmail API aktif, serta Gemini API key.
3. Akun Netlify, lalu hubungkan repository GitHub yang berisi source paket ini.

Untuk pengujian, gunakan OAuth External/Testing dan daftarkan alamat penguji di daftar Test users. Jika Google Workspace kantor memblokir izin, admin kantor perlu mengizinkan aplikasi. Testing Gmail umumnya perlu otorisasi ulang setelah 7 hari. Peluncuran publik memerlukan pemenuhan persyaratan Google untuk scope Gmail yang diminta.

## Upload source ke GitHub

Ekstrak ZIP dan gunakan folder `CV-Shortlister-Netlify` sebagai project baru. Jangan menimpa database atau `.env` project lama. Dari Terminal di folder hasil ekstrak:

```bash
git init
git switch -c netlify-ready
git add .
git commit -m "Prepare Google login and multi-user Netlify sync"
git remote add origin https://github.com/vigojesko/cv-shortlister.git
git push -u origin netlify-ready
```

Jika nama branch sudah ada di remote, gunakan nama baru; jangan force-push. ZIP tidak berisi `.git`, `.env`, database pengguna, node_modules, atau CV pribadi. `sample-cvs` adalah contoh bawaan repository.

## Deploy di Netlify

1. Pilih **Add new project / Import an existing project → GitHub**, pilih repository `cv-shortlister`, branch **netlify-ready**. Branch tersebut harus menjadi production branch, bukan sekadar Deploy Preview.
2. Netlify membaca `netlify.toml`: build `npm run build:netlify`, publish `.next`, Node 22. **Jangan drag-and-drop ZIP ke Netlify Drop**: aplikasi ini perlu build server dan Functions.
3. Tentukan nama site sehingga URL-nya sudah diketahui, misalnya `https://nama-site.netlify.app`.
4. Isi environment variables di Netlify, tersedia untuk **Builds dan Functions**:

| Variable | Isi |
| --- | --- |
| `DATABASE_URL` | Koneksi PostgreSQL pooled/runtime |
| `DIRECT_URL` | Koneksi direct untuk migration |
| `NEXTAUTH_URL` | URL HTTPS site, tanpa slash terakhir |
| `NEXTAUTH_SECRET` | Secret acak pertama |
| `ENCRYPTION_KEY` | Secret hex 64 karakter kedua; jangan diganti setelah token tersimpan |
| `WORKER_SECRET` | Secret acak ketiga, minimum 32 karakter |
| `GOOGLE_CLIENT_ID` | OAuth Client ID Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret Google |
| `GEMINI_API_KEY` | API key Gemini Anda |
| `GEMINI_MODEL` | `gemini-2.5-flash` atau model yang tersedia untuk akun Anda |
| `ALLOWED_EMAILS` | Untuk pilot: email Anda dan penguji, dipisahkan koma. Kosong berarti semua akun Google yang mendapat izin OAuth dapat masuk. |

Untuk membuat tiga secret di komputer Anda (Node 22):

```bash
npm run secrets
```

Jalankan langsung dari folder hasil ekstrak; perintah ini tidak membutuhkan npm install. Salin output ke environment Netlify, bukan ke GitHub.

5. Di OAuth Client Google, Authorized redirect URI harus tepat:

```text
https://nama-site.netlify.app/api/auth/callback/google
```

Authorized JavaScript origin: `https://nama-site.netlify.app`. Callback lama `/api/gmail/callback` tidak dipakai lagi.
6. Jalankan deploy. Build memvalidasi konfigurasi dan menerapkan migration database otomatis, tanpa menjalankan seed demo. Pastikan paket Netlify Anda mendukung Background Functions dan masih memiliki kuota.
7. Di Functions harus muncul **cv-schedule** (Scheduled) dan **cv-worker-background**. Schedule otomatis hanya berjalan pada deploy production yang dipublikasikan.

## Tes pertama yang membuktikan otomatisasi

1. Penguji membuka site → Masuk dengan Google → mengizinkan akses baca Gmail.
2. Buat satu posisi aktif dengan kriteria nyata dan keyword, misalnya `LAMAR-FE`.
3. Kirim email ke Gmail penguji, subjek `LAMAR-FE - Nama Pelamar`, lampirkan PDF/DOCX baru yang belum pernah diproses.
4. Tutup website. Tunggu jadwal dan pemrosesan AI; tidak perlu klik Sync.
5. Buka kembali. Cek kandidat serta waktu/hasil sinkronisasi di Pengaturan. Kalau belum masuk, cek error di Pengaturan dan log kedua Functions.
6. Masuk dengan akun Google kedua. Daftar posisi/kandidat harus kosong sampai akun itu membuat datanya sendiri.

CV pertama tidak dapat dinilai sebelum ada posisi aktif. Email dipindai dalam rentang backfill (default 14 hari), berlampiran PDF/DOCX. Satu CV utama diproses per email seperti versi awal. Deduplikasi file berlaku di dalam satu akun, bukan lintas pengguna. Pengiriman ulang file identik pada akun sama tetap dilewati.

## Batas yang perlu diketahui

- Gmail/Google Workspace saja; Outlook tidak didukung.
- Interval satu menit adalah waktu pemicu, bukan jaminan kandidat muncul dalam 60 detik. Antrean, kuota AI, dan Gmail dapat menambah durasi.
- Upload manual dibatasi **3 MB per file** agar aman terhadap batas request Netlify; lampiran yang ditarik langsung dari Gmail maksimal **10 MB**.
- File besar Gmail dikirim lewat respons streaming untuk preview/download. Uji di deploy nyata karena runtime Netlify belum diuji dengan akun hosting Anda.
- File CV disimpan di PostgreSQL untuk menyederhanakan setup pilot. Untuk volume besar, pertimbangkan object storage terpisah dan worker khusus.
- Deploy Preview jangan memakai database production: build menjalankan migration. Gunakan environment/database terpisah atau nonaktifkan Deploy Previews untuk pilot.
- Database SQLite dan data lama di laptop **tidak otomatis dipindahkan**. Paket ini memakai database baru; project lama tetap utuh.
- SMTP digest dinonaktifkan. Jika kelak diaktifkan, penerima mengikuti Gmail pemilik akun, bukan email admin global.
- Setelah disconnect, token tersimpan dihapus. Proses yang sudah berjalan mungkin sedang menyelesaikan pekerjaannya. Izin juga bisa dicabut lewat pengaturan keamanan Google.

## Menjalankan lokal (opsional)

```bash
npm ci
cp .env.example .env
# Isi .env, gunakan PostgreSQL development terpisah
npx prisma migrate deploy
npm run dev
```

Tambahkan `ENABLE_LOCAL_SCHEDULER=true` hanya untuk development. Callback lokal Google: `http://localhost:3000/api/auth/callback/google`. Ubah `NEXTAUTH_URL` sesuai port yang digunakan. Tidak perlu menjalankan `seed`.

## Pemeriksaan developer

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Integration tests perlu PostgreSQL khusus tes, schema sudah dimigrasi, `CV_TEST_DATABASE=1`, lalu `npm run test:integration`. Tes memakai Gmail/AI fixture; tidak mengirim email atau memanggil AI berbayar. Jangan arahkan ke database production.

Dokumentasi resmi: https://docs.netlify.com/build/functions/scheduled-functions/ ; https://docs.netlify.com/build/functions/background-functions/ ; https://next-auth.js.org/providers/google ; https://support.google.com/cloud/answer/15549945
