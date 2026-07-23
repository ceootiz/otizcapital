import { prisma } from "./client";

const SITE_SETTINGS_ID = "default";
const FEATURE_FLAGS_SCOPE = "feature-flags";
const FEATURE_FLAGS_LOCALE = "global";
export const DEFAULT_CONTACT_TELEGRAM = "otizceo";

export const PRODUCT_FEATURE_KEYS = [
  "money-movement",
  "onboarding-status",
  "support-requests",
  "notification-center",
  "investor-live-refresh",
  "investor-deposit-tracker",
  "investor-allocation-filters",
  "investor-calendar",
  "display-currency",
  "referral-share",
  "performance-charts",
  "investor-document-upload",
  "manager-assignment",
  "investor-updates",
  "operations-calendar",
  "reinvest-preference",
  "document-requests",
  "support-queue",
  "investor-segments",
  "message-templates",
  "content-studio-v2",
  "profit-attribution",
  "account-statements",
  "deal-comparison",
  "bulk-actions",
  "tasks",
  "manager-workload",
  "audit-log"
] as const;

export type ProductFeatureKey = (typeof PRODUCT_FEATURE_KEYS)[number];

export type ProductFeatureFlag = {
  key: ProductFeatureKey;
  enabled: boolean;
};

export type SiteSettings = {
  contactTelegram: string;
  updatedAt: string | null;
};

// Normalizes a Telegram handle to the canonical form (no leading @, only
// [A-Za-z0-9_], max 32 chars). Falls back to the default when empty.
export function sanitizeTelegramHandle(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_CONTACT_TELEGRAM;
  const cleaned = value.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
  return cleaned || DEFAULT_CONTACT_TELEGRAM;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } });
    return {
      contactTelegram: row?.contactTelegram || DEFAULT_CONTACT_TELEGRAM,
      updatedAt: row?.updatedAt.toISOString() ?? null
    };
  } catch {
    return { contactTelegram: DEFAULT_CONTACT_TELEGRAM, updatedAt: null };
  }
}

export async function setContactTelegram(handle: string): Promise<SiteSettings> {
  const contactTelegram = sanitizeTelegramHandle(handle);
  const row = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, contactTelegram },
    update: { contactTelegram }
  });
  return { contactTelegram: row.contactTelegram, updatedAt: row.updatedAt.toISOString() };
}

export function isProductFeatureKey(value: unknown): value is ProductFeatureKey {
  return typeof value === "string" && PRODUCT_FEATURE_KEYS.includes(value as ProductFeatureKey);
}

export function parseProductFeatureFlagData(value: unknown): Record<ProductFeatureKey, boolean> {
  let source: Record<string, unknown> = {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) source = parsed as Record<string, unknown>;
    } catch {
      source = {};
    }
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    source = value as Record<string, unknown>;
  }

  return Object.fromEntries(PRODUCT_FEATURE_KEYS.map((key) => [key, source[key] === true])) as Record<ProductFeatureKey, boolean>;
}

function serializeProductFeatureFlags(state: Record<ProductFeatureKey, boolean>): ProductFeatureFlag[] {
  return PRODUCT_FEATURE_KEYS.map((key) => ({ key, enabled: state[key] }));
}

export async function getProductFeatureFlags(): Promise<ProductFeatureFlag[]> {
  const row = await prisma.siteContent.findUnique({
    where: { scope_locale: { scope: FEATURE_FLAGS_SCOPE, locale: FEATURE_FLAGS_LOCALE } }
  });

  return serializeProductFeatureFlags(parseProductFeatureFlagData(row?.dataJson));
}

export async function isProductFeatureEnabled(key: ProductFeatureKey): Promise<boolean> {
  const flags = await getProductFeatureFlags();
  return flags.find((flag) => flag.key === key)?.enabled ?? false;
}

export async function setProductFeatureFlag(input: { key: ProductFeatureKey; enabled: boolean; actor: string }): Promise<ProductFeatureFlag[]> {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.siteContent.findUnique({
      where: { scope_locale: { scope: FEATURE_FLAGS_SCOPE, locale: FEATURE_FLAGS_LOCALE } }
    });
    const before = parseProductFeatureFlagData(existing?.dataJson);
    const after = { ...before, [input.key]: input.enabled };

    await transaction.siteContent.upsert({
      where: { scope_locale: { scope: FEATURE_FLAGS_SCOPE, locale: FEATURE_FLAGS_LOCALE } },
      create: {
        scope: FEATURE_FLAGS_SCOPE,
        locale: FEATURE_FLAGS_LOCALE,
        dataJson: JSON.stringify(after),
        updatedBy: input.actor
      },
      update: {
        dataJson: JSON.stringify(after),
        updatedBy: input.actor
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "UPDATE_FEATURE_FLAG",
        entityType: "FeatureFlag",
        entityId: input.key,
        beforeJson: JSON.stringify({ enabled: before[input.key] }),
        afterJson: JSON.stringify({ enabled: input.enabled })
      }
    });

    return serializeProductFeatureFlags(after);
  });
}
