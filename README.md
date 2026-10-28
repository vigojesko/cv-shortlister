# CV Shortlister 🚀

Aplikasi otomatisasi seleksi CV pelamar berbasis AI (Google Gemini) yang terintegrasi langsung dengan Gmail. HR cukup menghubungkan Gmail sekali dan menentukan kriteria posisi; selanjutnya sistem bekerja mandiri untuk mendownload CV, melakukan routing posisi, mengevaluasi berkas secara objektif (blind screening), dan menampilkan shortlist kandidat terbaik di dashboard web.

---

## 📋 Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Tech Stack](#tech-stack)
3. [Instalasi & Menjalankan di Localhost](#instalasi--menjalankan-di-localhost)
4. [Konfigurasi Google Gemini API Key](#konfigurasi-google-gemini-api-key)
5. [Setup Lengkap Google Cloud OAuth 2.0 (Gmail API)](#setup-lengkap-google-cloud-oauth-20-gmail-api)
6. [Pengujian End-to-End (Dengan & Tanpa Gmail)](#pengujian-end-to-end)
7. [Panduan Deploy (Docker & VPS)](#panduan-deploy)
8. [Asumsi & Keputusan Arsitektur](#asumsi)

---

## 🌟 Fitur Utama

- **Otomatisasi Penuh dari Gmail**: Penjadwal cron berkala (`node-cron` via `instrumentation.ts`) menarik email baru berlampiran CV (PDF & DOCX) setiap 15 menit.
- **Pencegahan Duplikat**: Menggunakan Gmail Message ID dan SHA-256 hash dokumen agar berkas yang sama tidak diproses ulang.
- **Auto-Routing Dua Tahap**:
  1. Pencocokan kata kunci subjek email / label Gmail per posisi.
  2. Fallback AI routing jika ambigu atau tidak cocok filter, dengan label "Perlu dicek HR" jika confidence < 0.6.
- **AI Blind Screening Objektif**: Menggunakan model resmi Google Gemini via `@google/genai`. Penilaian bebas bias suku/agama/gender/foto dan tahan dari prompt injection.
- **Pengecekan Kualifikasi Mutlak (Must-Have)**: Rekomendasi tidak akan pernah SHORTLIST jika ada syarat wajib yang gagal dipenuhi kandidat.
- **Kalkulasi Bobot Deterministik**: Skor akhir 0-100 dihitung matematis di kode server berdasarkan bobot yang ditentukan HR (Skills, Pengalaman, Pendidikan, Portofolio).
- **Dasbor Komparasi & Export**:
  - Tampilan kartu shortlist, tabel komparasi detail 2-3 kandidat berdampingan.
  - Export laporan ke format Microsoft Excel (.xlsx) dan CSV.
  - Re-screening batch saat kriteria deskripsi pekerjaan diperbarui.
  - Hapus data kandidat untuk privasi GDPR / PDP.
- **Enkripsi AES-256-GCM**: Google OAuth refresh token disimpan terenkripsi di database lokal.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: SQLite via Prisma ORM (skema modular siap dipindahkan ke PostgreSQL)
- **AI Engine**: Google Gemini via SDK resmi `@google/genai` (Interface layer `lib/ai/provider.ts`)
- **Document Parsers**: Inline data PDF langsung ke Gemini + `mammoth` untuk DOCX
- **Gmail Integration**: Google OAuth 2.0 & Gmail API (`googleapis`), scope `gmail.readonly`
- **Scheduler**: `node-cron` dengan penjaga instance global di `instrumentation.ts`
- **Autentikasi**: NextAuth.js (Credentials Provider)
- **Exporting**: SheetJS (`xlsx`)

---

## 💻 Instalasi & Menjalankan di Localhost

### 1. Prasyarat
- Node.js versi 18+ atau 20+ (rekomendasi LTS)
- npm versi 9+

### 2. Langkah Cepat

```bash
# 1. Masuk ke folder proyek
cd "TUGAS AKHIR"

# 2. Instalasi dependensi
npm install --legacy-peer-deps

# 3. Salin file environment
cp .env.example .env

# 4. Sinkronkan skema database SQLite
npx prisma db push

# 5. Seed akun admin dan posisi demo "Marketing Executive"
npm run seed

# 6. Buat 5 berkas PDF CV contoh
npm run generate:sample-cvs

# 7. Jalankan server pengembang
npm run dev
```

Buka browser Anda di: **`http://localhost:3000`**

### Akun Login Admin Bawaan (Seed):
- **Email**: `admin@cvshortlister.local`
- **Password**: `AdminPassword123!`

---

## 🔑 Konfigurasi Google Gemini API Key

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Masuk menggunakan akun Google Anda.
3. Klik tombol **"Get API key"** di pojok kiri atas.
4. Klik **"Create API key in new project"** (atau pilih project Google Cloud yang sudah ada).
5. Salin API key yang dihasilkan, lalu buka file `.env` dan masukkan ke variabel:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   GEMINI_MODEL="gemini-2.5-flash"
   ```

---

## 📧 Setup Lengkap Google Cloud OAuth 2.0 (Gmail API)

Sistem menggunakan scope aman `https://www.googleapis.com/auth/gmail.readonly` (hanya membaca email lamaran, tanpa akses kirim/hapus).

### Langkah Rinci:
1. Masuk ke [Google Cloud Console](https://console.cloud.google.com/).
2. Buat Project baru, beri nama misalnya **"CV-Shortlister-App"**.
3. **Aktifkan Gmail API**:
   - Buka menu **APIs & Services** > **Library**.
   - Cari **"Gmail API"**, klik lalu pilih **Enable**.
4. **Konfigurasi OAuth Consent Screen**:
   - Buka **APIs & Services** > **OAuth consent screen**.
   - Pilih User Type: **External**, lalu klik **Create**.
   - Isi informasi aplikasi:
     - App name: `CV Shortlister`
     - User support email: Email Google Anda
     - Developer contact email: Email Google Anda
   - Pada langkah **Scopes**, klik **Add or Remove Scopes**, tambahkan:
     `.../auth/gmail.readonly`
   - Pada langkah **Test users (PENTING)**:
     - Tambahkan akun email pengujian: `Georgevigo2005@gmail.com` (dan email Google Anda sendiri yang akan dihubungkan).
     - *Catatan Penting*: Dalam mode **Testing**, Google hanya mengizinkan akun yang terdaftar di daftar Test Users untuk login, dan token refresh akan kedaluwarsa setiap 7 hari sehingga perlu klik hubungkan ulang di halaman Pengaturan.
   - Simpan hingga selesai.
5. **Buat Kredensial OAuth Client ID**:
   - Buka **APIs & Services** > **Credentials**.
   - Klik **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `CV Shortlister Web Client`.
   - **Authorized redirect URIs**: Tambahkan:
     `http://localhost:3000/api/gmail/callback`
   - Klik **Create**.
6. Salin **Client ID** dan **Client Secret** ke file `.env`:
   ```env
   GOOGLE_CLIENT_ID="xxxx-xxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/gmail/callback"
   ```
7. Buka website di `http://localhost:3000/settings`, klik **"Hubungkan Gmail (OAuth 2.0)"**, lalu setujui izin membaca email.

---

## 🧪 Pengujian End-to-End

### Opsi A: Pengujian Nyata dengan Gmail
1. Pastikan status Gmail di halaman `/settings` sudah **Terhubung**.
2. Dari akun email lain (atau pelamar), kirim email ke akun Gmail terhubung (`Georgevigo2005@gmail.com`):
   - **Subjek**: `Lamaran Marketing Executive - Rizky Pratama`
   - **Attachment**: Lampirkan salah satu file PDF dari folder `sample-cvs/` (misal: `CV_Rizky_Pratama_Marketing_Executive.pdf`).
3. Tunggu hingga cron berjalan (atau langsung klik tombol **"Sync Sekarang"** di pojok kanan atas website).
4. Hasil screening akan langsung muncul di Dashboard dan tab **Shortlist Lolos** pada posisi Marketing Executive!

### Opsi B: Pengujian Cepat Tanpa Menghubungkan Gmail
Jika Anda belum membuat OAuth Google Cloud namun ingin langsung melihat kemampuan screening AI:
```bash
# Masukkan 5 sampel CV fiktif langsung ke pipeline screening AI
npm run demo:seed-cvs
```
Buka `http://localhost:3000` untuk meninjau hasil evaluasi, skor, checklist must-have, serta fitur bandingkan kandidat.

---

## 🚢 Panduan Deploy

### Opsi 1: Docker
Aplikasi telah dilengkapi `Dockerfile` multi-stage:
```bash
docker build -t cv-shortlister .
docker run -p 3000:3000 --env-file .env cv-shortlister
```

### Opsi 2: VPS (Ubuntu / Debian dengan PM2)
1. Clone repo di VPS:
   ```bash
   git clone <repo_url>
   cd "TUGAS AKHIR"
   npm install --legacy-peer-deps
   cp .env.example .env
   # Edit .env dengan URL domain/IP publik Anda
   npx prisma db push
   npm run seed
   npm run build
   ```
2. Jalankan dengan PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "cv-shortlister" -- start
   pm2 save
   pm2 startup
   ```
3. Pasang Nginx reverse proxy mengarah ke port 3000 dan sertifikat SSL Let's Encrypt (Certbot).

---

## 📌 Asumsi & Keputusan Arsitektur

1. **Model AI Default**: Menggunakan model `gemini-2.5-flash` karena memiliki latensi rendah, efisiensi token tinggi, dan kemampuan parsing dokumen PDF multimodal native yang presisi. Model dapat diubah kapan saja melalui env `GEMINI_MODEL`.
2. **Abstraksi Multi-Provider**: Seluruh pemanggilan AI dibungkus melalui interface `AIServiceProvider` pada `lib/ai/provider.ts`. Implementasi Gemini diletakkan di `lib/ai/gemini.ts`. Jika ingin beralih ke OpenAI atau Claude di masa depan, cukup tambahkan provider baru tanpa mengubah logika screening di `screener.ts`.
3. **Parsing Dokumen**: Berkas PDF dikirim sebagai raw bytes / inline data (`application/pdf`) langsung ke Gemini, mempertahankan pemahaman tata letak visual, kolom desain grafis, dan portofolio link. Berkas DOCX diekstrak menjadi teks melalui library `mammoth`.
4. **Pencegahan Duplikat**: Mengombinasikan `messageId` Gmail dan hash kriptografi `SHA-256` dari konten berkas. Pelamar yang mengirim email berkali-kali dengan CV identik tidak akan membebani kuota API AI.
5. **Kalkulasi Skor di Server (Deterministic)**: AI Gemini hanya menilai sub-skor (0-100) per kategori (Skills, Pengalaman, Pendidikan, Portofolio). Skor akhir dihitung secara pasti di kode TypeScript berdasarkan persentase bobot posisi, mencegah inkonsistensi kalkulasi oleh AI.
6. **Masa Berlaku Token Google**: Karena aplikasi berada dalam status mode Testing di Google Cloud Console, refresh token otomatis berakhir tiap 7 hari. Sistem mendeteksi kegagalan otorisasi secara halus tanpa crash, memberikan banner peringatan di UI, dan menyediakan tombol sekali klik untuk otorisasi ulang.
