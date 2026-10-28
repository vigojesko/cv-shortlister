import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PositionCreateSchema = z.object({
  title: z.string().min(2, "Judul posisi minimal 2 karakter"),
  department: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  mustHaveRequirements: z.array(z.string()).min(1, "Minimal 1 must-have requirement"),
  niceToHaveRequirements: z.array(z.string()).default([]),
  minExperienceYears: z.number().min(0).default(0),
  minEducation: z.string().default("SMA/SMK"),
  emailKeywords: z.array(z.string()).min(1, "Minimal 1 kata kunci subjek"),
  emailLabels: z.string().optional().nullable(),
  weightSkills: z.number().min(0).max(100).default(35),
  weightExperience: z.number().min(0).max(100).default(30),
  weightEducation: z.number().min(0).max(100).default(15),
  weightPortfolio: z.number().min(0).max(100).default(20),
  shortlistRuleType: z.enum(["THRESHOLD", "TOP_N"]).default("THRESHOLD"),
  shortlistThreshold: z.number().min(0).max(100).default(70),
  shortlistTopN: z.number().min(1).default(5),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    const parsed = positions.map((p) => ({
      ...p,
      mustHaveRequirements: JSON.parse(p.mustHaveRequirements || "[]"),
      niceToHaveRequirements: JSON.parse(p.niceToHaveRequirements || "[]"),
      emailKeywords: JSON.parse(p.emailKeywords || "[]"),
    }));

    return NextResponse.json({ positions: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = PositionCreateSchema.parse(json);

    // Verify weights sum to 100
    const totalWeight =
      validated.weightSkills +
      validated.weightExperience +
      validated.weightEducation +
      validated.weightPortfolio;

    if (totalWeight !== 100) {
      return NextResponse.json(
        {
          error: `Total bobot penilaian harus tepat 100%. Saat ini: ${totalWeight}%`,
        },
        { status: 400 }
      );
    }

    const position = await prisma.position.create({
      data: {
        title: validated.title,
        department: validated.department,
        location: validated.location,
        description: validated.description,
        mustHaveRequirements: JSON.stringify(validated.mustHaveRequirements),
        niceToHaveRequirements: JSON.stringify(validated.niceToHaveRequirements),
        minExperienceYears: validated.minExperienceYears,
        minEducation: validated.minEducation,
        emailKeywords: JSON.stringify(validated.emailKeywords),
        emailLabels: validated.emailLabels,
        weightSkills: validated.weightSkills,
        weightExperience: validated.weightExperience,
        weightEducation: validated.weightEducation,
        weightPortfolio: validated.weightPortfolio,
        shortlistRuleType: validated.shortlistRuleType,
        shortlistThreshold: validated.shortlistThreshold,
        shortlistTopN: validated.shortlistTopN,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan posisi baru." },
      { status: 400 }
    );
  }
}
