import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/gmail/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(`Otorisasi Gmail ditolak: ${error}`)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent("Kode otorisasi tidak ditemukan.")}`
    );
  }

  try {
    const connectedEmail = await handleOAuthCallback(code);
    return NextResponse.redirect(
      `${baseUrl}/settings?success=${encodeURIComponent(`Berhasil menghubungkan akun Gmail: ${connectedEmail}`)}`
    );
  } catch (err: any) {
    console.error("Gagal menukar token Gmail OAuth:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(`Gagal menghubungkan Gmail: ${err.message}`)}`
    );
  }
}
