import { test } from "node:test";
import assert from "node:assert/strict";
import { runAsTenant, tenantId } from "../lib/tenant-context";
import { encrypt, decrypt } from "../lib/crypto";
import { calculateOverallScore } from "../lib/screening/screener";
import { validWorkerSecret } from "../lib/worker";
import { PositionCreateSchema } from "../lib/position-validation";
test("tenant context fails closed and stays isolated across concurrent promises", async () => {
  assert.throws(tenantId);
  const values = await Promise.all(["A", "B"].map(id => runAsTenant(id, async () => { await new Promise(r => setTimeout(r, 3)); return tenantId(); })));
  assert.deepEqual(values, ["A", "B"]);
  assert.throws(tenantId);
});
test("encrypted Google token roundtrip and tamper rejection", () => {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  const encrypted = encrypt("test-refresh-token");
  assert.equal(decrypt(encrypted), "test-refresh-token");
  assert.throws(() => decrypt({ ...encrypted, authTag: "0".repeat(32) }));
  delete process.env.ENCRYPTION_KEY;
  assert.throws(() => encrypt("x"));
});
test("worker rejects absent, malformed and incorrect authentication", () => {
  process.env.WORKER_SECRET = "w".repeat(64);
  assert.equal(validWorkerSecret(null), false);
  assert.equal(validWorkerSecret("Bearer wrong"), false);
  assert.equal(validWorkerSecret("Bearer " + "w".repeat(64)), true);
});
test("weighted score retains deterministic business rules", () => {
  assert.equal(calculateOverallScore({ skills: 80, experience: 70, education: 90, portfolio: 60 }, { weightSkills: 35, weightExperience: 30, weightEducation: 15, weightPortfolio: 20 }), 74.5);
  assert.equal(calculateOverallScore({ skills: 80, experience: 70, education: 90, portfolio: 60 }, { weightSkills: 0, weightExperience: 0, weightEducation: 0, weightPortfolio: 0 }), 0);
});
test("position input rejects negative weights and missing requirements", () => {
  assert.equal(PositionCreateSchema.safeParse({ title: "Dev", description: "Developer role", mustHaveRequirements: [], emailKeywords: ["DEV"], weightSkills: -1 }).success, false);
});
