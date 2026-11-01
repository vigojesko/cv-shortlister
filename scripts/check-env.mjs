const required = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET", "ENCRYPTION_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GEMINI_API_KEY", "WORKER_SECRET"];
const missing = required.filter(key => !process.env[key]);
if (missing.length) { console.error("Isi Environment Variables Netlify terlebih dahulu: " + missing.join(", ")); process.exit(1); }
if (!/^[a-f0-9]{64}$/i.test(process.env.ENCRYPTION_KEY) || process.env.WORKER_SECRET.length < 32 || process.env.NEXTAUTH_SECRET.length < 32) { console.error("Secret belum valid. Jalankan npm run secrets."); process.exit(1); }
if (!process.env.NEXTAUTH_URL.startsWith("https://")) { console.error("NEXTAUTH_URL deployment harus HTTPS."); process.exit(1); }
