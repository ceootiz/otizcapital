import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { getNotificationTemplateMessage } from "./notifications/templates";

export const NOTIFICATION_EVENT_TYPES = [
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
  "MONTHLY_REPORT_PUBLISHED"
] as const;

export const NOTIFICATION_CHANNELS = ["EMAIL", "TELEGRAM", "INTERNAL"] as const;
export const NOTIFICATION_STATUSES = ["PENDING", "SKIPPED", "SENT", "FAILED"] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

type NotificationEventWriter = Pick<Prisma.TransactionClient, "notificationEvent">;
type NotificationEventReader = Pick<Prisma.TransactionClient, "notificationEvent">;

export type CreateNotificationEventInput = {
  type: NotificationEventType;
  channel: NotificationChannel;
  recipient: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  status?: NotificationStatus;
  error?: string | null;
  processedAt?: Date | null;
};

export async function createNotificationEventRecord(input: CreateNotificationEventInput, client: NotificationEventWriter = prisma) {
  return client.notificationEvent.create({
    data: {
      type: input.type,
      channel: input.channel,
      recipient: input.recipient,
      entityType: input.entityType,
      entityId: input.entityId,
      payloadJson: JSON.stringify(input.payload ?? {}),
      status: input.status ?? "PENDING",
      error: input.error ?? null,
      processedAt: input.processedAt ?? null
    }
  });
}

export async function listNotificationEventRecords(options: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  return prisma.notificationEvent.findMany({
    where: {
      entityType: options.entityType,
      entityId: options.entityId
    },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 20
  });
}

export async function listPendingNotificationEventRecords(limit: number, client: NotificationEventReader = prisma) {
  return client.notificationEvent.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit
  });
}

export async function updateNotificationEventStatus(input: {
  id: string;
  status: NotificationStatus;
  error?: string | null;
  processedAt?: Date | null;
}, client: NotificationEventWriter = prisma) {
  return client.notificationEvent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      error: input.error ?? null,
      processedAt: input.processedAt ?? new Date()
    }
  });
}

export async function getNotificationEventStatusCounts() {
  const counts = await Promise.all(
    NOTIFICATION_STATUSES.map(async (status) => [
      status,
      await prisma.notificationEvent.count({ where: { status } })
    ] as const)
  );

  return Object.fromEntries(counts) as Record<NotificationStatus, number>;
}

export function serializeNotificationEvent(record: {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  entityType: string;
  entityId: string;
  payloadJson: string;
  status: string;
  error: string | null;
  createdAt: Date;
  processedAt: Date | null;
}) {
  const messagePreview = getNotificationTemplateMessage(record);

  return {
    id: record.id,
    type: record.type,
    channel: record.channel,
    recipient: record.recipient,
    entityType: record.entityType,
    entityId: record.entityId,
    payloadJson: record.payloadJson,
    status: record.status,
    error: record.error,
    messagePreview,
    createdAt: record.createdAt.toISOString(),
    processedAt: record.processedAt?.toISOString() ?? null
  };
}
