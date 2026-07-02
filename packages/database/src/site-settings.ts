import { prisma } from "./client";

const SITE_SETTINGS_ID = "default";
export const DEFAULT_CONTACT_TELEGRAM = "otizceo";

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
