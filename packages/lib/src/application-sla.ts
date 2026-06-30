import { getCrmConfig, type CrmConfig } from "./crm-config";

export const APPLICATION_SLA_FILTERS = ["first-contact-overdue", "due-soon", "overdue", "high-value-no-contact"] as const;

export type ApplicationSlaFilter = (typeof APPLICATION_SLA_FILTERS)[number];

export type ApplicationSlaFlag = "firstContactOverdue" | "nextActionDueSoon" | "nextActionOverdue" | "highValueNoContact";

export type ApplicationSlaInput = {
  status: string;
  priority?: string | null;
  contactedAt?: Date | string | null;
  createdAt: Date | string;
  nextActionAt?: Date | string | null;
  plannedAllocationAmount: number;
};

export type ApplicationSlaBadge = {
  flag: ApplicationSlaFlag;
  filter: ApplicationSlaFilter;
  label: string;
  shortLabel: string;
  tone: "attention" | "urgent" | "value";
};

export type ApplicationSlaState = Record<ApplicationSlaFlag, boolean> & {
  badges: ApplicationSlaBadge[];
};

export type ApplicationPriorityReason = {
  key: "next-action-overdue" | "first-contact-overdue" | "high-value-no-contact" | "due-soon" | "vip-priority" | "high-priority" | "new-lead";
  label: string;
  tone: "attention" | "urgent" | "value" | "neutral";
};

export const APPLICATION_SLA_BADGES: Record<ApplicationSlaFlag, ApplicationSlaBadge> = {
  firstContactOverdue: {
    flag: "firstContactOverdue",
    filter: "first-contact-overdue",
    label: "First contact overdue",
    shortLabel: "First contact",
    tone: "attention"
  },
  nextActionDueSoon: {
    flag: "nextActionDueSoon",
    filter: "due-soon",
    label: "Due soon",
    shortLabel: "Due soon",
    tone: "attention"
  },
  nextActionOverdue: {
    flag: "nextActionOverdue",
    filter: "overdue",
    label: "Overdue",
    shortLabel: "Overdue",
    tone: "urgent"
  },
  highValueNoContact: {
    flag: "highValueNoContact",
    filter: "high-value-no-contact",
    label: "High value no contact",
    shortLabel: "High value",
    tone: "value"
  }
};

const HOUR_MS = 60 * 60 * 1000;
const CLOSED_STATUSES = new Set(["APPROVED", "REJECTED"]);

function toTime(value: Date | string | null | undefined) {
  if (!value) return null;

  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function getApplicationSlaState(
  application: ApplicationSlaInput,
  options: { now?: Date; config?: CrmConfig } = {}
): ApplicationSlaState {
  const now = options.now ?? new Date();
  const config = options.config ?? getCrmConfig();
  const nowTime = now.getTime();
  const createdAt = toTime(application.createdAt);
  const contactedAt = toTime(application.contactedAt);
  const nextActionAt = toTime(application.nextActionAt);
  const isOpen = !CLOSED_STATUSES.has(application.status);
  const isNewWithoutContact = application.status === "NEW" && contactedAt === null;
  const firstContactOverdue = isNewWithoutContact && createdAt !== null && createdAt < nowTime - config.firstContactSlaHours * HOUR_MS;
  const nextActionDueSoon = isOpen && nextActionAt !== null && nextActionAt >= nowTime && nextActionAt <= nowTime + config.nextActionDueSoonHours * HOUR_MS;
  const nextActionOverdue = isOpen && nextActionAt !== null && nextActionAt < nowTime;
  const highValueNoContact = isNewWithoutContact && application.plannedAllocationAmount >= config.highValueLeadAmount;
  const flags = {
    firstContactOverdue,
    nextActionDueSoon,
    nextActionOverdue,
    highValueNoContact
  };

  return {
    ...flags,
    badges: (Object.keys(flags) as ApplicationSlaFlag[])
      .filter((flag) => flags[flag])
      .map((flag) => APPLICATION_SLA_BADGES[flag])
  };
}

export function getApplicationPriorityScore(application: ApplicationSlaInput, config: CrmConfig = getCrmConfig()) {
  const sla = getApplicationSlaState(application, { config });

  if (sla.nextActionOverdue) return 600;
  if (sla.firstContactOverdue) return 500;
  if (sla.highValueNoContact) return 400;
  if (sla.nextActionDueSoon) return 300;
  if (application.priority === "VIP") return 200;
  if (application.priority === "HIGH") return 100;

  return 0;
}

export function getApplicationPriorityReasons(application: ApplicationSlaInput, config: CrmConfig = getCrmConfig()) {
  const sla = getApplicationSlaState(application, { config });
  const reasons: ApplicationPriorityReason[] = [];

  if (sla.nextActionOverdue) reasons.push({ key: "next-action-overdue", label: "Next action overdue", tone: "urgent" });
  if (sla.firstContactOverdue) reasons.push({ key: "first-contact-overdue", label: "First contact overdue", tone: "attention" });
  if (sla.highValueNoContact) reasons.push({ key: "high-value-no-contact", label: "High value no contact", tone: "value" });
  if (sla.nextActionDueSoon) reasons.push({ key: "due-soon", label: "Due soon", tone: "attention" });
  if (application.priority === "VIP") reasons.push({ key: "vip-priority", label: "VIP priority", tone: "value" });
  if (application.priority === "HIGH") reasons.push({ key: "high-priority", label: "High priority", tone: "attention" });
  if (application.status === "NEW") reasons.push({ key: "new-lead", label: "New lead", tone: "neutral" });

  return reasons;
}
