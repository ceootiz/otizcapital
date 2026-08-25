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
import { requiresDatabaseDuringBuild } from "@/lib/build-database-policy";

/**
 * Reads the raw JSON override for a (scope, locale) from the database.
 * Returns null when no row exists. Runtime database failures retain the
 * compiled defaults, while release builds fail closed instead of silently
 * shipping stale public content. Wrapped in React cache() so metadata and page
 * render in the same request share a single query.
 */
export const loadSiteContentOverride = cache(async (scope: ContentScope, locale: Locale): Promise<string | null> => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { scope_locale: { scope, locale } },
      select: { dataJson: true }
    });
    return row?.dataJson ?? null;
  } catch (error) {
    if (requiresDatabaseDuringBuild()) {
      throw new Error(`[otiz-build] Unable to read ${scope}:${locale} site content from the database.`, { cause: error });
    }

    console.error(`[otiz-runtime] Unable to read ${scope}:${locale} site content; using compiled defaults.`, error);
    return null;
  }
});

export async function getHomeContent(locale: Locale): Promise<HomeDictionary> {
  return resolveHomeContent(locale, await loadSiteContentOverride("home", locale));
}

export async function getApplyContent(locale: Locale): Promise<ApplyDictionary> {
  return resolveApplyContent(locale, await loadSiteContentOverride("apply", locale));
}
