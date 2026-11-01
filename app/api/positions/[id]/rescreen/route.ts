import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { kickWorker } from "@/lib/worker";
import { tenantId } from "@/lib/tenant-context";
export const POST = withTenant(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  if (!await prisma.position.findUnique({ where: { id: params.id } })) return NextResponse.json({ error: "Posisi tidak ditemukan." }, { status: 404 });
  const candidates = await prisma.candidate.findMany({ where: { positionId: params.id } });
  const jobs = candidates.filter(c => c.filePath).map(c => ({ type: "SCREEN_CV", positionId: params.id, payload: JSON.stringify({ fileId: c.filePath, fileName: c.fileName, mimeType: c.fileMimeType, fileHash: c.fileHash, positionId: params.id, source: c.source,
    existingCandidateId: c.id, gmailMessageId: c.gmailMessageId, emailSubject: c.emailSubject, emailSender: c.emailSender, emailDate: c.emailDate }) }));
  await prisma.jobQueue.createMany({ data: jobs });
  await kickWorker(tenantId()).catch(() => {});
  return NextResponse.json({ success: true, queued: true, count: jobs.length, message: `${jobs.length} CV masuk antrean penilaian ulang. Hasil lama tetap tersedia selama diproses.` }, { status: 202 });
});
