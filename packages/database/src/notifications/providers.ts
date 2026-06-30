import type { NotificationEvent } from "@prisma/client";
import type { NotificationStatus } from "../notification-events";
import { getEmailProviderName, getTelegramProviderName, isNotificationDeliveryEnabled } from "./config";
import { getNotificationTemplateMessage, type NotificationTemplateMessage } from "./templates";

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

export class DisabledEmailProvider implements EmailProvider {
  readonly channel = "EMAIL";

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

    return skippedResult(event, `Email provider disabled: ${getEmailProviderName()}`, message);
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
