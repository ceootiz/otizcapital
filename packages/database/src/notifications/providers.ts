import type { NotificationEvent } from "@prisma/client";
import { Resend } from "resend";
import type { NotificationStatus } from "../notification-events";
import { getTelegramProviderName, isNotificationDeliveryEnabled } from "./config";
import { getNotificationTemplateMessage, type NotificationTemplateMessage } from "./templates";
import { buildInvestorEmail } from "./email-content";

export type NotificationMessage = {
  channel: string;
  recipient: string;
  subject: string;
  text: string;
  html?: string;
  telegramText?: string;
  payload: Record<string, unknown>;
};

export type NotificationProviderResult = {
  status: Exclude<NotificationStatus, "PENDING">;
  reason: string | null;
  message: NotificationMessage;
};

export interface NotificationProvider {
  readonly channel: string;
  canHandle(event: NotificationEvent): boolean;
  buildMessage(event: NotificationEvent): NotificationMessage;
  send(event: NotificationEvent): Promise<NotificationProviderResult>;
}

export interface EmailProvider extends NotificationProvider {
  readonly channel: "EMAIL";
}

export interface TelegramProvider extends NotificationProvider {
  readonly channel: "TELEGRAM";
}

function parsePayload(payloadJson: string) {
  try {
    const payload = JSON.parse(payloadJson) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function buildMessageFromTemplate(event: NotificationEvent, template: NotificationTemplateMessage): NotificationMessage {
  const payload = parsePayload(event.payloadJson);

  return {
    channel: event.channel,
    recipient: event.recipient,
    subject: template.subject,
    text: template.text,
    html: template.html,
    telegramText: template.telegramText,
    payload
  };
}

function missingTemplateResult(event: NotificationEvent): NotificationProviderResult {
  return {
    status: "FAILED",
    reason: "Missing notification template",
    message: {
      channel: event.channel,
      recipient: event.recipient,
      subject: "Missing notification template",
      text: `No notification template exists for ${event.type}.`,
      payload: parsePayload(event.payloadJson)
    }
  };
}

function skippedResult(event: NotificationEvent, reason: string, message: NotificationMessage): NotificationProviderResult {
  return {
    status: "SKIPPED",
    reason,
    message
  };
}

function buildTemplateMessage(event: NotificationEvent) {
  const template = getNotificationTemplateMessage(event);
  return template ? buildMessageFromTemplate(event, template) : null;
}

export class ResendEmailProvider implements EmailProvider {
  readonly channel = "EMAIL";

  canHandle(event: NotificationEvent) {
    return event.channel === this.channel;
  }

  buildMessage(event: NotificationEvent): NotificationMessage {
    const content = buildInvestorEmail(event);
    const payload = parsePayload(event.payloadJson);
    if (content) {
      return { channel: event.channel, recipient: event.recipient, subject: content.subject, text: content.text, html: content.html, payload };
    }
    return buildTemplateMessage(event) ?? { channel: event.channel, recipient: event.recipient, subject: "", text: "", payload };
  }

  async send(event: NotificationEvent): Promise<NotificationProviderResult> {
    const content = buildInvestorEmail(event);
    const message = this.buildMessage(event);

    if (!content) {
      return skippedResult(event, "No investor email for this event type", message);
    }
    if (!isNotificationDeliveryEnabled()) {
      return skippedResult(event, "Outbound delivery disabled", message);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Graceful fallback: nothing sent, event left as skipped, warning logged.
      console.warn("[otiz-email] RESEND_API_KEY is not set; skipping email delivery.");
      return skippedResult(event, "RESEND_API_KEY not set", message);
    }
    if (!event.recipient || !/^\S+@\S+\.\S+$/.test(event.recipient)) {
      return skippedResult(event, "No valid recipient email", message);
    }

    const rawFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const from = rawFrom.includes("<") ? rawFrom : `OTIZ Capital <${rawFrom}>`;

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: event.recipient,
        subject: content.subject,
        html: content.html,
        text: content.text
      });

      if (error) {
        return { status: "FAILED", reason: error.message || "Resend error", message };
      }

      return { status: "SENT", reason: data?.id ? `Resend id ${data.id}` : "sent", message };
    } catch (error) {
      return { status: "FAILED", reason: error instanceof Error ? error.message : "Resend send failed", message };
    }
  }
}

export class DisabledTelegramProvider implements TelegramProvider {
  readonly channel = "TELEGRAM";

  canHandle(event: NotificationEvent) {
    return event.channel === this.channel;
  }

  buildMessage(event: NotificationEvent) {
    return buildTemplateMessage(event) ?? missingTemplateResult(event).message;
  }

  async send(event: NotificationEvent) {
    const message = buildTemplateMessage(event);

    if (!message) {
      return missingTemplateResult(event);
    }

    if (!isNotificationDeliveryEnabled()) {
      return skippedResult(event, "Outbound delivery disabled", message);
    }

    return skippedResult(event, `Telegram provider disabled: ${getTelegramProviderName()}`, message);
  }
}

export class InternalNotificationProvider implements NotificationProvider {
  readonly channel = "INTERNAL";

  canHandle(event: NotificationEvent) {
    return event.channel === this.channel;
  }

  buildMessage(event: NotificationEvent) {
    return buildTemplateMessage(event) ?? missingTemplateResult(event).message;
  }

  async send(event: NotificationEvent) {
    const message = buildTemplateMessage(event);

    if (!message) {
      return missingTemplateResult(event);
    }

    return skippedResult(event, "Internal event recorded only", message);
  }
}
