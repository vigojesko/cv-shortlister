import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const original = await prisma.position.findUnique({
      where: { id: params.id },
    });

    if (!original) {
      return NextResponse.json(
        { error: "Posisi yang ingin diduplikasi tidak ditemukan." },
        { status: 404 }
      );
    }

    const duplicated = await prisma.position.create({
      data: {
        title: `${original.title} (Salinan)`,
        department: original.department,
        location: original.location,
        description: original.description,
        mustHaveRequirements: original.mustHaveRequirements,
        niceToHaveRequirements: original.niceToHaveRequirements,
        minExperienceYears: original.minExperienceYears,
        minEducation: original.minEducation,
        emailKeywords: original.emailKeywords,
        emailLabels: original.emailLabels,
        weightSkills: original.weightSkills,
        weightExperience: original.weightExperience,
        weightEducation: original.weightEducation,
        weightPortfolio: original.weightPortfolio,
        shortlistRuleType: original.shortlistRuleType,
        shortlistThreshold: original.shortlistThreshold,
        shortlistTopN: original.shortlistTopN,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, position: duplicated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
