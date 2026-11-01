import { PrismaClient } from "@prisma/client";
import { tenantId } from "./tenant-context";
const globalDb = globalThis as unknown as { cvDatabase?: PrismaClient };
// Unscoped access is restricted to authentication and worker dispatch.
export const adminPrisma = globalDb.cvDatabase ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalDb.cvDatabase = adminPrisma;
const owned = new Set(["Position", "Candidate", "GmailAccount", "ProcessedEmail", "JobQueue", "StoredFile"]);
export const prisma = adminPrisma.$extends({
  query: { $allModels: { async $allOperations({ model, operation, args, query }) {
    if (!owned.has(model)) throw new Error("Model tidak tersedia melalui akses pengguna.");
    const ownerId = tenantId();
    const a = args as any;
    if (["create", "createMany", "upsert", "update", "updateMany"].includes(operation)) {
      const entries = operation === "upsert" ? [a.create, a.update] : (Array.isArray(a.data) ? a.data : [a.data]);
      const verifiedPositions = new Set<string>();
      for (const data of entries) {
        if (!data) continue;
        if (data.position || data.candidates || data.jobs) throw new Error("Nested write tidak diizinkan.");
        if (data.positionId && !verifiedPositions.has(data.positionId)) {
          if (typeof data.positionId !== "string" || !await adminPrisma.position.findFirst({ where: { id: data.positionId, ownerId }, select: { id: true } }))
            throw new Error("Posisi tidak ditemukan di akun Anda.");
          verifiedPositions.add(data.positionId);
        }
        data.ownerId = ownerId;
      }
    }
    if (!["create", "createMany"].includes(operation)) a.where = { ...a.where, ownerId };
    return query(args);
  } } }
}) as unknown as PrismaClient;
