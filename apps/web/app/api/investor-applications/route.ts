import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminSession } from "@/lib/admin-session";
import { clientIpFromRequest, hitRateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import {
  APPLICATION_PRIORITIES,
  APPLICATION_SLA_FILTERS,
  APPLICATION_STATUSES,
  CRM_WORKFLOW_FILTERS,
  INVESTOR_APPLICATION_SORT_OPTIONS,
  REINVEST_INTEREST_OPTIONS,
  createInvestorApplicationRecord,
  listInvestorApplicationRecords,
  normalizePromoCode,
  resolveReferralCode,
  serializeInvestorApplication,
  validatePromoCode,
  type ApplicationPriority,
  type ApplicationSlaFilter,
  type ApplicationStatus,
  type CrmWorkflowFilter,
  type InvestorApplicationSort,
  type ReinvestInterest
} from "@otiz/database";

export const dynamic = "force-dynamic";

type ValidationResult =
  | {
      ok: true;
      data: {
        fullName: string;
        telegram: string | null;
        email: string | null;
        country: string;
        preferredContactMethod: string;
        plannedAllocationAmount: number;
        preferredDepositMethod: string;
        investorType: string;
        reinvestInterest: string;
        heardFrom: string;
        message: string | null;
        consentAccepted: boolean;
      };
    }
  | {
      ok: false;
      errors: Record<string, string>;
    };

const CONTACT_METHODS = ["telegram", "email"] as const;
const DEPOSIT_METHODS = ["usdt", "btc", "cash", "bank_transfer"] as const;
const INVESTOR_TYPES = ["individual", "company"] as const;
const REINVEST_OPTIONS = ["yes", "no", "not_sure"] as const;

function sanitizeString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function parseAmount(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.floor(value) : 0;
  }

  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? Math.floor(numeric) : 0;
  }

  return 0;
}

function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value);
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function validatePayload(payload: unknown): ValidationResult {
  const source = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const fullName = sanitizeString(source.fullName, 100);
  const telegram = sanitizeString(source.telegram, 80);
  const email = sanitizeString(source.email, 180).toLowerCase();
  const country = sanitizeString(source.country, 100);
  const preferredContactMethod = sanitizeString(source.preferredContactMethod, 40);
  const plannedAllocationAmount = parseAmount(source.plannedAllocationAmount);
  const preferredDepositMethod = sanitizeString(source.preferredDepositMethod, 40);
  const investorType = sanitizeString(source.investorType, 40);
  const reinvestInterest = sanitizeString(source.reinvestInterest, 40);
  const heardFrom = sanitizeString(source.heardFrom, 240);
  const message = sanitizeString(source.message, 2000);
  const consentAccepted = source.consentAccepted === true || source.consent === true;
  const errors: Record<string, string> = {};

  if (!fullName) errors.fullName = "Full name is required.";
  if (!country) errors.country = "Country is required.";
  if (!telegram && !email) errors.contact = "Email or Telegram is required.";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = "A valid email is required.";
  if (!isOneOf(preferredContactMethod, CONTACT_METHODS)) errors.preferredContactMethod = "Preferred contact method is invalid.";
  if (plannedAllocationAmount < 5000) errors.plannedAllocationAmount = "Minimum planned allocation is $5,000.";
  if (!isOneOf(preferredDepositMethod, DEPOSIT_METHODS)) errors.preferredDepositMethod = "Preferred deposit method is invalid.";
  if (!isOneOf(investorType, INVESTOR_TYPES)) errors.investorType = "Investor type is invalid.";
  if (!isOneOf(reinvestInterest, REINVEST_OPTIONS)) errors.reinvestInterest = "Reinvest interest is invalid.";
  if (!heardFrom) errors.heardFrom = "Referral source is required.";
  if (!consentAccepted) errors.consentAccepted = "Consent must be accepted.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      fullName,
      telegram: telegram || null,
      email: email || null,
      country,
      preferredContactMethod,
      plannedAllocationAmount,
      preferredDepositMethod,
      investorType,
      reinvestInterest,
      heardFrom,
      message: message || null,
      consentAccepted
    }
  };
}

