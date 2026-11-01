import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

interface CandidateSample {
  fileName: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  experienceYears: number;
  skills: string[];
  experienceDesc: string[];
  portfolioLinks: string[];
  summary: string;
}

const sampleCandidates: CandidateSample[] = [
  // 1. SANGAT COCOK 1: Rizky Pratama (Senior Digital Marketer, 4 tahun, GA4 certified, Meta Ads pro)
  {
    fileName: "CV_Rizky_Pratama_Marketing_Executive.pdf",
    name: "Rizky Pratama, S.E.",
    email: "rizky.pratama.demo@gmail.com",
    phone: "+62 812-3456-7890",
    location: "Jakarta Selatan, DKI Jakarta",
    education: "S1 Manajemen Bisnis & Pemasaran - Universitas Indonesia (2016 - 2020), IPK 3.75",
    experienceYears: 4,
    skills: [
      "Meta Ads Manager (Facebook & Instagram)",
      "Google Ads (Search, Display, Performance Max)",
      "Google Analytics 4 (GA4) & Tag Manager",
      "Perhitungan Metrik ROAS, CPA, CAC, LTV",
      "A/B Testing Copywriting & Creative Design",
    ],
    experienceDesc: [
      "Digital Marketing Specialist di PT Tech Solusi Indonesia (2022 - Sekarang): Mengelola budget iklan berbayar Rp 150 juta/bulan dengan rata-rata ROAS 4.8x. Menurunkan CPA sebesar 28% melalui optimalisasi audience funnel.",
      "Marketing Associate di E-Commerce Nusantara (2020 - 2022): Merancang kampanye promosi bulanan dan meningkatkan akuisisi pengguna baru hingga 45%.",
    ],
    portfolioLinks: [
      "https://portfolio.rizkypratama.dev/case-study-roas",
      "https://linkedin.com/in/rizky-pratama-demo",
    ],
    summary:
      "Digital Marketer dengan pengalaman 4+ tahun dalam performa iklan berbayar dan optimasi funnel konversi. Terbukti meningkatkan ROAS hingga 4.8x pada skala B2C dan B2B.",
  },

  // 2. SANGAT COCOK 2: Amanda Putri (Performance Marketing, 3 tahun, S1 Komunikasi, Portofolio Lengkap)
  {
    fileName: "CV_Amanda_Putri_Marketing_Executive.pdf",
    name: "Amanda Putri, S.I.Kom.",
    email: "amanda.putri.demo@gmail.com",
    phone: "+62 813-8888-9999",
    location: "Tangerang Selatan, Banten",
    education: "S1 Ilmu Komunikasi Pemasaran - Universitas Padjadjaran (2017 - 2021), IPK 3.82",
    experienceYears: 3,
    skills: [
      "Google Ads Certified (Search & Display)",
      "HubSpot Inbound Marketing Certified",
      "Meta Ads & TikTok Ads Management",
      "Analisis Data GA4, Tableau & Looker Studio Dashboard",
      "Content Strategy & Copywriting",
    ],
    experienceDesc: [
      "Marketing Executive di Inovasi Digital Group (2021 - Sekarang): Memimpin strategi digital marketing end-to-end, menghasilkan kenaikan lead sebesar 65% dalam 12 bulan. Mengelola budget paid ads Rp 80 juta/bulan.",
      "Junior Campaign Specialist di Agensi Kreatif Megah (2020 - 2021): Bertanggung jawab atas setup campaign iklan 5 brand nasional.",
    ],
    portfolioLinks: [
      "https://amandaputri.myportfolio.com/campaigns",
      "https://linkedin.com/in/amanda-putri-demo",
    ],
    summary:
      "Marketing Executive bersertifikasi Google Ads dan HubSpot dengan spesialisasi akuisisi pengguna berbayar dan analitik GA4.",
  },

  // 3. SEDANG (MAYBE): Budi Santoso (1.5 tahun pengalaman, D3 Manajemen, Skill Ads dasar)
  {
    fileName: "CV_Budi_Santoso_Marketing_Executive.pdf",
    name: "Budi Santoso",
    email: "budi.santoso.demo@gmail.com",
    phone: "+62 856-7777-1111",
    location: "Depok, Jawa Barat",
    education: "D3 Manajemen Pemasaran - Politeknik Negeri Jakarta (2019 - 2022)",
    experienceYears: 1.5,
    skills: [
      "Social Media Marketing (Instagram, TikTok)",
      "Dasar Meta Ads (Boost Post)",
      "Canva & Content Editing",
      "Pencatatan Penjualan Harian",
    ],
    experienceDesc: [
      "Staff Pemasaran di Toko Ritel Sejahtera (2022 - Sekarang): Mengelola akun media sosial dan membantu promosi diskon produk lokal.",
    ],
    portfolioLinks: ["https://instagram.com/budicontentdemo"],
    summary:
      "Staf pemasaran muda yang aktif di media sosial dengan pemahaman dasar pembuatan konten promosi.",
  },

  // 4. TIDAK COCOK 1: Denny Wardhana (Software Engineer / Backend Developer, tidak ada skill marketing)
  {
    fileName: "CV_Denny_Wardhana_Software_Engineer.pdf",
    name: "Denny Wardhana, S.Kom.",
    email: "denny.engineer.demo@gmail.com",
    phone: "+62 878-1234-5678",
    location: "Bandung, Jawa Barat",
    education: "S1 Teknik Informatika - Institut Teknologi Bandung (2018 - 2022)",
    experienceYears: 3,
    skills: [
      "Node.js, TypeScript, Go, Python",
      "PostgreSQL, MongoDB, Redis, Docker, Kubernetes",
      "RESTful API & GraphQL Development",
      "CI/CD Pipeline & Linux System Administration",
    ],
    experienceDesc: [
      "Backend Engineer di FinTech Maju Bersama (2022 - Sekarang): Merancang microservices pembayaran dengan throughput 15,000 TPS.",
      "Junior Software Developer di PT Solusi Cloud (2021 - 2022): Membangun modul autentikasi dan database migrations.",
    ],
    portfolioLinks: ["https://github.com/denny-engineer-demo"],
    summary:
      "Backend Engineer dengan pengalaman membangun arsitektur sistem skala besar dan microservices berkinerja tinggi.",
  },

  // 5. TIDAK COCOK 2: Siti Rahma (Fresh Graduate SMA, Administrasi Kasir)
  {
    fileName: "CV_Siti_Rahma_Admin.pdf",
    name: "Siti Rahma",
    email: "siti.rahma.demo@gmail.com",
    phone: "+62 899-0000-2222",
    location: "Bekasi, Jawa Barat",
    education: "SMA Negeri 1 Bekasi - Jurusan IPS (Lulus 2023)",
    experienceYears: 0.5,
    skills: [
      "Microsoft Word & Excel Dasar",
      "Pelayanan Pelanggan Kasir",
      "Input Data Transaksi Manual",
    ],
    experienceDesc: [
      "Kasir & Pramuniaga di Minimarket Surya (2023 - 2024): Melayani transaksi kasir harian dan mencatat stok barang.",
    ],
    portfolioLinks: [],
    summary:
      "Lulusan SMA yang teliti dan ramah, berpengalaman melayani transaksi penjualan kasir.",
  },
];

