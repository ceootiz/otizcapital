export type CrmConfig = {
  firstContactSlaHours: number;
  nextActionDueSoonHours: number;
  highValueLeadAmount: number;
  staleLeadDays: number;
};

export const DEFAULT_CRM_CONFIG: CrmConfig = {
  firstContactSlaHours: 24,
  nextActionDueSoonHours: 24,
  highValueLeadAmount: 25000,
  staleLeadDays: 7
};

type EnvSource = Record<string, string | undefined>;

function getRuntimeEnv(): EnvSource {
  const maybeProcess = (globalThis as typeof globalThis & { process?: { env?: EnvSource } }).process;
  return maybeProcess?.env ?? {};
}

function readPositiveNumber(value: string | undefined, fallback: number, integer = false) {
  if (!value || !value.trim()) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return integer ? Math.floor(parsed) : parsed;
}

export function getCrmConfig(env: EnvSource = getRuntimeEnv()): CrmConfig {
  return {
    firstContactSlaHours: readPositiveNumber(env.FIRST_CONTACT_SLA_HOURS, DEFAULT_CRM_CONFIG.firstContactSlaHours),
    nextActionDueSoonHours: readPositiveNumber(env.NEXT_ACTION_DUE_SOON_HOURS, DEFAULT_CRM_CONFIG.nextActionDueSoonHours),
    highValueLeadAmount: readPositiveNumber(env.HIGH_VALUE_LEAD_AMOUNT, DEFAULT_CRM_CONFIG.highValueLeadAmount, true),
    staleLeadDays: readPositiveNumber(env.STALE_LEAD_DAYS, DEFAULT_CRM_CONFIG.staleLeadDays, true)
  };
}
