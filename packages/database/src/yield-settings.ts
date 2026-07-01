import { prisma } from "./client";

const YIELD_SETTINGS_ID = "default";
export const DEFAULT_ANNUAL_RATE_PERCENT = 50;

export type YieldSettings = {
  annualRatePercent: number;
  updatedAt: string | null;
};

export async function getYieldSettings(): Promise<YieldSettings> {
  try {
    const row = await prisma.yieldSettings.findUnique({ where: { id: YIELD_SETTINGS_ID } });
    return {
      annualRatePercent: row?.annualRatePercent ?? DEFAULT_ANNUAL_RATE_PERCENT,
      updatedAt: row?.updatedAt.toISOString() ?? null
    };
  } catch {
    return { annualRatePercent: DEFAULT_ANNUAL_RATE_PERCENT, updatedAt: null };
  }
}

export async function setYieldSettings(annualRatePercent: number): Promise<YieldSettings> {
  const clamped = Math.min(1000, Math.max(0, Number.isFinite(annualRatePercent) ? annualRatePercent : DEFAULT_ANNUAL_RATE_PERCENT));
  const row = await prisma.yieldSettings.upsert({
    where: { id: YIELD_SETTINGS_ID },
    create: { id: YIELD_SETTINGS_ID, annualRatePercent: clamped },
    update: { annualRatePercent: clamped }
  });
  return { annualRatePercent: row.annualRatePercent, updatedAt: row.updatedAt.toISOString() };
}
