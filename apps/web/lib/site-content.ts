import { cache } from "react";
import { prisma } from "@otiz/database";
import {
  resolveApplyContent,
  resolveHomeContent,
  type ApplyDictionary,
  type ContentScope,
  type HomeDictionary,
  type Locale
} from "@otiz/lib";

/**
 * Reads the raw JSON override for a (scope, locale) from the database.
 * Returns null when no row exists or the query fails, so callers fall back to
 * the compiled TypeScript defaults. Wrapped in React cache() so metadata and
 * page render in the same request share a single query.
 */
export const loadSiteContentOverride = cache(async (scope: ContentScope, locale: Locale): Promise<string | null> => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { scope_locale: { scope, locale } },
      select: { dataJson: true }
    });
    return row?.dataJson ?? null;
  } catch {
    return null;
  }
});

export async function getHomeContent(locale: Locale): Promise<HomeDictionary> {
  return resolveHomeContent(locale, await loadSiteContentOverride("home", locale));
}

export async function getApplyContent(locale: Locale): Promise<ApplyDictionary> {
  return resolveApplyContent(locale, await loadSiteContentOverride("apply", locale));
}
