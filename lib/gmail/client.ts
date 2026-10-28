import { google } from "googleapis";
import { prisma } from "../prisma";
import { encrypt, decrypt } from "../crypto";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensure refresh token is returned
    scope: SCOPES,
  });
}

/**
 * Exchange auth code for tokens and save to database
 */
export async function handleOAuthCallback(code: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user profile email
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const profileRes = await gmail.users.getProfile({ userId: "me" });
  const email = profileRes.data.emailAddress;

  if (!email) {
    throw new Error("Gagal mengambil email akun Gmail dari profil Google.");
  }

  // Encrypt tokens
  const tokenString = JSON.stringify(tokens);
  const encrypted = encrypt(tokenString);

  // Upsert into GmailAccount
  await prisma.gmailAccount.upsert({
    where: { email },
    update: {
      encryptedToken: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      isConnected: true,
      lastErrorMessage: null,
    },
    create: {
      email,
      encryptedToken: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      isConnected: true,
      syncIntervalMinutes: parseInt(
        process.env.SYNC_INTERVAL_MINUTES || "15",
        10
      ),
      backfillDays: 14,
    },
  });

  return email;
}

/**
 * Load authenticated OAuth2 client for an account from database
 */
export async function getAuthenticatedGmailClient(accountIdOrEmail?: string) {
  const account = accountIdOrEmail
    ? await prisma.gmailAccount.findFirst({
        where: {
          OR: [{ id: accountIdOrEmail }, { email: accountIdOrEmail }],
        },
      })
    : await prisma.gmailAccount.findFirst({
        where: { isConnected: true },
        orderBy: { updatedAt: "desc" },
      });

  if (!account) {
    throw new Error("Tidak ada akun Gmail yang terhubung.");
  }

  try {
    const decryptedTokensStr = decrypt({
      encrypted: account.encryptedToken,
      iv: account.iv,
      authTag: account.authTag,
    });
    const tokens = JSON.parse(decryptedTokensStr);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Listen for new refreshed tokens and save back
    oauth2Client.on("tokens", async (newTokens) => {
      const mergedTokens = { ...tokens, ...newTokens };
      const reEncrypted = encrypt(JSON.stringify(mergedTokens));
      await prisma.gmailAccount.update({
        where: { id: account.id },
        data: {
          encryptedToken: reEncrypted.encrypted,
          iv: reEncrypted.iv,
          authTag: reEncrypted.authTag,
          isConnected: true,
          lastErrorMessage: null,
        },
      });
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    return { gmail, account, oauth2Client };
  } catch (err: any) {
    // Flag account as disconnected if token error
    await prisma.gmailAccount.update({
      where: { id: account.id },
      data: {
        isConnected: false,
        lastErrorMessage: `Gagal mengautentikasi Gmail token: ${err.message}`,
      },
    });
    throw new Error(`Koneksi Gmail terputus atau token tidak valid: ${err.message}`);
  }
}
