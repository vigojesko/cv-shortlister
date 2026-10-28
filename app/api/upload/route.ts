import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCvDocument } from "@/lib/parsers/document";
import { sha256 } from "@/lib/crypto";
import { screenCandidateCv } from "@/lib/screening/screener";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const positionId = formData.get("positionId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Berkas file CV tidak ditemukan dalam permintaan." },
        { status: 400 }
      );
    }

    // Limit size 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas melebihi batas maksimal 10 MB." },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Format berkas tidak didukung. Harap unggah PDF atau DOCX." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = sha256(buffer);

    // Duplicate check
    const existing = await prisma.candidate.findFirst({
      where: { fileHash },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Berkas CV ini sudah pernah diunggah/diproses sebelumnya (duplikat hash file).",
          candidateId: existing.id,
        },
        { status: 409 }
      );
    }

    const docInfo = await parseCvDocument(buffer, fileName, file.type);

    const candidate = await screenCandidateCv({
      fileBuffer: buffer,
      fileName,
      mimeType: docInfo.mimeType,
      fileHash,
      extractedText: docInfo.textSnippet,
      positionId: positionId || undefined,
      source: "MANUAL_UPLOAD",
    });

    return NextResponse.json({
      success: true,
      message: "Berkas CV berhasil diunggah dan dinilai oleh AI.",
      candidate,
    });
  } catch (err: any) {
    console.error("Gagal screening manual upload:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses berkas CV." },
      { status: 500 }
    );
  }
}