export async function POST(request: Request) {
  // Public endpoint: max 5 submissions per IP per hour.
  const limit = hitRateLimit("investor-applications", clientIpFromRequest(request), { windowMs: 60 * 60 * 1000, max: 5 });
  if (!limit.allowed) {
    return rateLimitedResponse(limit.retryAfterSeconds);
  }

  try {
    const payload = await request.json();
    const validated = validatePayload(payload);

    if (!validated.ok) {
      return NextResponse.json({ ok: false, errors: validated.errors }, { status: 422 });
    }

    // Referral attribution: resolve the referral_code cookie to an arbitrageur
    // or investor referrer. Best-effort — a bad/expired code never blocks the
    // application from being created.
    const referralCode = sanitizeString((await cookies()).get("referral_code")?.value, 32);
    let referredByArbitrageId: string | null = null;
    let referredByInvestorId: string | null = null;
    if (referralCode) {
      try {
        const resolved = await resolveReferralCode(referralCode);
        if (resolved) {
          referredByArbitrageId = resolved.arbitrageurId;
          referredByInvestorId = resolved.investorReferrerId;
        }
      } catch {
        /* ignore resolution failures */
      }
    }

    // Promo code (optional): validate if provided. A bad code blocks submission
    // with a field-specific error so the applicant can correct it; a valid code
    // is stored (normalized) and consumed when the application is approved.
    const promoInput = sanitizeString(payload?.promoCode, 40);
    let promoCode: string | null = null;
    if (promoInput) {
      const promo = await validatePromoCode(promoInput);
      if (!promo.ok) {
        return NextResponse.json({ ok: false, errors: { promoCode: "PROMO_INVALID" } }, { status: 422 });
      }
      promoCode = normalizePromoCode(promoInput);
    }

    const application = await createInvestorApplicationRecord({
      ...validated.data,
      referredByArbitrageId,
      referredByInvestorId,
      promoCode,
      referralClientIp: clientIpFromRequest(request),
      referralUserAgent: (request.headers.get("user-agent") || "").slice(0, 400) || null
    });

    return NextResponse.json({ ok: true, data: serializeInvestorApplication(application) }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to create investor application." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = getAdminSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const rawStatus = sanitizeString(url.searchParams.get("status"), 40);
    const rawPriority = sanitizeString(url.searchParams.get("priority"), 20);
    const rawReinvestInterest = sanitizeString(url.searchParams.get("reinvestInterest"), 20);
    const rawWorkflow = sanitizeString(url.searchParams.get("workflow"), 40);
    const rawSla = sanitizeString(url.searchParams.get("sla"), 40);
    const rawSort = sanitizeString(url.searchParams.get("sort"), 40);
    const search = sanitizeString(url.searchParams.get("search"), 120);
    const sourceLabelSearch = sanitizeString(url.searchParams.get("source"), 160);
    const overdueNextAction = sanitizeString(url.searchParams.get("overdueNextAction"), 20);
    const page = parsePositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = Math.min(parsePositiveInteger(url.searchParams.get("pageSize"), 10), 100);
    const status = rawStatus && isOneOf(rawStatus, APPLICATION_STATUSES) ? (rawStatus as ApplicationStatus) : undefined;
    const priority = rawPriority && isOneOf(rawPriority, APPLICATION_PRIORITIES) ? (rawPriority as ApplicationPriority) : undefined;
    const reinvestInterest =
      rawReinvestInterest && isOneOf(rawReinvestInterest, REINVEST_INTEREST_OPTIONS) ? (rawReinvestInterest as ReinvestInterest) : undefined;
    const workflow = rawWorkflow && isOneOf(rawWorkflow, CRM_WORKFLOW_FILTERS) ? (rawWorkflow as CrmWorkflowFilter) : undefined;
    const sla = rawSla && isOneOf(rawSla, APPLICATION_SLA_FILTERS) ? (rawSla as ApplicationSlaFilter) : undefined;
    const sort = rawSort && isOneOf(rawSort, INVESTOR_APPLICATION_SORT_OPTIONS) ? (rawSort as InvestorApplicationSort) : "smart";
    const result = await listInvestorApplicationRecords({
      status,
      priority,
      reinvestInterest,
      workflow,
      sla,
      sort,
      sourceLabelSearch: sourceLabelSearch || undefined,
      overdueNextActionOnly: overdueNextAction === "true" || overdueNextAction === "1",
      search: search || undefined,
      page,
      pageSize
    });

    return NextResponse.json({
      ok: true,
      data: result.items.map(serializeInvestorApplication),
      pageInfo: result.pageInfo,
      summary: result.summary
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to list investor applications." }, { status: 500 });
  }
}
