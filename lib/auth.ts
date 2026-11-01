import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { google } from "googleapis";
import { adminPrisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    authorization: { params: {
      scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
      access_type: "offline", prompt: "consent", response_type: "code"
    } }
  })],
  callbacks: {
    async signIn({ account, profile }) {
      const p = profile as { email?: string; email_verified?: boolean; sub?: string; name?: string };
      if (account?.provider !== "google" || !p.email_verified || !p.email || !p.sub || !account.access_token) return false;
      const email = p.email.toLowerCase();
      const allowed = (process.env.ALLOWED_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      if (allowed.length && !allowed.includes(email)) return "/login?error=NotInvited";
      if (!account.scope?.split(" ").includes("https://www.googleapis.com/auth/gmail.readonly")) return "/login?error=GmailPermission";
      const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth.setCredentials({ access_token: account.access_token });
      try { await google.gmail({ version: "v1", auth: oauth, timeout: 30000 }).users.getProfile({ userId: "me" }); }
      catch { return "/login?error=GmailUnavailable"; }
      const existing = await adminPrisma.user.findUnique({ where: { email } });
      if (existing?.googleSubject && existing.googleSubject !== p.sub) return false;
      const user = await adminPrisma.user.upsert({ where: { email },
        update: { googleSubject: p.sub, name: p.name },
        create: { email, googleSubject: p.sub, name: p.name, role: "user" }
      });
      const previous = await adminPrisma.gmailAccount.findUnique({ where: { ownerId: user.id } });
      let refreshToken = account.refresh_token;
      if (!refreshToken && previous) {
        try { refreshToken = JSON.parse(decrypt({ encrypted: previous.encryptedToken, iv: previous.iv, authTag: previous.authTag })).refresh_token; } catch {}
      }
      if (!refreshToken) return "/login?error=Reconnect";
      const encrypted = encrypt(JSON.stringify({ access_token: account.access_token, refresh_token: refreshToken, expiry_date: (account.expires_at || 0) * 1000 }));
      const data = { email, encryptedToken: encrypted.encrypted, iv: encrypted.iv, authTag: encrypted.authTag, isConnected: true, lastErrorMessage: null };
      await adminPrisma.gmailAccount.upsert({ where: { ownerId: user.id }, update: data,
        create: { ...data, ownerId: user.id, syncIntervalMinutes: 1, backfillDays: 14 } });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        const user = await adminPrisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
        if (!user) throw new Error("Akun belum tersedia.");
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
