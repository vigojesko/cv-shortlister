import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        position: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Kandidat tidak ditemukan." },
        { status: 404 }
      );
    }

    const formatted = {
      ...candidate,
      educationList: JSON.parse(candidate.educationList || "[]"),
      links: JSON.parse(candidate.links || "{}"),
      mustHaveResults: JSON.parse(candidate.mustHaveResults || "[]"),
      niceToHaveResults: JSON.parse(candidate.niceToHaveResults || "[]"),
      strengths: JSON.parse(candidate.strengths || "[]"),
      gaps: JSON.parse(candidate.gaps || "[]"),
      position: candidate.position
        ? {
            ...candidate.position,
            mustHaveRequirements: JSON.parse(
              candidate.position.mustHaveRequirements || "[]"
            ),
            niceToHaveRequirements: JSON.parse(
              candidate.position.niceToHaveRequirements || "[]"
            ),
          }
        : null,
    };

    return NextResponse.json({ candidate: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;
      dataToUpdate.isManualOverride = true;
    }
    if (body.hrNotes !== undefined) {
      dataToUpdate.hrNotes = body.hrNotes;
    }
    if (body.positionId !== undefined) {
      dataToUpdate.positionId = body.positionId;
    }

    const updated = await prisma.candidate.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, candidate: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.candidate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Data kandidat berhasil dihapus secara permanen.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
