import { NextResponse } from "next/server";
import { withTenant } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { tenantId } from "@/lib/tenant-context";
import { kickWorker } from "@/lib/worker";
export const POST = withTenant(async () => {
  if (!await prisma.gmailAccount.findFirst({ where: { isConnected: true } })) return NextResponse.json({ error: "Hubungkan ulang Gmail lewat Masuk dengan Google." }, { status: 400 });
  if (!await prisma.position.count({ where: { isActive: true } })) return NextResponse.json({ error: "Buat posisi aktif terlebih dahulu." }, { status: 400 });
  try { await kickWorker(tenantId(), true); }
  catch { return NextResponse.json({ error: "Worker belum siap. Periksa konfigurasi Netlify." }, { status: 503 }); }
  return NextResponse.json({ success: true, queued: true, message: "Sinkronisasi diminta. Hasilnya akan muncul otomatis setelah diproses." }, { status: 202 });
});
