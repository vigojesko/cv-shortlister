import { AsyncLocalStorage } from "node:async_hooks";
const context = new AsyncLocalStorage<string>();
export function tenantId(): string {
  const id = context.getStore();
  if (!id || id === "__legacy__") throw new Error("Konteks akun tidak tersedia.");
  return id;
}
export function runAsTenant<T>(id: string, fn: () => T | PromiseLike<T>): Promise<T> {
  if (!id || id === "__legacy__") throw new Error("Akun tidak valid.");
  return context.run(id, async () => await fn());
}
