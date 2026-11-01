import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { encode } from "next-auth/jwt";
import { google } from "googleapis";
import { adminPrisma, prisma } from "../lib/prisma";
import { runAsTenant } from "../lib/tenant-context";
import { storeFile, readFile } from "../lib/files";
import { encrypt, sha256 } from "../lib/crypto";
import { syncGmailEmails } from "../lib/gmail/sync";
import { screenCandidateCv } from "../lib/screening/screener";
import { runWorker } from "../lib/worker";
import { aiProvider } from "../lib/ai/gemini";
import { authOptions } from "../lib/auth";
if (process.env.CV_TEST_DATABASE !== "1") throw new Error("Use a disposable PostgreSQL database and set CV_TEST_DATABASE=1.");
const prefix = "test-" + randomUUID();
const A = prefix + "-A", B = prefix + "-B";
let pa: string, pb: string, fileId: string;
const originalAI = aiProvider.generateStructured.bind(aiProvider);
const originalGmail = google.gmail;
const aiResult = { candidate: { name: "Test Candidate", email: "candidate@example.invalid", phone: "", location: "", total_experience_years: 3, education: [], links: {} }, scores: { skills: 80, experience: 70, education: 90, portfolio: 60 }, must_have_check: [{ requirement: "React", met: true, evidence: "React project" }], nice_to_have_check: [], summary: "Fixture", portfolio_summary: "Fixture", strengths: ["React"], gaps: [], strongest_aspect: "skills", recommendation: "SHORTLIST", reasoning: "Fixture" };
const position = { title: "Developer", description: "Develop software", mustHaveRequirements: '["React"]', niceToHaveRequirements: '[]', emailKeywords: '["LAMAR-FE"]' };
before(async () => {
  process.env.ENCRYPTION_KEY = "b".repeat(64);
  await adminPrisma.user.createMany({ data: [{ id: A, email: A + "@example.invalid" }, { id: B, email: B + "@example.invalid" }] });
  pa = (await runAsTenant(A, () => prisma.position.create({ data: position }))).id;
  pb = (await runAsTenant(B, () => prisma.position.create({ data: position }))).id;
});
after(async () => {
  (google as any).gmail = originalGmail;
  aiProvider.generateStructured = originalAI;
  for (const model of ["candidate", "jobQueue", "storedFile", "processedEmail", "gmailAccount", "position", "workerLease"] as const) await (adminPrisma[model] as any).deleteMany({ where: { ownerId: { startsWith: prefix } } });
  await adminPrisma.user.deleteMany({ where: { id: { startsWith: prefix } } });
  await adminPrisma.$disconnect();
});
test("database reads and writes cannot escape owner context", async () => {
  await assert.rejects(prisma.position.findMany());
  await runAsTenant(A, async () => {
    assert.equal(await prisma.position.count(), 1);
    assert.equal(await prisma.position.findUnique({ where: { id: pb } }), null);
    assert.equal((await prisma.position.findMany({ where: { ownerId: B } }))[0].id, pa);
    await assert.rejects(prisma.position.update({ where: { id: pb }, data: { title: "hijack" } }));
    assert.equal((await prisma.position.deleteMany({ where: { id: pb } })).count, 0);
    await assert.rejects(prisma.jobQueue.create({ data: { type: "SCREEN_CV", payload: "{}", positionId: pb } }));
  });
  assert.equal((await adminPrisma.position.findUnique({ where: { id: pb } }))?.title, "Developer");
});
test("files survive new clients and cannot be downloaded across owners", async () => {
  fileId = await runAsTenant(A, () => storeFile(Buffer.from("%PDF-test")));
  assert.equal((await runAsTenant(A, () => readFile(fileId))).toString(), "%PDF-test");
  await assert.rejects(runAsTenant(B, () => readFile(fileId)));
});
test("Gmail pagination, owner-specific duplicates and repeat-sync idempotency", async () => {
  aiProvider.generateStructured = async () => aiResult as any;
  const tokens = encrypt(JSON.stringify({ access_token: "fixture", refresh_token: "fixture", expiry_date: Date.now() + 3600000 }));
  for (const owner of [A, B]) await runAsTenant(owner, () => prisma.gmailAccount.create({ data: { email: owner + "@example.invalid", encryptedToken: tokens.encrypted, iv: tokens.iv, authTag: tokens.authTag, syncIntervalMinutes: 60 } }));
  let pages = 0;
  (google as any).gmail = () => ({ users: { messages: {
    list: async ({ pageToken }: any) => { pages++; return { data: pageToken ? { messages: [{ id: "duplicate-message" }] } : { messages: [{ id: "new-message" }], nextPageToken: "page-2" } }; },
    get: async () => ({ data: { payload: { headers: [{ name: "Subject", value: "LAMAR-FE Test" }], parts: [{ filename: "CV.pdf", mimeType: "application/pdf", body: { attachmentId: "a" } }] } } }),
    attachments: { get: async () => ({ data: { data: Buffer.from("%PDF-fixture-gmail").toString("base64") } }) }
  } } });
  const first = await runAsTenant(A, syncGmailEmails);
  assert.equal(first.processedCount, 1); assert.equal(first.skippedCount, 1); assert.equal(first.failedCount, 0); assert.equal(pages, 2);
  assert.equal((await runAsTenant(A, syncGmailEmails)).processedCount, 0);
  assert.equal((await runAsTenant(B, syncGmailEmails)).processedCount, 1);
  const a = await runAsTenant(A, () => prisma.candidate.findFirst());
  assert.equal(a?.positionId, pa); assert.equal(a?.overallScore, 74.5);
  assert.equal((await runAsTenant(B, () => prisma.candidate.findFirst()))?.positionId, pb);
});
test("worker processes durable upload and rejects concurrent lease", async () => {
  aiProvider.generateStructured = async () => { await new Promise(r => setTimeout(r, 100)); return aiResult as any; };
  await runAsTenant(A, () => prisma.gmailAccount.updateMany({ data: { lastSyncAt: new Date() } }));
  const fileId = await runAsTenant(A, () => storeFile(Buffer.from("%PDF-upload")));
  const job = await runAsTenant(A, () => prisma.jobQueue.create({ data: { type: "SCREEN_CV", positionId: pa, payload: JSON.stringify({ fileId, fileName: "upload.pdf", mimeType: "application/pdf", fileHash: sha256(Buffer.from("%PDF-upload")), positionId: pa, source: "MANUAL_UPLOAD" }) } }));
  await adminPrisma.workerLease.create({ data: { ownerId: A, token: "busy", expiresAt: new Date(Date.now() + 60000) } });
  assert.equal(await runWorker(A), false);
  await adminPrisma.workerLease.delete({ where: { ownerId: A } });
  assert.equal(await runWorker(A), true);
  assert.equal((await adminPrisma.jobQueue.findUnique({ where: { id: job.id } }))?.status, "COMPLETED");
});
test("rescreen Top-N excludes the candidate's old score from its own rank", async () => {
  aiProvider.generateStructured = async () => aiResult as any;
  await runAsTenant(A, async () => {
    const candidates = await prisma.candidate.findMany();
    await prisma.position.update({ where: { id: pa }, data: { shortlistRuleType: "TOP_N", shortlistTopN: 2 } });
    const c = candidates[0];
    await prisma.candidate.update({ where: { id: c.id }, data: { overallScore: 95 } });
    await prisma.candidate.update({ where: { id: candidates[1].id }, data: { overallScore: 88 } });
    const result = await screenCandidateCv({ existingCandidateId: c.id, fileId: c.filePath!, fileBuffer: await readFile(c.filePath!), fileName: c.fileName, mimeType: c.fileMimeType, fileHash: c.fileHash, positionId: pa, source: "GMAIL" });
    assert.equal(result.status, "SHORTLIST");
    assert.equal(await prisma.candidate.count(), 2);
    await prisma.position.update({ where: { id: pa }, data: { shortlistRuleType: "THRESHOLD" } });
  });
});
test("failed rescreen keeps previous candidate and retries safely", async () => {
  const c = await runAsTenant(A, () => prisma.candidate.findFirst());
  aiProvider.generateStructured = async () => { throw new Error("Fixture provider failure"); };
  const job = await runAsTenant(A, () => prisma.jobQueue.create({ data: { type: "SCREEN_CV", positionId: pa, payload: JSON.stringify({ fileId: c!.filePath, fileName: c!.fileName, mimeType: c!.fileMimeType, fileHash: c!.fileHash, existingCandidateId: c!.id, positionId: pa, source: c!.source }) } }));
  await runWorker(A);
  assert.equal((await adminPrisma.candidate.findUnique({ where: { id: c!.id } }))?.overallScore, c!.overallScore);
  assert.equal((await adminPrisma.jobQueue.findUnique({ where: { id: job.id } }))?.status, "PENDING");
  await runWorker(A); await runWorker(A);
  assert.equal((await adminPrisma.jobQueue.findUnique({ where: { id: job.id } }))?.status, "FAILED");
});
test("OAuth verifies email and consent then creates account with encrypted tokens", async () => {
  const signIn = authOptions.callbacks!.signIn!;
  assert.equal(await signIn({ account: { provider: "google" }, profile: { email: "unverified@example.invalid", email_verified: false } } as any), false);
  const email = prefix + "-oauth@example.invalid";
  (google as any).gmail = () => ({ users: { getProfile: async () => ({ data: { emailAddress: email } }) } });
  const args = { account: { provider: "google", access_token: "secret-access", refresh_token: "secret-refresh", scope: "openid email https://www.googleapis.com/auth/gmail.readonly" }, profile: { email, email_verified: true, sub: prefix, name: "Tester" } } as any;
  assert.equal(await signIn({ ...args, account: { ...args.account, scope: "openid email" } }), "/login?error=GmailPermission");
  assert.equal(await signIn(args), true);
  const user = await adminPrisma.user.findUnique({ where: { email } });
  const account = await adminPrisma.gmailAccount.findUnique({ where: { ownerId: user!.id } });
  assert.ok(account); assert.ok(!account.encryptedToken.includes("secret-refresh"));
  await adminPrisma.gmailAccount.delete({ where: { id: account.id } });
  await adminPrisma.user.delete({ where: { id: user!.id } });
});

