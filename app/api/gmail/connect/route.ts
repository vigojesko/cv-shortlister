import { NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/gmail/client";

export async function GET() {
  try {
    const url = generateAuthUrl();
    return NextResponse.redirect(url);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Gagal membuat URL OAuth: ${err.message}` },
      { status: 500 }
    );
  }
}
