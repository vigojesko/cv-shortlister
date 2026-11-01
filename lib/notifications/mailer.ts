import nodemailer from "nodemailer";
import { prisma } from "../prisma";

export async function sendShortlistNotificationEmail(): Promise<boolean> {
  if (process.env.ENABLE_EMAIL_DIGEST !== "true") return false;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const toEmail = (await prisma.gmailAccount.findFirst({ select: { email: true } }))?.email;
  const from = process.env.SMTP_FROM || "noreply@cvshortlister.local";

  if (!host || !user || !pass || !toEmail) {
    // SMTP not configured, safely skip
    return false;
  }

  // Find newly shortlisted candidates in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const candidates = await prisma.candidate.findMany({
    where: {
      status: "SHORTLIST",
      createdAt: { gte: oneDayAgo },
    },
    include: { position: true },
    orderBy: { overallScore: "desc" },
    take: 10,
  });

  if (candidates.length === 0) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const candidateRows = candidates
    .map(
      (c) =>
        `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><b>${c.name}</b><br/><small>${c.email}</small></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${c.position?.title || "Umum"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: #16a34a;">${c.overallScore}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${c.strongestAspect}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e293b; margin-top: 0;">Ringkasan Kandidat Shortlist Baru</h2>
      <p style="color: #64748b;">Halo Tim HR, berikut adalah kandidat pelamar yang otomatis lolos kualifikasi shortlist hari ini:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Kandidat</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Posisi</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Skor</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Aspek Terkuat</th>
          </tr>
        </thead>
        <tbody>
          ${candidateRows}
        </tbody>
      </table>

      <p style="margin-top: 24px;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/candidates" 
           style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; display: inline-block;">
          Buka Dashboard CV Shortlister
        </a>
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `[CV Shortlister] ${candidates.length} Kandidat Baru Masuk Shortlist`,
      html,
    });
    console.log("Notifikasi email shortlist berhasil dikirim ke", toEmail);
    return true;
  } catch (err: any) {
    console.warn("Gagal mengirim email notifikasi SMTP:", err.message);
    return false;
  }
}
