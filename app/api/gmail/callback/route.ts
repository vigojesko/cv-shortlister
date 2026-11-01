import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.redirect(new URL("/login?reconnect=1", process.env.NEXTAUTH_URL!)); }
