import { dispatchDueAccounts } from "../../lib/worker";
export const config = { schedule: "* * * * *" };
export default async function handler() { await dispatchDueAccounts(); return new Response(null, { status: 204 }); }
