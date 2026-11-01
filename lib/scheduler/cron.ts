import cron from "node-cron";
import { dispatchDueAccounts } from "../worker";
declare global { var __cvScheduler: cron.ScheduledTask | undefined; }
export function startAutoSyncScheduler() {
  if (process.env.NETLIFY === "true" || process.env.ENABLE_LOCAL_SCHEDULER !== "true" || global.__cvScheduler) return;
  global.__cvScheduler = cron.schedule("* * * * *", () => { void dispatchDueAccounts().catch(e => console.error("Auto-sync:", e.message)); });
}
