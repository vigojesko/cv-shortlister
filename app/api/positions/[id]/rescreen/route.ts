import { NextRequest, NextResponse } from "next/server";
import { rescreenPositionCandidates } from "@/lib/screening/screener";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const count = await rescreenPositionCandidates(params.id);
    return NextResponse.json({
      success: true,
      message: `Proses re-screen berhasil dilakukan pada ${count} berkas CV.`,
      count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Gagal melakukan re-screen." },
      { status: 500 }
    );
  }
}
