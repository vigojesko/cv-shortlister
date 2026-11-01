import { withTenant } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCvDocument } from "@/lib/parsers/document";
import { sha256 } from "@/lib/crypto";
import { enqueueScreening } from "@/lib/worker";
import { storeFile } from "@/lib/files";

export const dynamic = "force-dynamic";

async function handlePOST(request: NextRequest) {
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
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran berkas melebihi batas maksimal 3 MB." },
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

    if (!positionId || !await prisma.position.findUnique({ where: { id: positionId } })) return NextResponse.json({ error: "Pilih posisi milik akun Anda terlebih dahulu." }, { status: 400 });
    if (await prisma.jobQueue.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }) >= 50) return NextResponse.json({ error: "Antrean penuh. Tunggu CV sebelumnya selesai." }, { status: 429 });
    const fileId = await storeFile(buffer);
    const job = await enqueueScreening({ fileId, fileName, mimeType: docInfo.mimeType, fileHash, positionId, source: "MANUAL_UPLOAD" }, positionId);
    return NextResponse.json({ success: true, jobId: job.id, message: "CV masuk antrean penilaian." }, { status: 202 });

  } catch (err: any) {
    console.error("Gagal screening manual upload:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses berkas CV." },
      { status: 500 }
    );
  }
}

export const POST = withTenant(handlePOST);
