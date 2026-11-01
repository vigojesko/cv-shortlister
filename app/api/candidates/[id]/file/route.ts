import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { readFile } from "@/lib/files";
export const dynamic = "force-dynamic";
export const GET = withTenant(async (_request: NextRequest, { params }: { params: { id: string } }) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
  if (!candidate?.filePath) return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  const buffer = await readFile(candidate.filePath);
  // Streaming avoids the buffered Lambda response limit for Gmail attachments.
  const stream = new ReadableStream({ start(controller) {
    for (let i = 0; i < buffer.length; i += 65536) controller.enqueue(new Uint8Array(buffer.subarray(i, i + 65536)));
    controller.close();
  } });
  return new NextResponse(stream, { headers: {
    "Content-Type": candidate.fileMimeType,
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(candidate.fileName)}`,
    "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store"
  } });
});
