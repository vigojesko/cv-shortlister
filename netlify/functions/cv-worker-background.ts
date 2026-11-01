import { runWorker, validWorkerSecret } from "../../lib/worker";
export async function handler(event: { httpMethod: string; headers: Record<string, string | undefined>; body: string | null }) {
  if (event.httpMethod !== "POST" || !validWorkerSecret(event.headers.authorization || event.headers.Authorization)) return { statusCode: 401 };
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400 }; }
  if (typeof body.ownerId !== "string" || body.ownerId.length > 128) return { statusCode: 400 };
  await runWorker(body.ownerId, body.forceSync === true);
  return { statusCode: 200 };
}
