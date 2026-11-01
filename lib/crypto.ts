import crypto from "crypto";

// Ensure a 32-byte key from ENCRYPTION_KEY env
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) throw new Error("ENCRYPTION_KEY harus 64 karakter heksadesimal.");
  if (secret.length === 64) {
    // Hex string
    return Buffer.from(secret, "hex");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export interface EncryptedData {
  encrypted: string; // hex
  iv: string;        // hex
  authTag: string;   // hex
}

/**
 * Encrypt string with AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 12 bytes recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypt string with AES-256-GCM
 */
export function decrypt(data: EncryptedData): string {
  const key = getKey();
  const iv = Buffer.from(data.iv, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(Buffer.from(data.authTag, "hex"));

  let decrypted = decipher.update(data.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash file buffer or string with SHA-256
 */
export function sha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
