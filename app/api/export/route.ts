import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "xlsx"; // xlsx | csv
    const positionId = searchParams.get("positionId");
    const shortlistOnly = searchParams.get("shortlistOnly") === "true";

    const where: any = {};
    if (positionId) where.positionId = positionId;
    if (shortlistOnly) where.status = "SHORTLIST";

    const candidates = await prisma.candidate.findMany({
      where,
      include: { position: true },
      orderBy: { overallScore: "desc" },
    });

    const rows = candidates.map((c) => {
      let links: any = {};
      try {
        links = JSON.parse(c.links || "{}");
      } catch {}

      const portfolioLinks = Array.isArray(links.portfolio)
        ? links.portfolio.join(", ")
        : "";

      return {
        "Nama Kandidat": c.name,
        Email: c.email,
        Telepon: c.phone || "-",
        Lokasi: c.location || "-",
        Posisi: c.position?.title || "Umum",
        "Skor Keseluruhan": c.overallScore,
        "Skor Skill": c.scoreSkills,
        "Skor Pengalaman": c.scoreExperience,
        "Skor Pendidikan": c.scoreEducation,
        "Skor Portofolio": c.scorePortfolio,
        "Status Shortlist": c.status,
        "Aspek Terkuat": c.strongestAspect,
        "Ringkasan CV": c.summary,
        "Ringkasan Portofolio": c.portfolioSummary,
        "Link Portofolio": portfolioLinks || links.linkedin || links.github || "-",
        "Sumber Lamaran": c.source,
        "Subjek Email": c.emailSubject || "-",
        "Tanggal Diterima": c.createdAt.toISOString().split("T")[0],
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kandidat");

    if (format === "csv") {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="shortlist_kandidat_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="shortlist_kandidat_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
