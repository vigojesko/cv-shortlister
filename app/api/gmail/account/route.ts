import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const select = { id: true, email: true, isConnected: true, lastSyncAt: true, lastErrorMessage: true, syncIntervalMinutes: true, backfillDays: true, lastResult: true };
export const dynamic = "force-dynamic";
export const GET = withTenant(async () => NextResponse.json({ account: await prisma.gmailAccount.findFirst({ select }) }));
export const PATCH = withTenant(async (request: NextRequest) => {
  const parsed = z.object({ syncIntervalMinutes: z.number().int().min(1).max(60), backfillDays: z.number().int().min(1).max(90) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Interval harus 1–60 menit dan rentang email 1–90 hari." }, { status: 400 });
  const account = await prisma.gmailAccount.findFirst();
  if (!account) return NextResponse.json({ error: "Hubungkan Gmail terlebih dahulu." }, { status: 404 });
  const updated = await prisma.gmailAccount.update({ where: { id: account.id }, data: { ...parsed.data, nextPageToken: null, scanAfter: null }, select });
  return NextResponse.json({ success: true, account: updated });
});
export const DELETE = withTenant(async () => {
  // Local token deletion immediately prevents subsequent scheduled access.
  await prisma.gmailAccount.deleteMany();
  return NextResponse.json({ success: true, message: "Gmail diputuskan. Anda juga dapat mencabut izin dari halaman keamanan Google." });
});
