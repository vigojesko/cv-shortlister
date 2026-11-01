import { randomUUID, timingSafeEqual } from "node:crypto";
import { adminPrisma, prisma } from "./prisma";
import { runAsTenant, tenantId } from "./tenant-context";
import { syncGmailEmails } from "./gmail/sync";
import { screenCandidateCv } from "./screening/screener";
import { parseCvDocument } from "./parsers/document";
import { readFile } from "./files";

export function validWorkerSecret(value: string | undefined | null): boolean {
  const secret = process.env.WORKER_SECRET;
  if (!secret || secret.length < 32 || !value) return false;
  const a = Buffer.from(value), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function kickWorker(ownerId: string, forceSync = false): Promise<void> {
  if (process.env.ENABLE_LOCAL_SCHEDULER === "true" && process.env.NODE_ENV !== "production") {
    // Local development executes in-process; production always uses durable Netlify invocation.
    void runWorker(ownerId, forceSync).catch(e => console.error("Worker:", e.message));
    return;
  }
  const url = process.env.NEXTAUTH_URL;
  if (!url || !process.env.WORKER_SECRET) throw new Error("Konfigurasi worker belum lengkap.");
  const response = await fetch(new URL("/.netlify/functions/cv-worker-background", url), {
    method: "POST", headers: { Authorization: `Bearer ${process.env.WORKER_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId, forceSync }), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error("Worker belum dapat dijalankan. Periksa deploy Netlify.");
}
export async function dispatchDueAccounts(): Promise<void> {
  const accounts = await adminPrisma.gmailAccount.findMany({ where: { isConnected: true }, select: { ownerId: true, lastSyncAt: true, syncIntervalMinutes: true } });
  const queued = await adminPrisma.jobQueue.findMany({ where: { status: { in: ["PENDING", "PROCESSING"] } }, select: { ownerId: true }, distinct: ["ownerId"] });
  const owners = new Set(queued.map(j => j.ownerId));
  for (const a of accounts) if (!a.lastSyncAt || Date.now() - a.lastSyncAt.getTime() >= a.syncIntervalMinutes * 60000) owners.add(a.ownerId);
  const ids = Array.from(owners).filter(id => id !== "__legacy__");
  // Bound connections while staying within the scheduled function's time budget.
  const deadline = Date.now() + 18000;
  for (let i = 0; i < ids.length && Date.now() < deadline; i += 10) {
    const results = await Promise.allSettled(ids.slice(i, i + 10).map(id => kickWorker(id)));
    if (results.some(r => r.status === "rejected")) console.error("Sebagian worker belum terpicu; jadwal berikutnya akan mencoba lagi.");
  }
}
export async function runWorker(ownerId: string, forceSync = false): Promise<boolean> {
  if (!await adminPrisma.user.findUnique({ where: { id: ownerId }, select: { id: true } })) return false;
  const token = randomUUID(), now = new Date();
  const expiresAt = new Date(Date.now() + 20 * 60000);
  let acquired = (await adminPrisma.workerLease.updateMany({ where: { ownerId, expiresAt: { lt: now } }, data: { token, expiresAt } })).count > 0;
  if (!acquired) {
    try { await adminPrisma.workerLease.create({ data: { ownerId, token, expiresAt } }); acquired = true; }
    catch (e: any) { if (e.code !== "P2002") throw e; }
  }
  if (!acquired) return false;
  try {
    return await runAsTenant(ownerId, async () => {
      // A stale PROCESSING job can only be reclaimed after the prior worker lease expires.
      await prisma.jobQueue.updateMany({ where: { status: "PROCESSING" }, data: { status: "PENDING" } });
      await prisma.jobQueue.updateMany({ where: { status: "PENDING", attempts: { gte: 3 } }, data: { status: "FAILED", lastError: "Proses terhenti setelah tiga percobaan. Silakan unggah ulang." } });
      const jobs = await prisma.jobQueue.findMany({ where: { status: "PENDING", attempts: { lt: 3 } }, orderBy: { createdAt: "asc" }, take: 1 });
      for (const job of jobs) {
        await prisma.jobQueue.update({ where: { id: job.id }, data: { status: "PROCESSING", attempts: { increment: 1 } } });
        try {
          const p = JSON.parse(job.payload);
          const existing = p.existingCandidateId ? await prisma.candidate.findUnique({ where: { id: p.existingCandidateId } }) : null;
          if (p.existingCandidateId && !existing) throw new Error("Kandidat tidak ditemukan.");
          const duplicate = !existing ? await prisma.candidate.findFirst({ where: { fileHash: p.fileHash } }) : null;
          let candidate = duplicate;
          if (!candidate) {
            const buffer = await readFile(p.fileId);
            const doc = await parseCvDocument(buffer, p.fileName, p.mimeType);
            candidate = await screenCandidateCv({ ...p, fileBuffer: buffer, extractedText: doc.textSnippet, mimeType: doc.mimeType,
              emailDate: p.emailDate ? new Date(p.emailDate) : undefined });
          }
          await prisma.jobQueue.update({ where: { id: job.id }, data: { status: "COMPLETED", payload: JSON.stringify({ candidateId: candidate!.id }), lastError: null } });
          if (!existing && p.fileId !== candidate!.filePath) await prisma.storedFile.deleteMany({ where: { id: p.fileId } });
        } catch (e: any) {
          await prisma.jobQueue.update({ where: { id: job.id }, data: { status: job.attempts + 1 >= 3 ? "FAILED" : "PENDING", lastError: e.message.slice(0, 500) } });
        }
      }
      const account = await prisma.gmailAccount.findFirst({ where: { isConnected: true } });
      if (account && (forceSync || !account.lastSyncAt || Date.now() - account.lastSyncAt.getTime() >= account.syncIntervalMinutes * 60000)) {
        if (await prisma.position.count({ where: { isActive: true } })) {
          const result = await syncGmailEmails();
          await prisma.gmailAccount.updateMany({ where: { id: account.id }, data: { lastSyncAt: new Date(), lastResult: JSON.stringify(result), lastErrorMessage: result.errors.join("; ").slice(0, 1000) || null } });
        } else {
          await prisma.gmailAccount.updateMany({ where: { id: account.id }, data: { lastSyncAt: new Date(), lastErrorMessage: "Buat satu posisi aktif agar CV dapat dinilai otomatis." } });
        }
      }
      return true;
    });
  } finally {
    await adminPrisma.workerLease.deleteMany({ where: { ownerId, token } });
  }
}
export async function enqueueScreening(payload: object, positionId?: string | null) {
  const job = await prisma.jobQueue.create({ data: { type: "SCREEN_CV", payload: JSON.stringify(payload), positionId } });
  // A failed dispatch leaves a durable PENDING job for the next scheduled invocation.
  await kickWorker(tenantId()).catch(() => {});
  return job;
}
