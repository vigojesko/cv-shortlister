import { randomBytes } from "node:crypto";
for (const key of ["NEXTAUTH_SECRET", "ENCRYPTION_KEY", "WORKER_SECRET"]) console.log(`${key}=${randomBytes(32).toString("hex")}`);
