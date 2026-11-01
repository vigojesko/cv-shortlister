import { withTenant } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PositionCreateSchema } from "@/lib/position-validation";



async function handleGET() {
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

async function handlePOST(request: NextRequest) {
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

export const GET = withTenant(handleGET);
export const POST = withTenant(handlePOST);
export const dynamic = "force-dynamic";
