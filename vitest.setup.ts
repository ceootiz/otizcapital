const TEST_DATABASE_FLAG = "OTIZ_DB_TESTS_ENABLED";

function databaseTarget(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/-pooler(?=\.)/, "");
    const port = url.port || "5432";
    return `${url.username}@${host}:${port}${url.pathname}`;
  } catch {
    return null;
  }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();

if (!testDatabaseUrl) {
  process.env[TEST_DATABASE_FLAG] = "false";
} else {
  const testTarget = databaseTarget(testDatabaseUrl);
  const configuredTargets = [
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING
  ]
    .map(databaseTarget)
    .filter((target): target is string => Boolean(target));

  if (!testTarget || configuredTargets.includes(testTarget)) {
    throw new Error("TEST_DATABASE_URL must point to a separate test database, not the configured application database.");
  }

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env[TEST_DATABASE_FLAG] = "true";
}
