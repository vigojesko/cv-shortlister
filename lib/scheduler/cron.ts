import cron from "node-cron";
import { syncGmailEmails } from "../gmail/sync";
import { prisma } from "../prisma";

declare global {
  // Global guard to ensure only a single cron instance runs in Next.js server lifecycle
  var __cvShortlisterCronTask: cron.ScheduledTask | undefined;
  var __cvShortlisterCronInitialized: boolean | undefined;
}

export function startAutoSyncScheduler() {
  if (global.__cvShortlisterCronInitialized) {
    return;
  }

  global.__cvShortlisterCronInitialized = true;

  const intervalMinutes = parseInt(
    process.env.SYNC_INTERVAL_MINUTES || "15",
    10
  );
  const cronExpression = `*/${Math.max(1, Math.min(60, intervalMinutes))} * * * *`;

  console.log(
    `[Auto-Sync Scheduler] Menginisialisasi cron job tiap ${intervalMinutes} menit: (${cronExpression})`
  );

  let isRunning = false;

  const task = cron.schedule(cronExpression, async () => {
    if (isRunning) {
      console.log(
        "[Auto-Sync Scheduler] Siklus sync sebelumnya masih berjalan, melewati siklus ini."
      );
      return;
    }

    try {
      isRunning = true;
      console.log("[Auto-Sync Scheduler] Menjalankan sinkronisasi berkala Gmail...");
      const syncResult = await syncGmailEmails();
      console.log(
        `[Auto-Sync Scheduler] Selesai. Ditemukan: ${syncResult.messagesFound}, Diproses: ${syncResult.processedCount}, Dilewati: ${syncResult.skippedCount}, Gagal: ${syncResult.failedCount}`
      );
    } catch (err: any) {
      console.error("[Auto-Sync Scheduler] Kesalahan eksekusi sync:", err);
    } finally {
      isRunning = false;
    }
  });

  global.__cvShortlisterCronTask = task;
}
