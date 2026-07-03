import { describe, expect, it } from "vitest";
import type { NotificationEvent } from "@prisma/client";
import { NOTIFICATION_EVENT_TYPES, type NotificationEventType } from "../notification-events";
import { InternalNotificationProvider } from "./providers";
import { getNotificationTemplateMessage } from "./templates";

const forbiddenPhrases = [
  "guaranteed",
  "guarantee",
  "risk-free",
  "passive income",
  "get rich",
  "high yield",
  "fixed return",
  "moon",
  "pump",
  "urgent invest now",
  "financial freedom"
];

const operationalMarkers = [
  "application",
  "lead",
  "record",
  "review",
  "operational",
  "administrative",
  "manager",
  "next action"
];

function createNotificationEvent(type: string, payload: Record<string, unknown>): NotificationEvent {
  return {
    id: `test-${type}`,
    type,
    channel: "INTERNAL",
    recipient: "admin",
    entityType: "InvestorApplication",
    entityId: "application-test-id",
    payloadJson: JSON.stringify(payload),
    status: "PENDING",
    error: null,
    createdAt: new Date("2026-05-15T00:00:00.000Z"),
    processedAt: null
  };
}

function payloadFor(type: NotificationEventType) {
  const basePayload = {
    applicationId: "application-test-id",
    fullName: "Template Safety Lead",
    plannedAllocationAmount: 25000
  };

  if (type === "APPLICATION_STATUS_CHANGED") {
    return {
      ...basePayload,
      previousStatus: "NEW",
      status: "REVIEWED"
    };
  }

  if (type === "NEXT_ACTION_DUE") {
    return {
      ...basePayload,
      nextAction: "Call applicant"
    };
  }

  if (type === "SLA_BREACH") {
    return {
      ...basePayload,
      signal: "First contact SLA breach"
    };
  }

  if (type === "ALLOCATION_CREATED") {
    return {
      ...basePayload,
      supplyCode: "SUP-APL-0526-101",
      productName: "iPhone commerce batch"
    };
  }

  if (type === "ALLOCATION_STATUS_CHANGED") {
    return {
      ...basePayload,
      supplyCode: "SUP-APL-0526-101",
      previousStatus: "PURCHASING",
      status: "SHIPPING"
    };
  }

  if (type === "ALLOCATION_PAYOUT_STATE_CHANGED") {
    return {
      ...basePayload,
      supplyCode: "SUP-APL-0526-101",
      previousPayoutStatus: "NOT_READY",
      payoutStatus: "PENDING"
    };
  }

  if (type === "ALLOCATION_REINVEST_DECISION_CHANGED") {
    return {
      ...basePayload,
      supplyCode: "SUP-APL-0526-101",
      previousReinvestDecision: "UNDECIDED",
      reinvestDecision: "REINVEST"
    };
  }

  if (type === "MONTHLY_REPORT_CREATED" || type === "MONTHLY_REPORT_PUBLISHED") {
    return {
      ...basePayload,
      month: "May 2026",
      title: "May operational report"
    };
  }

  return basePayload;
}

