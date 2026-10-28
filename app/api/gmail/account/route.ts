import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const account = await prisma.gmailAccount.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        email: true,
        isConnected: true,
        lastSyncAt: true,
        lastErrorMessage: true,
        syncIntervalMinutes: true,
        backfillDays: true,
      },
    });

    return NextResponse.json({ account: account || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const account = await prisma.gmailAccount.findFirst();

    if (!account) {
      return NextResponse.json(
        { error: "Belum ada akun Gmail yang tersimpan." },
        { status: 404 }
      );
    }

    const updated = await prisma.gmailAccount.update({
      where: { id: account.id },
      data: {
        syncIntervalMinutes:
          body.syncIntervalMinutes !== undefined
            ? parseInt(body.syncIntervalMinutes, 10)
            : account.syncIntervalMinutes,
        backfillDays:
          body.backfillDays !== undefined
            ? parseInt(body.backfillDays, 10)
            : account.backfillDays,
      },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.gmailAccount.deleteMany();
    return NextResponse.json({
      success: true,
      message: "Akun Gmail berhasil diputuskan.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
