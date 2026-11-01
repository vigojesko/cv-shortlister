import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const GET = withTenant(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const job = await prisma.jobQueue.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: "Proses tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ status: job.status, error: job.lastError, candidateId: job.status === "COMPLETED" ? JSON.parse(job.payload).candidateId : null });
});