describe("notification templates", () => {
  it("covers all supported notification event types", () => {
    expect(NOTIFICATION_EVENT_TYPES).toEqual([
      "INVESTOR_APPLICATION_CREATED",
      "APPLICATION_STATUS_CHANGED",
      "NEXT_ACTION_DUE",
      "SLA_BREACH",
      "APPLICATION_APPROVED",
      "APPLICATION_REJECTED",
      "INVESTOR_CREATED",
      "ALLOCATION_CREATED",
      "ALLOCATION_STATUS_CHANGED",
      "ALLOCATION_PAYOUT_STATE_CHANGED",
      "ALLOCATION_REINVEST_DECISION_CHANGED",
      "MONTHLY_REPORT_CREATED",
      "MONTHLY_REPORT_PUBLISHED",
      "INVESTOR_DOCUMENT_READY",
      "PASSWORD_RESET"
    ]);

    for (const type of NOTIFICATION_EVENT_TYPES) {
      const message = getNotificationTemplateMessage(createNotificationEvent(type, payloadFor(type)));

      expect(message, `${type} should have a template`).not.toBeNull();
      expect(message?.subject.trim()).toBeTruthy();
      expect(message?.text.trim()).toBeTruthy();
      expect(message?.telegramText?.trim()).toBeTruthy();
    }
  });

  it("matches the approved calm operational copy snapshot", () => {
    const messages = NOTIFICATION_EVENT_TYPES.map((type) => {
      const message = getNotificationTemplateMessage(createNotificationEvent(type, payloadFor(type)));

      return {
        type,
        subject: message?.subject,
        text: message?.text,
        telegramText: message?.telegramText
      };
    });

    expect(messages).toMatchInlineSnapshot(`
      [
        {
          "subject": "New investor application received",
          "telegramText": "Template Safety Lead submitted an investor application. Planned allocation: $25,000. Review the application details and confirm the appropriate follow-up path.",
          "text": "Template Safety Lead submitted an investor application. Planned allocation: $25,000. Review the application details and confirm the appropriate follow-up path.",
          "type": "INVESTOR_APPLICATION_CREATED",
        },
        {
          "subject": "Application status updated",
          "telegramText": "Application status changed from NEW to REVIEWED. Review the lead record and confirm the next operational step.",
          "text": "Application status changed from NEW to REVIEWED. Review the lead record and confirm the next operational step.",
          "type": "APPLICATION_STATUS_CHANGED",
        },
        {
          "subject": "Next action due",
          "telegramText": "Call applicant is due. Review the lead context before contacting the applicant.",
          "text": "Call applicant is due. Review the lead context before contacting the applicant.",
          "type": "NEXT_ACTION_DUE",
        },
        {
          "subject": "SLA attention required",
          "telegramText": "First contact SLA breach requires manager attention. Review the lead timeline and decide the next appropriate action.",
          "text": "First contact SLA breach requires manager attention. Review the lead timeline and decide the next appropriate action.",
          "type": "SLA_BREACH",
        },
        {
          "subject": "Application approved",
          "telegramText": "Template Safety Lead has been approved for the next administrative step. Prepare agreement review and keep reporting expectations clear.",
          "text": "Template Safety Lead has been approved for the next administrative step. Prepare agreement review and keep reporting expectations clear.",
          "type": "APPLICATION_APPROVED",
        },
        {
          "subject": "Application rejected",
          "telegramText": "Template Safety Lead has been rejected. Keep the record complete and retain the decision context for internal review.",
          "text": "Template Safety Lead has been rejected. Keep the record complete and retain the decision context for internal review.",
          "type": "APPLICATION_REJECTED",
        },
        {
          "subject": "Investor profile created",
          "telegramText": "Template Safety Lead now has an active investor profile linked to an approved application. Confirm reporting access and next operational instructions.",
          "text": "Template Safety Lead now has an active investor profile linked to an approved application. Confirm reporting access and next operational instructions.",
          "type": "INVESTOR_CREATED",
        },
        {
          "subject": "Allocation created",
          "telegramText": "SUP-APL-0526-101 was created for iPhone commerce batch. Review the allocation record before the next managed operation step.",
          "text": "SUP-APL-0526-101 was created for iPhone commerce batch. Review the allocation record before the next managed operation step.",
          "type": "ALLOCATION_CREATED",
        },
        {
          "subject": "Allocation status updated",
          "telegramText": "SUP-APL-0526-101 changed from PURCHASING to SHIPPING. Review the operational record and keep investor reporting context current.",
          "text": "SUP-APL-0526-101 changed from PURCHASING to SHIPPING. Review the operational record and keep investor reporting context current.",
          "type": "ALLOCATION_STATUS_CHANGED",
        },
        {
          "subject": "Allocation payout state updated",
          "telegramText": "SUP-APL-0526-101 payout state changed from NOT_READY to PENDING. Review the allocation record before any manager-led payout or reinvest follow-up.",
          "text": "SUP-APL-0526-101 payout state changed from NOT_READY to PENDING. Review the allocation record before any manager-led payout or reinvest follow-up.",
          "type": "ALLOCATION_PAYOUT_STATE_CHANGED",
        },
        {
          "subject": "Allocation reinvest decision updated",
          "telegramText": "SUP-APL-0526-101 reinvest decision changed from UNDECIDED to REINVEST. Keep the investor instruction record aligned with manager review.",
          "text": "SUP-APL-0526-101 reinvest decision changed from UNDECIDED to REINVEST. Keep the investor instruction record aligned with manager review.",
          "type": "ALLOCATION_REINVEST_DECISION_CHANGED",
        },
        {
          "subject": "Monthly report draft created",
          "telegramText": "May 2026 report draft was created: May operational report. Review proof coverage and reporting notes before publishing.",
          "text": "May 2026 report draft was created: May operational report. Review proof coverage and reporting notes before publishing.",
          "type": "MONTHLY_REPORT_CREATED",
        },
        {
          "subject": "Monthly report published",
          "telegramText": "May 2026 report was published: May operational report. The investor can now review the operational summary and available proof categories.",
          "text": "May 2026 report was published: May operational report. The investor can now review the operational summary and available proof categories.",
          "type": "MONTHLY_REPORT_PUBLISHED",
        },
        {
          "subject": "Investor document ready for signature",
          "telegramText": "An onboarding agreement was generated for Template Safety Lead. The document record is awaiting the investor signature in the cabinet.",
          "text": "An onboarding agreement was generated for Template Safety Lead. The document record is awaiting the investor signature in the cabinet.",
          "type": "INVESTOR_DOCUMENT_READY",
        },
        {
          "subject": "Password reset requested",
          "telegramText": "A password reset link was requested for an investor account. No administrative action is required.",
          "text": "A password reset link was requested for an investor account. No administrative action is required.",
          "type": "PASSWORD_RESET",
        },
      ]
    `);
  });

  it("blocks hype, pressure, and financial-promise language", () => {
    for (const type of NOTIFICATION_EVENT_TYPES) {
      const message = getNotificationTemplateMessage(createNotificationEvent(type, payloadFor(type)));
      const copy = [message?.subject, message?.text, message?.html, message?.telegramText].filter(Boolean).join(" ").toLowerCase();

      for (const phrase of forbiddenPhrases) {
        expect(copy).not.toContain(phrase);
      }

      expect(copy).not.toContain("!");
      expect(operationalMarkers.some((marker) => copy.includes(marker))).toBe(true);
    }
  });

  it("fails safely when a template is missing", async () => {
    const provider = new InternalNotificationProvider();
    const result = await provider.send(createNotificationEvent("UNKNOWN_TEMPLATE_EVENT", {}));

    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("Missing notification template");
  });
});
