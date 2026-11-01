# CV Shortlister — UI/UX redesign

Sumber: https://github.com/vigojesko/cv-shortlister · baseline `711d563`.

## Cara memakai hasil

Setiap ZIP merupakan source proyek lengkap pada akhir fase tersebut, bukan patch. Pakai **fase 5** untuk versi terbaru; fase sebelumnya tersedia untuk review bertahap. Arsip tidak menyertakan node_modules, .next, .git, database lokal, atau .env. Simpan konfigurasi .env dan data proyekmu yang sudah ada.

```bash
npm ci --legacy-peer-deps
npm run lint
npx tsc --noEmit
npm run build
npm run dev
```

Flag legacy-peer-deps diperlukan karena konflik peer dependency next-auth/nodemailer yang sudah ada pada baseline. Tidak ada versi dependency existing yang diubah. Dependency aplikasi tambahan hanya framer-motion beserta dependency transitifnya. Font lokal memakai next/font/local; lisensi font ikut disertakan.

## Hasil per fase dan halaman review

| Fase | Isi utama | Halaman yang dicek | Validasi |
|---|---|---|---|
| 1 | Logo SVG, favicon, apple-touch icon, OG PNG, Plus Jakarta Sans + DM Sans, token warna/radius/bayangan, tema terang/gelap | Semua halaman; /login | Lint, typecheck, build lulus |
| 2 | Sidebar collapsible, drawer navigasi mobile, breadcrumb sticky, command search, tombol sync | Semua halaman; Cmd/Ctrl+K | Lint, typecheck, build lulus |
| 3 | Greeting, checklist onboarding, statistik clickable, funnel posisi, inbox perhatian, status Gmail, rich candidate rows | / | Lint, typecheck, build lulus |
| 4 | Tabel/kartu, filter, sorting, saved views lokal, bulk status & CSV, drawer intercepted route, deep link, radar, evidence expandable, compare highlighting | /candidates, /candidates/[id], /compare | Lint, typecheck, build lulus |
| 5 | Editor posisi existing/new, linked weights 100%, simulasi skor, editable requirement chips, mini-stats posisi, multi-file upload, progress/retry, motion, skeleton, toast, error states; final polish termasuk sparkline cohort | /positions, /positions/new, /positions/[id]/edit, /upload; review ulang semua | Lint tanpa warning, typecheck, build lulus |

## Verifikasi

- Semua API routes, lib (termasuk scoring, AI prompts, Gmail), Prisma schema, middleware, dan instrumentation tetap identik dengan baseline.
- Tidak tersedia test script/unit suite pada baseline. Smoke test browser dilakukan pada build produksi dengan respons API fixture lokal, bukan akun atau data rekrutmen asli.
- Browser smoke test: dashboard terang/gelap; command search; drawer dan Escape; shortcut J/K/S/R; linked sliders pada 12 perubahan dengan jumlah selalu 100%; halaman edit posisi; compare; empat halaman tanpa overflow horizontal pada lebar 390px; navigasi mobile. Tidak ada page error JavaScript.
- Screenshot desktop 1440px dan mobile 390px diperiksa. Header detail dirapikan berdasarkan pemeriksaan visual agar nama mendahului skor dan skor utama tidak berulang.
- Build berhasil. Lingkungan validasi tidak diberi DATABASE_URL/akun Gmail/AI; pre-render endpoint existing dapat menulis peringatan Prisma karena konfigurasi tersebut tidak ada. Uji end-to-end Gmail, database produksi, dan penilaian AI tetap perlu dijalankan pada konfigurasi proyekmu sendiri.
- Audit Lighthouse dan sertifikasi WCAG menyeluruh belum dilakukan. Focus ring, reduced-motion, dialog focus trapping, label interaksi utama, dan kontras tema telah diperbaiki; tidak diklaim sebagai audit aksesibilitas lengkap.

## Batasan dan bagian yang belum lengkap

- API existing tidak menyediakan next scheduled sync, live processed-email/duplicate/error feed, atau confidence score. UI menampilkan status sinkronisasi dan last error yang tersedia, serta menjelaskan data yang belum tersedia. Tidak ada log/jadwal/confidence buatan.
- Inbox perhatian memakai NEEDS_HR_REVIEW dengan tindakan tinjau/shortlist. Penyelesaian routing melalui pemilihan ulang posisi dan pemisahan kandidat berdasarkan confidence belum diimplementasikan.
- Sparkline/delta memakai distribusi tanggal masuk dan **status saat ini**, bukan riwayat perubahan status. Saved views disimpan per browser/perangkat.
- Pratinjau PDF tersedia di panel dokumen; belum berdampingan dengan evaluasi. DOCX memakai unduhan karena browser tidak merender DOCX secara native.
- Upload memperlihatkan progres transfer asli. Server hanya memberi hasil akhir, sehingga membaca dan menilai ditampilkan sebagai satu tahap pemrosesan, bukan progres per tahap yang dibuat-buat.
- Pengujian browser menggunakan fixtures, sehingga perubahan status/export/unggah terhadap database asli belum diuji end-to-end. Tidak ada optimistic status update sebelum server mengonfirmasi keberhasilan.

## File yang ditambah atau diubah

- `README-REDESIGN.md`
- `app/@modal/(.)candidates/[id]/page.tsx`
- `app/@modal/[...catchAll]/page.tsx`
- `app/@modal/default.tsx`
- `app/candidates/[id]/page.tsx`
- `app/candidates/page.tsx`
- `app/compare/page.tsx`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/loading.tsx`
- `app/login/page.tsx`
- `app/page.tsx`
- `app/positions/[id]/edit/page.tsx`
- `app/positions/[id]/page.tsx`
- `app/positions/new/page.tsx`
- `app/positions/page.tsx`
- `app/settings/page.tsx`
- `app/upload/page.tsx`
- `components/CandidateDetail.tsx`
- `components/CandidateDrawer.tsx`
- `components/Motion.tsx`
- `components/Navbar.tsx`
- `components/PositionForm.tsx`
- `components/Providers.tsx`
- `components/ThemeToggle.tsx`
- `components/Toast.tsx`
- `components/Visuals.tsx`
- `components/WeightEditor.tsx`
- `package-lock.json`
- `package.json`
- `public/apple-touch-icon.png`
- `public/favicon.svg`
- `public/fonts/DM-OFL.txt`
- `public/fonts/Jakarta-OFL.txt`
- `public/fonts/dm.ttf`
- `public/fonts/jakarta.ttf`
- `public/logo-mark.svg`
- `public/logo.svg`
- `public/og.png`
- `tailwind.config.js`
