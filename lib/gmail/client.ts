import { google } from "googleapis";
import { prisma } from "../prisma";
import { encrypt, decrypt } from "../crypto";



export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback";

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
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

    const gmail = google.gmail({ version: "v1", auth: oauth2Client, timeout: 30000 });
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