test("production API requires login, blocks cross-account access and enforces mutation origin", async () => {
  const secret = "fixture-session-secret-not-for-production-123456";
  const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "4312"], { env: { ...process.env, NEXTAUTH_URL: "http://localhost:4312", NEXTAUTH_SECRET: secret, GOOGLE_CLIENT_ID: "fixture", GOOGLE_CLIENT_SECRET: "fixture", ENABLE_LOCAL_SCHEDULER: "false" }, stdio: "ignore" });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch("http://localhost:4312/login")).ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
    assert.ok(ready, "production app started");
    const token = await encode({ token: { id: A, name: "Tester", email: A + "@example.invalid" }, secret, maxAge: 3600 });
    const headers = { cookie: `next-auth.session-token=${token}` };
    for (const path of ["/api/candidates", "/api/positions", "/api/stats", "/api/export", "/api/gmail/account"]) assert.equal((await fetch("http://localhost:4312" + path)).status, 401, path);
    const positions = await fetch("http://localhost:4312/api/positions", { headers });
    assert.equal(positions.status, 200, await positions.clone().text());
    assert.equal((await positions.json()).positions.length, 1);
    assert.match(positions.headers.get("cache-control")!, /no-store/);
    assert.equal((await fetch(`http://localhost:4312/api/positions/${pb}`, { headers })).status, 404);
    const other = await runAsTenant(B, () => prisma.candidate.findFirst());
    assert.equal((await fetch(`http://localhost:4312/api/candidates/${other!.id}/file`, { headers })).status, 404);
    assert.equal((await fetch(`http://localhost:4312/api/candidates/${other!.id}`, { method: "PATCH", headers: { ...headers, origin: "https://evil.invalid", "Content-Type": "application/json" }, body: JSON.stringify({ status: "REJECT" }) })).status, 403);
    const gmail = await (await fetch("http://localhost:4312/api/gmail/account", { headers })).json();
    assert.equal(gmail.account.email, A + "@example.invalid");
    assert.ok(!JSON.stringify(gmail).includes("encryptedToken"));
    const updated = await (await fetch("http://localhost:4312/api/gmail/account", { method: "PATCH", headers: { ...headers, origin: "http://localhost:4312", "Content-Type": "application/json" }, body: JSON.stringify({ syncIntervalMinutes: 2, backfillDays: 7 }) })).json();
    assert.equal(updated.account.syncIntervalMinutes, 2);
    assert.ok(!JSON.stringify(updated).includes("encryptedToken"));
    const own = await runAsTenant(A, () => prisma.candidate.findFirst());
    const file = await fetch(`http://localhost:4312/api/candidates/${own!.id}/file`, { headers });
    assert.equal(file.status, 200); assert.ok((await file.text()).startsWith("%PDF"));
  } finally { app.kill("SIGTERM"); await new Promise(r => app.once("exit", r)); }
});
