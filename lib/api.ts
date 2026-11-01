import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { runAsTenant } from "./tenant-context";
export function withTenant<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: any[]) => {
    const session = await getServerSession(authOptions);
    const id = (session?.user as any)?.id;
    if (!id) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    const req = args[0] as Request | undefined;
    if (req && !["GET", "HEAD"].includes(req.method)) {
      const origin = req.headers.get("origin");
      if (!origin || origin !== new URL(process.env.NEXTAUTH_URL!).origin)
        return NextResponse.json({ error: "Asal permintaan tidak valid." }, { status: 403 });
    }
    const response = await runAsTenant(id, () => handler(...args));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }) as T;
}
