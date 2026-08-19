import type { Locale } from "./i18n";

export const LEGAL_JURISDICTIONS = ["EU", "US", "RU", "CN", "REVIEW_REQUIRED"] as const;
export type LegalJurisdiction = (typeof LEGAL_JURISDICTIONS)[number];

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"
]);

export function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function resolveLegalJurisdiction(countryCode: unknown): LegalJurisdiction {
  const code = normalizeCountryCode(countryCode);
  if (!code) return "REVIEW_REQUIRED";
  if (EU_COUNTRY_CODES.has(code)) return "EU";
  if (code === "US") return "US";
  if (code === "RU") return "RU";
  if (code === "CN") return "CN";
  return "REVIEW_REQUIRED";
}

export function isSupportedLegalLocale(value: unknown): value is Locale {
  return value === "en" || value === "es" || value === "de" || value === "ru" || value === "zh";
}

export function legalTemplateRequiresRegionalReview(jurisdiction: LegalJurisdiction, legalRegion?: string | null) {
  return jurisdiction === "US" && !legalRegion?.trim();
}

export type LegalAgreementTemplateBody = {
  heading: string;
  dateLabel: string;
  investorLabel: string;
  allocationLabel: string;
  termsHeading: string;
  terms: string[];
  signatureLabel: string;
  signatureNotice: string;
};

export function parseLegalAgreementTemplateBody(value: string): LegalAgreementTemplateBody | null {
  try {
    const parsed = JSON.parse(value) as Partial<LegalAgreementTemplateBody>;
    if (
      typeof parsed.heading !== "string" ||
      typeof parsed.dateLabel !== "string" ||
      typeof parsed.investorLabel !== "string" ||
      typeof parsed.allocationLabel !== "string" ||
      typeof parsed.termsHeading !== "string" ||
      !Array.isArray(parsed.terms) ||
      parsed.terms.length === 0 ||
      parsed.terms.some((term) => typeof term !== "string" || !term.trim()) ||
      typeof parsed.signatureLabel !== "string" ||
      typeof parsed.signatureNotice !== "string"
    ) return null;
    return parsed as LegalAgreementTemplateBody;
  } catch {
    return null;
  }
}
