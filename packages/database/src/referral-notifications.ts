import { createNotificationEventRecord } from "./notification-events";
import { processPendingEmailNotificationEvents } from "./notification-processor";

// Referral-program notifications. Both helpers are best-effort: a delivery
// failure must never break the registration or deposit-confirmation flow that
// triggers them.

function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://otiz-capital-web.vercel.app").replace(/\/$/, "");
}

export function buildReferralLink(code: string, locale = "ru") {
  return `${siteBaseUrl()}/${locale}?ref=${code}`;
}

// Welcome email to a freshly-registered arbitrageur (channel EMAIL → Resend).
export async function sendArbitrageurWelcomeEmail(input: {
  arbitrageurId: string;
  name: string;
  email: string;
  referralCode: string;
}) {
  try {
    await createNotificationEventRecord({
      type: "ARBITRAGEUR_WELCOME",
      channel: "EMAIL",
      recipient: input.email,
      entityType: "Arbitrageur",
      entityId: input.arbitrageurId,
      payload: {
        name: input.name,
        referralLink: buildReferralLink(input.referralCode)
      },
      status: "PENDING"
    });
    await processPendingEmailNotificationEvents();
  } catch (error) {
    console.error("[otiz] Arbitrageur welcome email failed:", error);
  }
}

// Admin-facing INTERNAL event when a commission accrues on a confirmed deposit.
export async function recordCommissionAccruedEvent(input: {
  commissionId: string;
  referrerName: string;
  referrerType: "arbitrageur" | "investor";
  commissionAmount: number;
}) {
  try {
    await createNotificationEventRecord({
      type: "REFERRAL_COMMISSION_ACCRUED",
      channel: "INTERNAL",
      recipient: "admin",
      entityType: "ReferralCommission",
      entityId: input.commissionId,
      payload: {
        referrerName: input.referrerName,
        referrerType: input.referrerType,
        commissionAmount: `$${input.commissionAmount.toLocaleString("en-US")}`
      },
      status: "PENDING"
    });
  } catch (error) {
    console.error("[otiz] REFERRAL_COMMISSION_ACCRUED event failed:", error);
  }
}
