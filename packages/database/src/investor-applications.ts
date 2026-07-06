import { Prisma } from "@prisma/client";
import { getApplicationPriorityScore, getCrmConfig, type CrmConfig } from "@otiz/lib";
import { prisma } from "./client";
import { createNotificationEventRecord } from "./notification-events";
import { processPendingEmailNotificationEvents } from "./notification-processor";
import { getSiteSettings } from "./site-settings";
import { createReferralClick } from "./referrals";

export const APPLICATION_STATUSES = ["NEW", "REVIEWED", "APPROVED", "REJECTED", "CONTACTED"] as const;
export const APPLICATION_PRIORITIES = ["LOW", "NORMAL", "HIGH", "VIP"] as const;
export const REINVEST_INTEREST_OPTIONS = ["yes", "no", "not_sure"] as const;
export const CRM_WORKFLOW_FILTERS = ["needs-first-contact", "due-today", "ready-for-agreement", "waiting-decision", "high-value", "stale"] as const;
export const APPLICATION_SLA_FILTERS = ["first-contact-overdue", "due-soon", "overdue", "high-value-no-contact"] as const;
export const INVESTOR_APPLICATION_SORT_OPTIONS = ["smart", "newest", "oldest", "amount-desc", "next-action"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];
export type ReinvestInterest = (typeof REINVEST_INTEREST_OPTIONS)[number];
export type CrmWorkflowFilter = (typeof CRM_WORKFLOW_FILTERS)[number];
export type ApplicationSlaFilter = (typeof APPLICATION_SLA_FILTERS)[number];
export type InvestorApplicationSort = (typeof INVESTOR_APPLICATION_SORT_OPTIONS)[number];

export type CreateInvestorApplicationInput = {
  fullName: string;
  telegram?: string | null;
  email?: string | null;
  country: string;
  preferredContactMethod: string;
  plannedAllocationAmount: number;
  preferredDepositMethod: string;
  investorType: string;
  reinvestInterest: string;
  heardFrom: string;
  message?: string | null;
  consentAccepted: boolean;
  // Referral attribution resolved from the referral_code cookie at the API
  // layer (at most one is set), plus the client fingerprint for the click row.
  referredByArbitrageId?: string | null;
  referredByInvestorId?: string | null;
  // Optional promo code (validated at the API layer); consumed on approval.
  promoCode?: string | null;
  referralClientIp?: string | null;
  referralUserAgent?: string | null;
};

