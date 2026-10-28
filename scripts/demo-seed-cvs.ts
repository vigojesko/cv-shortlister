import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { sha256 } from "../lib/crypto";
import { screenCandidateCv } from "../lib/screening/screener";
import { parseCvDocument } from "../lib/parsers/document";

async function main() {
  console.log("=== Menjalankan Demo Pipeline Screening CV ===");

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "PERINGATAN: GEMINI_API_KEY belum diisi di file .env. Pastikan Anda mengisi GEMINI_API_KEY untuk memproses screening AI nyata."
    );
  }

  // 1. Get Marketing Executive position
  const position = await prisma.position.findFirst({
    where: { title: "Marketing Executive" },
  });

  if (!position) {
    console.error(
      "Posisi demo 'Marketing Executive' tidak ditemukan. Harap jalankan 'npm run seed' terlebih dahulu."
    );
    process.exit(1);
  }

  const sampleDir = path.join(process.cwd(), "sample-cvs");
  if (!fs.existsSync(sampleDir)) {
    console.error("Folder sample-cvs belum ada. Jalankan 'npm run generate:sample-cvs'");
    process.exit(1);
  }

  const files = fs
    .readdirSync(sampleDir)
    .filter((f) => f.endsWith(".pdf") || f.endsWith(".docx"));

  console.log(`Ditemukan ${files.length} berkas sample CV untuk diuji ke posisi: ${position.title}\n`);

  for (const file of files) {
    const fullPath = path.join(sampleDir, file);
    const buffer = fs.readFileSync(fullPath);
    const fileHash = sha256(buffer);

    // Check duplicate
    const existing = await prisma.candidate.findFirst({ where: { fileHash } });
    if (existing) {
      console.log(`- Melewati ${file}: sudah pernah di-screen sebelumnya (ID: ${existing.id})`);
      continue;
    }

    console.log(`-> Sedang memproses screening AI untuk: ${file}...`);
    try {
      const doc = await parseCvDocument(buffer, file, "application/pdf");
      const candidate = await screenCandidateCv({
        fileBuffer: buffer,
        fileName: file,
        mimeType: "application/pdf",
        fileHash,
        extractedText: doc.textSnippet,
        positionId: position.id,
        source: "MANUAL_UPLOAD",
        emailSubject: `Lamaran Marketing Executive - ${file.replace(".pdf", "").replace("CV_", "").replace(/_/g, " ")}`,
        emailSender: `applicant-${file.slice(3, 10).toLowerCase()}@example.com`,
      });

      console.log(
        `   ✓ Selesai: ${candidate.name} | Skor: ${candidate.overallScore} | Status: ${candidate.status} | Aspek Terkuat: ${candidate.strongestAspect}`
      );
    } catch (err: any) {
      console.error(`   ✕ Gagal screening ${file}:`, err.message);
    }
  }

  console.log("\n=== Demo Screening Selesai! Buka dashboard http://localhost:3000 ===");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
