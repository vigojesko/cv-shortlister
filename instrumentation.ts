export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoSyncScheduler } = await import("./lib/scheduler/cron");
    startAutoSyncScheduler();
  }
}
