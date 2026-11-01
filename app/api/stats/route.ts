import { withTenant } from "@/lib/api";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function handleGET() {
  try {
    const totalPositions = await prisma.position.count();
    const activePositions = await prisma.position.count({
      where: { isActive: true },
    });
    const totalCandidates = await prisma.candidate.count();
    const shortlistedCandidates = await prisma.candidate.count({
      where: { status: "SHORTLIST" },
    });
    const needsReviewCandidates = await prisma.candidate.count({
      where: { status: "NEEDS_HR_REVIEW" },
    });
    const totalProcessedEmails = await prisma.processedEmail.count();

    const gmailAccount = await prisma.gmailAccount.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        email: true,
        isConnected: true,
        lastSyncAt: true,
        lastErrorMessage: true,
      },
    });

    const recentCandidates = await prisma.candidate.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        position: { select: { title: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalPositions,
        activePositions,
        totalCandidates,
        shortlistedCandidates,
        needsReviewCandidates,
        totalProcessedEmails,
      },
      gmailAccount,
      recentCandidates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withTenant(handleGET);
export const dynamic = "force-dynamic";
