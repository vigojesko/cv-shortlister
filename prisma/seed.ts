import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database CV Shortlister...");

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || "admin@cvshortlister.local";
  const rawPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    update: {
      password: hashedPassword,
    },
    create: {
      email: adminEmail.toLowerCase().trim(),
      name: "HR Administrator",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Admin user berhasil di-seed: ${admin.email}`);

  // 2. Seed Demo Position: "Marketing Executive"
  const positionTitle = "Marketing Executive";
  const existingPos = await prisma.position.findFirst({
    where: { title: positionTitle },
  });

  if (!existingPos) {
    const demoPosition = await prisma.position.create({
      data: {
        title: positionTitle,
        department: "Growth & Marketing",
        location: "Jakarta (Hybrid)",
        description: `Kami mencari Marketing Executive yang berpengalaman dalam merancang, mengeksekusi, dan mengoptimasi kampanye digital marketing (Meta Ads, Google Ads, SEO, dan Content Marketing) untuk meningkatkan akuisisi pelanggan dan kesadaran merek. Kandidat bertanggung jawab atas alokasi budget iklan, analisis metrik CPA/ROAS, serta memimpin kolaborasi bersama tim kreatif.`,
        mustHaveRequirements: JSON.stringify([
          "Pengalaman kerja minimal 2 tahun di bidang Digital Marketing atau Brand Marketing.",
          "Mampu mengelola dan mengoptimalkan kampanye paid advertising (Google Ads atau Meta Ads).",
          "Keahlian analisis metrik pemasaran (ROAS, CPA, CTR, Google Analytics/GA4).",
          "Pendidikan formal minimal S1 / Sarjana (diutamakan Manajemen, Ilmu Komunikasi, atau bidang terkait).",
        ]),
        niceToHaveRequirements: JSON.stringify([
          "Memiliki sertifikasi resmi Google Ads atau HubSpot Inbound Marketing.",
          "Portofolio kampanye pemasaran dengan pertumbuhan konversi nyata terlampir.",
          "Pengalaman bekerja pada industri startup teknologi atau B2B SaaS.",
        ]),
        minExperienceYears: 2,
        minEducation: "S1 / Sarjana",
        emailKeywords: JSON.stringify([
          "Marketing Executive",
          "Lamaran Marketing Executive",
          "Digital Marketing Executive",
        ]),
        emailLabels: "HR/Marketing",
        weightSkills: 35,
        weightExperience: 30,
        weightEducation: 15,
        weightPortfolio: 20,
        shortlistRuleType: "THRESHOLD",
        shortlistThreshold: 70.0,
        shortlistTopN: 5,
        isActive: true,
      },
    });

    console.log(`Demo position berhasil dibuat: ${demoPosition.title} (ID: ${demoPosition.id})`);
  } else {
    console.log(`Demo position "${positionTitle}" sudah ada.`);
  }

  console.log("Seeding selesai dengan sukses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