export type InvestorApplicationListOptions = {
  status?: ApplicationStatus;
  priority?: ApplicationPriority;
  reinvestInterest?: ReinvestInterest;
  sourceLabelSearch?: string;
  overdueNextActionOnly?: boolean;
  workflow?: CrmWorkflowFilter;
  sla?: ApplicationSlaFilter;
  sort?: InvestorApplicationSort;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type UpdateInvestorApplicationInput = {
  id: string;
  status?: ApplicationStatus;
  priority?: ApplicationPriority;
  managerNotes?: string | null;
  sourceLabel?: string | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
  action?: "UPDATE_APPLICATION" | "UPDATE_STATUS";
  actor: string;
};

export async function createInvestorApplicationRecord(input: CreateInvestorApplicationInput) {
  // Read the contact handle up front so it can be embedded in the confirmation
  // email (the email builder has no DB access).
  const { contactTelegram } = await getSiteSettings();
  const application = await prisma.$transaction(async (transaction) => {
    const application = await transaction.investorApplication.create({
      data: {
        fullName: input.fullName,
        telegram: input.telegram || null,
        email: input.email || null,
        country: input.country,
        preferredContactMethod: input.preferredContactMethod,
        plannedAllocationAmount: input.plannedAllocationAmount,
        preferredDepositMethod: input.preferredDepositMethod,
        investorType: input.investorType,
        reinvestInterest: input.reinvestInterest,
        heardFrom: input.heardFrom,
        message: input.message || null,
        consentAccepted: input.consentAccepted,
        referredByArbitrageId: input.referredByArbitrageId ?? null,
        referredByInvestorId: input.referredByInvestorId ?? null,
        promoCode: input.promoCode ?? null
      }
    });

    await createNotificationEventRecord(
      {
        type: "INVESTOR_APPLICATION_CREATED",
        channel: "INTERNAL",
        recipient: "admin",
        entityType: "InvestorApplication",
        entityId: application.id,
        payload: {
          applicationId: application.id,
          fullName: application.fullName,
          plannedAllocationAmount: application.plannedAllocationAmount,
          status: application.status
        },
        status: "PENDING"
      },
      transaction
    );

    // Investor-facing confirmation email (only when an email was provided).
    if (application.email) {
      await createNotificationEventRecord(
        {
          type: "INVESTOR_APPLICATION_CREATED",
          channel: "EMAIL",
          recipient: application.email,
          entityType: "InvestorApplication",
          entityId: application.id,
          payload: { applicationId: application.id, fullName: application.fullName, contactTelegram },
          status: "PENDING"
        },
        transaction
      );
    }

    return application;
  });

  // Referral click row (best-effort, outside the tx): records the attributed
  // application with the client fingerprint and runs the fraud scoring.
  if (input.referredByArbitrageId || input.referredByInvestorId) {
    try {
      await createReferralClick({
        arbitrageurId: input.referredByArbitrageId ?? null,
        investorReferrerId: input.referredByInvestorId ?? null,
        ipAddress: input.referralClientIp ?? null,
        userAgent: input.referralUserAgent ?? null,
        convertedToApplicationId: application.id
      });
    } catch (error) {
      console.error("[otiz] Referral click creation failed:", error);
    }
  }

  await processPendingEmailNotificationEvents();

  return application;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function buildInvestorApplicationWhere(options?: InvestorApplicationListOptions) {
  const crmConfig = getCrmConfig();
  const where: Prisma.InvestorApplicationWhereInput = {};
  const and: Prisma.InvestorApplicationWhereInput[] = [];

  if (options?.status) where.status = options.status;
  if (options?.priority) where.priority = options.priority;
  if (options?.reinvestInterest) where.reinvestInterest = options.reinvestInterest;
  if (options?.sourceLabelSearch) where.sourceLabel = { contains: options.sourceLabelSearch };
  if (options?.overdueNextActionOnly) where.nextActionAt = { not: null, lte: new Date() };

  if (options?.workflow === "needs-first-contact") {
    and.push({ status: "NEW" }, { contactedAt: null });
  }

  if (options?.workflow === "due-today") {
    and.push({ nextActionAt: { not: null, lte: endOfToday() } }, { status: { notIn: ["APPROVED", "REJECTED"] } });
  }

  if (options?.workflow === "ready-for-agreement") {
    and.push(
      { status: "APPROVED" },
      {
        OR: [
          { nextAction: { contains: "agreement" } },
          { sourceLabel: { contains: "agreement" } },
          { managerNotes: { contains: "agreement" } }
        ]
      }
    );
  }

  if (options?.workflow === "waiting-decision") {
    and.push(
      { status: { in: ["CONTACTED", "REVIEWED"] } },
      {
        OR: [
          { nextActionAt: null },
          { nextActionAt: { gt: new Date() } }
        ]
      }
    );
  }

  if (options?.workflow === "high-value") {
    and.push({ plannedAllocationAmount: { gte: crmConfig.highValueLeadAmount } });
  }

  if (options?.workflow === "stale") {
    const cutoff = daysAgo(crmConfig.staleLeadDays);
    and.push({ status: { notIn: ["APPROVED", "REJECTED"] } }, { createdAt: { lt: cutoff } }, { updatedAt: { lt: cutoff } });
  }

  if (options?.sla === "first-contact-overdue") {
    and.push({ status: "NEW" }, { contactedAt: null }, { createdAt: { lt: hoursAgo(crmConfig.firstContactSlaHours) } });
  }

  if (options?.sla === "due-soon") {
    and.push({ status: { notIn: ["APPROVED", "REJECTED"] } }, { nextActionAt: { not: null, gte: new Date(), lte: hoursFromNow(crmConfig.nextActionDueSoonHours) } });
  }

  if (options?.sla === "overdue") {
    and.push({ status: { notIn: ["APPROVED", "REJECTED"] } }, { nextActionAt: { not: null, lt: new Date() } });
  }

  if (options?.sla === "high-value-no-contact") {
    and.push({ status: "NEW" }, { contactedAt: null }, { plannedAllocationAmount: { gte: crmConfig.highValueLeadAmount } });
  }

  if (options?.search) {
    const search = options.search;
    and.push({
      OR: [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { telegram: { contains: search } },
        { country: { contains: search } }
      ]
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function toTime(value: Date | null | undefined) {
  return value ? value.getTime() : null;
}

function getInvestorApplicationOrderBy(sort: InvestorApplicationSort): Prisma.InvestorApplicationOrderByWithRelationInput[] {
  if (sort === "newest") return [{ createdAt: "desc" }];
  if (sort === "oldest") return [{ createdAt: "asc" }];
  if (sort === "amount-desc") return [{ plannedAllocationAmount: "desc" }, { createdAt: "desc" }];
  if (sort === "next-action") return [{ nextActionAt: "asc" }, { createdAt: "desc" }];

  return [{ createdAt: "desc" }];
}

function compareInvestorApplications<T extends { createdAt: Date; nextActionAt: Date | null; plannedAllocationAmount: number; priority: string; status: string; contactedAt: Date | null }>(
  left: T,
  right: T,
  sort: InvestorApplicationSort,
  crmConfig: CrmConfig
) {
  if (sort === "oldest") return left.createdAt.getTime() - right.createdAt.getTime();
  if (sort === "newest") return right.createdAt.getTime() - left.createdAt.getTime();
  if (sort === "amount-desc") {
    const amountDiff = right.plannedAllocationAmount - left.plannedAllocationAmount;
    return amountDiff || right.createdAt.getTime() - left.createdAt.getTime();
  }
  if (sort === "next-action") {
    const leftNextActionAt = toTime(left.nextActionAt) ?? Number.POSITIVE_INFINITY;
    const rightNextActionAt = toTime(right.nextActionAt) ?? Number.POSITIVE_INFINITY;
    return leftNextActionAt - rightNextActionAt || right.createdAt.getTime() - left.createdAt.getTime();
  }

  const scoreDiff = getApplicationPriorityScore(right, crmConfig) - getApplicationPriorityScore(left, crmConfig);
  return scoreDiff || right.createdAt.getTime() - left.createdAt.getTime();
}

function sortInvestorApplications<T extends { createdAt: Date; nextActionAt: Date | null; plannedAllocationAmount: number; priority: string; status: string; contactedAt: Date | null }>(
  items: T[],
  sort: InvestorApplicationSort,
  crmConfig: CrmConfig
) {
  return [...items].sort((left, right) => compareInvestorApplications(left, right, sort, crmConfig));
}

async function getInvestorApplicationSummary(where: Prisma.InvestorApplicationWhereInput) {
  const now = new Date();
  const [newLeads, contacted, approved, highVipPriority, overdueNextActions, allocation] = await Promise.all([
    prisma.investorApplication.count({ where: { AND: [where, { status: "NEW" }] } }),
    prisma.investorApplication.count({ where: { AND: [where, { status: "CONTACTED" }] } }),
    prisma.investorApplication.count({ where: { AND: [where, { status: "APPROVED" }] } }),
    prisma.investorApplication.count({ where: { AND: [where, { priority: { in: ["HIGH", "VIP"] } }] } }),
    prisma.investorApplication.count({ where: { AND: [where, { nextActionAt: { not: null, lte: now } }] } }),
    prisma.investorApplication.aggregate({ where, _sum: { plannedAllocationAmount: true } })
  ]);

  return {
    newLeads,
    contacted,
    approved,
    highVipPriority,
    overdueNextActions,
    plannedAllocationTotal: allocation._sum.plannedAllocationAmount ?? 0
  };
}

export async function listInvestorApplicationRecords(options?: InvestorApplicationListOptions) {
  const where = buildInvestorApplicationWhere(options);
  const crmConfig = getCrmConfig();
  const sort = options?.sort ?? "smart";
  const page = Math.max(1, Math.floor(options?.page || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options?.pageSize || 10)));
  const needsInMemorySort = sort === "smart" || sort === "next-action";

  if (needsInMemorySort) {
    const [allItems, summary] = await Promise.all([
      prisma.investorApplication.findMany({
        where,
        include: { investor: true },
        orderBy: getInvestorApplicationOrderBy(sort)
      }),
      getInvestorApplicationSummary(where)
    ]);
    const sortedItems = sortInvestorApplications(allItems, sort, crmConfig);
    const total = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      items: sortedItems.slice((page - 1) * pageSize, page * pageSize),
      pageInfo: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      summary
    };
  }

  const [items, total, summary] = await Promise.all([
    prisma.investorApplication.findMany({
      where,
      include: { investor: true },
      orderBy: getInvestorApplicationOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.investorApplication.count({ where }),
    getInvestorApplicationSummary(where)
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    pageInfo: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    summary
  };
}

export async function exportInvestorApplicationRecords(options?: InvestorApplicationListOptions) {
  const where = buildInvestorApplicationWhere(options);
  const crmConfig = getCrmConfig();
  const sort = options?.sort ?? "smart";

  const records = await prisma.investorApplication.findMany({
    where,
    include: { investor: true },
    orderBy: getInvestorApplicationOrderBy(sort)
  });

  return sortInvestorApplications(records, sort, crmConfig).slice(0, 5000);
}

export async function countInvestorApplicationRecords(options?: InvestorApplicationListOptions) {
  return prisma.investorApplication.count({
    where: buildInvestorApplicationWhere(options)
  });
}

export async function updateInvestorApplicationStatus(input: {
  id: string;
  status: ApplicationStatus;
  actor: string;
}) {
  return updateInvestorApplication({
    id: input.id,
    status: input.status,
    actor: input.actor,
    action: "UPDATE_STATUS"
  });
}

export async function updateInvestorApplication(input: UpdateInvestorApplicationInput) {
  const action = input.action ?? "UPDATE_APPLICATION";

  const updated = await prisma.$transaction(async (transaction) => {
    const previous = await transaction.investorApplication.findUnique({ where: { id: input.id } });

    if (!previous) return null;

    const nextData: Prisma.InvestorApplicationUpdateInput = {};

    if (input.status !== undefined) nextData.status = input.status;
    if (input.priority !== undefined) nextData.priority = input.priority;
    if (input.managerNotes !== undefined) nextData.managerNotes = input.managerNotes;
    if (input.sourceLabel !== undefined) nextData.sourceLabel = input.sourceLabel;
    if (input.nextAction !== undefined) nextData.nextAction = input.nextAction;
    if (input.nextActionAt !== undefined) nextData.nextActionAt = input.nextActionAt;

    const nextStatus = input.status ?? previous.status;

    if (nextStatus !== previous.status) {
      if (nextStatus === "CONTACTED" && !previous.contactedAt) nextData.contactedAt = new Date();
      if (nextStatus === "APPROVED" && !previous.approvedAt) nextData.approvedAt = new Date();
      if (nextStatus === "REJECTED" && !previous.rejectedAt) nextData.rejectedAt = new Date();
    }

    const updated = await transaction.investorApplication.update({
      where: { id: input.id },
      data: nextData
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action,
        entityType: "InvestorApplication",
        entityId: input.id,
        beforeJson: JSON.stringify(createAuditSnapshot(previous)),
        afterJson: JSON.stringify(createAuditSnapshot(updated))
      }
    });

    if (nextStatus !== previous.status) {
      await createNotificationEventRecord(
        {
          type: "APPLICATION_STATUS_CHANGED",
          channel: "INTERNAL",
          recipient: "admin",
          entityType: "InvestorApplication",
          entityId: input.id,
          payload: {
            applicationId: input.id,
            previousStatus: previous.status,
            status: updated.status,
            action
          },
          status: "PENDING"
        },
        transaction
      );

      // Investor-facing rejection email (only on transition to REJECTED with an email on file).
      if (nextStatus === "REJECTED" && previous.status !== "REJECTED" && updated.email) {
        await createNotificationEventRecord(
          {
            type: "APPLICATION_STATUS_CHANGED",
            channel: "EMAIL",
            recipient: updated.email,
            entityType: "InvestorApplication",
            entityId: input.id,
            payload: { applicationId: input.id, fullName: updated.fullName, status: "REJECTED" },
            status: "PENDING"
          },
          transaction
        );
      }
    }

    return updated;
  });

  await processPendingEmailNotificationEvents();

  return updated;
}

function createAuditSnapshot(record: {
  status?: string;
  priority?: string;
  managerNotes?: string | null;
  sourceLabel?: string | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
  contactedAt?: Date | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
}) {
  return {
    status: record.status,
    priority: record.priority,
    managerNotes: record.managerNotes ?? null,
    sourceLabel: record.sourceLabel ?? null,
    nextAction: record.nextAction ?? null,
    nextActionAt: record.nextActionAt?.toISOString() ?? null,
    contactedAt: record.contactedAt?.toISOString() ?? null,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    rejectedAt: record.rejectedAt?.toISOString() ?? null
  };
}

export function serializeInvestorApplication(record: {
  id: string;
  investorId?: string | null;
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
  status: string;
  managerNotes: string | null;
  priority: string;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: Date | null;
  contactedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  investor?: {
    id: string;
    fullName: string;
    email: string;
    telegram: string | null;
    status: string;
    totalCapital?: string;
    reinvestEnabled?: boolean;
  } | null;
}) {
  return {
    id: record.id,
    investorId: record.investorId ?? null,
    fullName: record.fullName,
    telegram: record.telegram,
    email: record.email,
    country: record.country,
    preferredContactMethod: record.preferredContactMethod,
    plannedAllocationAmount: record.plannedAllocationAmount,
    preferredDepositMethod: record.preferredDepositMethod,
    investorType: record.investorType,
    reinvestInterest: record.reinvestInterest,
    heardFrom: record.heardFrom,
    message: record.message,
    consentAccepted: record.consentAccepted,
    status: record.status,
    managerNotes: record.managerNotes ?? null,
    priority: record.priority,
    sourceLabel: record.sourceLabel ?? null,
    nextAction: record.nextAction ?? null,
    nextActionAt: record.nextActionAt?.toISOString() ?? null,
    contactedAt: record.contactedAt?.toISOString() ?? null,
    approvedAt: record.approvedAt?.toISOString() ?? null,
    rejectedAt: record.rejectedAt?.toISOString() ?? null,
    investor: record.investor
      ? {
          id: record.investor.id,
          fullName: record.investor.fullName,
          email: record.investor.email,
          telegram: record.investor.telegram,
          status: record.investor.status,
          totalCapital: record.investor.totalCapital ?? "0",
          reinvestEnabled: record.investor.reinvestEnabled ?? false
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}
