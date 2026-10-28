import { NextResponse } from "next/server";
import { syncGmailEmails } from "@/lib/gmail/sync";

export async function POST() {
  try {
    const result = await syncGmailEmails();
    return NextResponse.json({
      success: true,
      message: "Proses sinkronisasi Gmail berhasil dijalankan.",
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Terjadi kesalahan saat sinkronisasi Gmail.",
      },
      { status: 500 }
    );
  }
}
