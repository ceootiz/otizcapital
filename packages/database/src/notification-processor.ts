import { prisma } from "./client";
import {
  listPendingNotificationEventRecords,
  updateNotificationEventStatus
} from "./notification-events";
import { createDefaultNotificationProviderRegistry, isNotificationDeliveryEnabled } from "./notifications";

export type ProcessNotificationEventsInput = {
  actor: string;
  limit?: number;
};

export type ProcessNotificationEventsResult = {
  processed: number;
  skipped: number;
  failed: number;
  deliveryEnabled: boolean;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function normalizeLimit(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.floor(value));
}

export async function processPendingNotificationEvents(input: ProcessNotificationEventsInput): Promise<ProcessNotificationEventsResult> {
  const limit = normalizeLimit(input.limit);
  const deliveryEnabled = isNotificationDeliveryEnabled();
  const registry = createDefaultNotificationProviderRegistry();
  const events = await listPendingNotificationEventRecords(limit);
  const result: ProcessNotificationEventsResult = {
    processed: 0,
    skipped: 0,
    failed: 0,
    deliveryEnabled
  };

  for (const event of events) {
    try {
      const outcome = await registry.process(event);
      await updateNotificationEventStatus({
        id: event.id,
        status: outcome.status,
        error: outcome.reason,
        processedAt: new Date()
      });

      result.processed += 1;
      if (outcome.status === "SKIPPED") result.skipped += 1;
      if (outcome.status === "FAILED") result.failed += 1;
    } catch (error) {
      result.processed += 1;
      result.failed += 1;

      await updateNotificationEventStatus({
        id: event.id,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Notification processor failed.",
        processedAt: new Date()
      }).catch(() => undefined);
    }
  }

  await prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: "PROCESS_NOTIFICATIONS",
      entityType: "NotificationEvent",
      entityId: "batch",
      beforeJson: JSON.stringify({ pendingSelected: events.length, limit }),
      afterJson: JSON.stringify(result)
    }
  });

  return result;
}
