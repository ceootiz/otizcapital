import { NextResponse } from "next/server";
import { prisma } from "@otiz/database";

export const dynamic = "force-dynamic";

// Public, unauthenticated active-investor count. Rounded to the nearest 5 for
// privacy (never exposes the exact figure) and cached in-memory for 1 hour.
// The cache is per-serverless-instance (best-effort) — acceptable for a coarse
// vanity metric that changes slowly.
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { value: number; at: number } | null = null;

function roundToNearestFive(n: number) {
  return Math.round(n / 5) * 5;
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ activeCount: cache.value });
  }
  try {
    // Exclude test-fixture rows (the vitest suite seeds "…@example.com"
    // investors into this database) so the public count reflects real investors.
    const count = await prisma.investor.count({
      where: { status: "ACTIVE", NOT: { email: { endsWith: "@example.com" } } }
    });
    const rounded = roundToNearestFive(count);
    cache = { value: rounded, at: now };
    return NextResponse.json({ activeCount: rounded });
  } catch {
    // On a DB hiccup, serve the last known value if we have one, else 0.
    return NextResponse.json({ activeCount: cache?.value ?? 0 });
  }
}