async function generatePdf(candidate: CandidateSample, outputDir: string) {
  const filePath = path.join(outputDir, candidate.fileName);
  const doc = new PDFDocument({ margin: 45, size: "A4" });
  const writeStream = fs.createWriteStream(filePath);

  doc.pipe(writeStream);

  // Header
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#1e293b")
    .text(candidate.name, { align: "left" });

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(
      `${candidate.email} | ${candidate.phone} | ${candidate.location}`,
      { align: "left" }
    );

  doc.moveDown(0.8);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.8);

  // Summary
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("RINGKASAN PROFESIONAL");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#334155").text(candidate.summary, { lineGap: 3 });

  // Education
  doc.moveDown(0.8);
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("LATAR BELAKANG PENDIDIKAN");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").fillColor("#334155").text(candidate.education);

  // Experience
  doc.moveDown(0.8);
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text(`PENGALAMAN KERJA (${candidate.experienceYears} TAHUN)`);
  doc.moveDown(0.3);
  for (const exp of candidate.experienceDesc) {
    doc.fontSize(9.5).font("Helvetica").fillColor("#334155").text(`• ${exp}`, { lineGap: 2 });
    doc.moveDown(0.2);
  }

  // Skills
  doc.moveDown(0.8);
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("KEAHLIAN UTAMA & KOMPETENSI");
  doc.moveDown(0.3);
  for (const skill of candidate.skills) {
    doc.fontSize(9.5).font("Helvetica").fillColor("#334155").text(`- ${skill}`);
  }

  // Portfolio
  if (candidate.portfolioLinks.length > 0) {
    doc.moveDown(0.8);
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#0f172a").text("TAUTAN PORTOFOLIO & REKAM JEJAK");
    doc.moveDown(0.3);
    for (const link of candidate.portfolioLinks) {
      doc.fontSize(9.5).font("Helvetica-Oblique").fillColor("#2563eb").text(link);
    }
  }

  doc.end();

  return new Promise<void>((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

async function main() {
  const outputDir = path.join(process.cwd(), "sample-cvs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Membuat 5 sampel berkas CV PDF di folder ${outputDir}...`);

  for (const candidate of sampleCandidates) {
    await generatePdf(candidate, outputDir);
    console.log(`  ✓ Berhasil membuat: ${candidate.fileName}`);
  }

  console.log("\nSemua 5 sampel CV PDF berhasil dibuat!");
}

main().catch(console.error);
