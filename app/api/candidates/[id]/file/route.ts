import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
    });

    if (!candidate || !candidate.filePath || !fs.existsSync(candidate.filePath)) {
      return NextResponse.json(
        { error: "Berkas CV fisik tidak ditemukan di server." },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(candidate.filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": candidate.fileMimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${candidate.fileName || "cv.pdf"}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
