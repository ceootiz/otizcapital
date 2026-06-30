import type { NotificationEvent } from "@prisma/client";
import type { NotificationEventType } from "../notification-events";

export type NotificationTemplateMessage = {
  subject: string;
  text: string;
  html?: string;
  telegramText?: string;
};

type NotificationTemplateContext = {
  event: NotificationEvent;
  payload: Record<string, unknown>;
};

type NotificationTemplate = (context: NotificationTemplateContext) => NotificationTemplateMessage;

function getString(payload: Record<string, unknown>, key: string, fallback: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getAmount(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? `$${value.toLocaleString("en-US")}` : "not specified";
}

function parsePayload(payloadJson: string) {
  try {
    const payload = JSON.parse(payloadJson) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function paragraph(text: string) {
  return `<p>${text}</p>`;
}

const templates: Record<NotificationEventType, NotificationTemplate> = {
  INVESTOR_APPLICATION_CREATED: ({ payload }) => {
    const fullName = getString(payload, "fullName", "A prospective investor");
    const amount = getAmount(payload, "plannedAllocationAmount");
    const text = `${fullName} submitted an investor application. Planned allocation: ${amount}. Review the application details and confirm the appropriate follow-up path.`;

    return {
      subject: "New investor application received",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  APPLICATION_STATUS_CHANGED: ({ payload }) => {
    const previousStatus = getString(payload, "previousStatus", "Previous status");
    const status = getString(payload, "status", "Updated status");
    const text = `Application status changed from ${previousStatus} to ${status}. Review the lead record and confirm the next operational step.`;

    return {
      subject: "Application status updated",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  NEXT_ACTION_DUE: ({ payload }) => {
    const nextAction = getString(payload, "nextAction", "A scheduled next action");
    const text = `${nextAction} is due. Review the lead context before contacting the applicant.`;

    return {
      subject: "Next action due",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  SLA_BREACH: ({ payload }) => {
    const signal = getString(payload, "signal", "An SLA signal");
    const text = `${signal} requires manager attention. Review the lead timeline and decide the next appropriate action.`;

    return {
      subject: "SLA attention required",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  APPLICATION_APPROVED: ({ payload }) => {
    const fullName = getString(payload, "fullName", "The application");
    const text = `${fullName} has been approved for the next administrative step. Prepare agreement review and keep reporting expectations clear.`;

    return {
      subject: "Application approved",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  APPLICATION_REJECTED: ({ payload }) => {
    const fullName = getString(payload, "fullName", "The application");
    const text = `${fullName} has been rejected. Keep the record complete and retain the decision context for internal review.`;

    return {
      subject: "Application rejected",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  INVESTOR_CREATED: ({ payload }) => {
    const fullName = getString(payload, "fullName", "Investor profile");
    const text = `${fullName} now has an active investor profile linked to an approved application. Confirm reporting access and next operational instructions.`;

    return {
      subject: "Investor profile created",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  ALLOCATION_CREATED: ({ payload }) => {
    const supplyCode = getString(payload, "supplyCode", "Allocation");
    const productName = getString(payload, "productName", "commerce product");
    const text = `${supplyCode} was created for ${productName}. Review the allocation record before the next managed operation step.`;

    return {
      subject: "Allocation created",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  ALLOCATION_STATUS_CHANGED: ({ payload }) => {
    const supplyCode = getString(payload, "supplyCode", "Allocation");
    const previousStatus = getString(payload, "previousStatus", "Previous status");
    const status = getString(payload, "status", "Updated status");
    const text = `${supplyCode} changed from ${previousStatus} to ${status}. Review the operational record and keep investor reporting context current.`;

    return {
      subject: "Allocation status updated",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  ALLOCATION_PAYOUT_STATE_CHANGED: ({ payload }) => {
    const supplyCode = getString(payload, "supplyCode", "Allocation");
    const previousStatus = getString(payload, "previousPayoutStatus", "Previous payout state");
    const payoutStatus = getString(payload, "payoutStatus", "Updated payout state");
    const text = `${supplyCode} payout state changed from ${previousStatus} to ${payoutStatus}. Review the allocation record before any manager-led payout or reinvest follow-up.`;

    return {
      subject: "Allocation payout state updated",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  ALLOCATION_REINVEST_DECISION_CHANGED: ({ payload }) => {
    const supplyCode = getString(payload, "supplyCode", "Allocation");
    const previousDecision = getString(payload, "previousReinvestDecision", "Previous decision");
    const reinvestDecision = getString(payload, "reinvestDecision", "Updated decision");
    const text = `${supplyCode} reinvest decision changed from ${previousDecision} to ${reinvestDecision}. Keep the investor instruction record aligned with manager review.`;

    return {
      subject: "Allocation reinvest decision updated",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  MONTHLY_REPORT_CREATED: ({ payload }) => {
    const month = getString(payload, "month", "Monthly report");
    const title = getString(payload, "title", "Investor report");
    const text = `${month} report draft was created: ${title}. Review proof coverage and reporting notes before publishing.`;

    return {
      subject: "Monthly report draft created",
      text,
      html: paragraph(text),
      telegramText: text
    };
  },
  MONTHLY_REPORT_PUBLISHED: ({ payload }) => {
    const month = getString(payload, "month", "Monthly report");
    const title = getString(payload, "title", "Investor report");
    const text = `${month} report was published: ${title}. The investor can now review the operational summary and available proof categories.`;

    return {
      subject: "Monthly report published",
      text,
      html: paragraph(text),
      telegramText: text
    };
  }
};

export function getNotificationTemplateMessage(event: NotificationEvent): NotificationTemplateMessage | null {
  const template = templates[event.type as NotificationEventType];

  if (!template) {
    return null;
  }

  return template({
    event,
    payload: parsePayload(event.payloadJson)
  });
}
