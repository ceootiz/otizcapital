import { getHomeDictionary, type HomeDictionary } from "./homepage-content";
import { getApplyDictionary, type ApplyDictionary } from "./apply-content";
import type { Locale } from "./i18n";

export type ContentScope = "home" | "apply";

export const CONTENT_SCOPES: ContentScope[] = ["home", "apply"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges an override onto a base value.
 * - Plain objects merge key-by-key (base keys are preserved when the override omits them).
 * - Arrays and scalars are replaced wholesale when the override provides a value.
 * - null/undefined overrides fall back to the base.
 */
export function deepMergeContent<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      result[key] = key in base ? deepMergeContent((base as Record<string, unknown>)[key], value) : value;
    }
    return result as T;
  }

  // Array or scalar (or type mismatch): the override wins.
  return override as T;
}

export function getContentDefaults(scope: "home", locale: Locale): HomeDictionary;
export function getContentDefaults(scope: "apply", locale: Locale): ApplyDictionary;
export function getContentDefaults(scope: ContentScope, locale: Locale): HomeDictionary | ApplyDictionary;
export function getContentDefaults(scope: ContentScope, locale: Locale): HomeDictionary | ApplyDictionary {
  return scope === "home" ? getHomeDictionary(locale) : getApplyDictionary(locale);
}

function parseOverride(overrideJson: string | null | undefined): unknown {
  if (!overrideJson) return null;
  try {
    return JSON.parse(overrideJson);
  } catch {
    return null;
  }
}

export function resolveHomeContent(locale: Locale, overrideJson?: string | null): HomeDictionary {
  return deepMergeContent(getHomeDictionary(locale), parseOverride(overrideJson));
}

export function resolveApplyContent(locale: Locale, overrideJson?: string | null): ApplyDictionary {
  return deepMergeContent(getApplyDictionary(locale), parseOverride(overrideJson));
}

/** Untyped resolver used by the admin editor, which handles both scopes generically. */
export function resolveContent(scope: ContentScope, locale: Locale, overrideJson?: string | null) {
  return deepMergeContent(getContentDefaults(scope, locale), parseOverride(overrideJson));
}
