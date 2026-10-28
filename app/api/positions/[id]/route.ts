import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          orderBy: { overallScore: "desc" },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Posisi tidak ditemukan." },
        { status: 404 }
      );
    }

    const formatted = {
      ...position,
      mustHaveRequirements: JSON.parse(position.mustHaveRequirements || "[]"),
      niceToHaveRequirements: JSON.parse(
        position.niceToHaveRequirements || "[]"
      ),
      emailKeywords: JSON.parse(position.emailKeywords || "[]"),
      candidates: position.candidates.map((c) => ({
        ...c,
        educationList: JSON.parse(c.educationList || "[]"),
        links: JSON.parse(c.links || "{}"),
        mustHaveResults: JSON.parse(c.mustHaveResults || "[]"),
        niceToHaveResults: JSON.parse(c.niceToHaveResults || "[]"),
        strengths: JSON.parse(c.strengths || "[]"),
        gaps: JSON.parse(c.gaps || "[]"),
      })),
    };

    return NextResponse.json({ position: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.department !== undefined) dataToUpdate.department = body.department;
    if (body.location !== undefined) dataToUpdate.location = body.location;
    if (body.description !== undefined)
      dataToUpdate.description = body.description;
    if (body.mustHaveRequirements !== undefined)
      dataToUpdate.mustHaveRequirements = JSON.stringify(
        body.mustHaveRequirements
      );
    if (body.niceToHaveRequirements !== undefined)
      dataToUpdate.niceToHaveRequirements = JSON.stringify(
        body.niceToHaveRequirements
      );
    if (body.minExperienceYears !== undefined)
      dataToUpdate.minExperienceYears = Number(body.minExperienceYears);
    if (body.minEducation !== undefined)
      dataToUpdate.minEducation = body.minEducation;
    if (body.emailKeywords !== undefined)
      dataToUpdate.emailKeywords = JSON.stringify(body.emailKeywords);
    if (body.emailLabels !== undefined)
      dataToUpdate.emailLabels = body.emailLabels;
    if (body.weightSkills !== undefined)
      dataToUpdate.weightSkills = Number(body.weightSkills);
    if (body.weightExperience !== undefined)
      dataToUpdate.weightExperience = Number(body.weightExperience);
    if (body.weightEducation !== undefined)
      dataToUpdate.weightEducation = Number(body.weightEducation);
    if (body.weightPortfolio !== undefined)
      dataToUpdate.weightPortfolio = Number(body.weightPortfolio);
    if (body.shortlistRuleType !== undefined)
      dataToUpdate.shortlistRuleType = body.shortlistRuleType;
    if (body.shortlistThreshold !== undefined)
      dataToUpdate.shortlistThreshold = Number(body.shortlistThreshold);
    if (body.shortlistTopN !== undefined)
      dataToUpdate.shortlistTopN = Number(body.shortlistTopN);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    const updated = await prisma.position.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, position: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete candidates and position
    await prisma.candidate.deleteMany({ where: { positionId: params.id } });
    await prisma.position.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      message: "Posisi dan seluruh data kandidat terkait berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
