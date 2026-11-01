import { prisma } from "./prisma";
export async function storeFile(data: Buffer): Promise<string> {
  const file = await prisma.storedFile.create({ data: { data } });
  return file.id;
}
export async function readFile(id: string): Promise<Buffer> {
  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) throw new Error("Berkas CV tidak ditemukan.");
  return Buffer.from(file.data);
}
