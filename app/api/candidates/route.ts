import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get("positionId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (positionId) where.positionId = positionId;
    if (status) {
      if (status === "NEEDS_REVIEW") {
        where.status = "NEEDS_HR_REVIEW";
      } else {
        where.status = status;
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        position: {
          select: { id: true, title: true, department: true },
        },
      },
      orderBy: { overallScore: "desc" },
    });

    const formatted = candidates.map((c) => ({
      ...c,
      educationList: JSON.parse(c.educationList || "[]"),
      links: JSON.parse(c.links || "{}"),
      mustHaveResults: JSON.parse(c.mustHaveResults || "[]"),
      niceToHaveResults: JSON.parse(c.niceToHaveResults || "[]"),
      strengths: JSON.parse(c.strengths || "[]"),
      gaps: JSON.parse(c.gaps || "[]"),
    }));

    return NextResponse.json({ candidates: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
