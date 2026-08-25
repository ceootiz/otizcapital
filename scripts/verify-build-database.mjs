import { PrismaClient } from "@prisma/client";

const DATABASE_CHECK_TIMEOUT_MS = 10_000;
const prisma = new PrismaClient();

async function withTimeout(promise, timeoutMs) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Database check timed out after ${timeoutMs}ms.`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

try {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for a production build.");
  }

  await withTimeout(prisma.$queryRaw`SELECT 1`, DATABASE_CHECK_TIMEOUT_MS);
  console.log("PASS build database preflight");
} catch (error) {
  console.error("FAIL build database preflight");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await Promise.race([
    prisma.$disconnect(),
    new Promise((resolve) => setTimeout(resolve, 2_000))
  ]);
}
