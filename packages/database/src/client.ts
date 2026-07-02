import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

process.env.DATABASE_URL ??= "file:../../prisma/dev.db";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Prisma reconnects lazily on the next query, so a dropped connection self-heals.
// This liveness probe races a lightweight query against a timeout so callers can
// return a clean 503 instead of hanging when the database is unreachable.
export async function checkDatabaseConnection(timeoutMs = 3000): Promise<{ ok: boolean; error?: string }> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error("db_timeout")), timeoutMs))
    ]);
    return { ok: true };
  } catch {
    return { ok: false, error: "db_unavailable" };
  }
}
