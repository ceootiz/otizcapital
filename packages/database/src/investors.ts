import crypto from "node:crypto";
import { prisma } from "./client";
import { createNotificationEventRecord } from "./notification-events";
import { processPendingEmailNotificationEvents } from "./notification-processor";
import { serializeAllocation } from "./allocations";
import { serializeMonthlyReport } from "./monthly-reports";

export const INVESTOR_STATUSES = ["ACTIVE", "PAUSED", "CLOSED"] as const;

export type InvestorStatus = (typeof INVESTOR_STATUSES)[number];

export type InvestorRecord = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  sourceApplicationId: string | null;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function titleFromEmail(email: string) {
  const localPart = email.split("@")[0] || "Investor";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Investor";
}

export async function findInvestorById(id: string) {
  return prisma.investor.findUnique({ where: { id } });
}

export async function findInvestorByEmail(email: string) {
  return prisma.investor.findUnique({ where: { email: email.toLowerCase() } });
}

// Stores a pre-hashed password (hashing happens in the app layer via bcrypt).
export async function updateInvestorPasswordHash(id: string, passwordHash: string) {
  return prisma.investor.update({ where: { id }, data: { passwordHash } });
}

export async function updateInvestorEmailNotifications(id: string, enabled: boolean) {
  return prisma.investor.update({ where: { id }, data: { emailNotificationsEnabled: enabled } });
}

export async function getInvestorDetailRecord(id: string) {
  return prisma.investor.findUnique({
    where: { id },
    include: {
      allocations: { orderBy: { createdAt: "desc" } },
      monthlyReports: { orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }] },
      applications: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });
}

export async function listInvestorRecords() {
  return prisma.investor.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function updateInvestorRecord(input: {
  id: string;
  status?: InvestorStatus;
  notes?: string | null;
  reinvestEnabled?: boolean;
  totalCapital?: string;
  lastReportAt?: Date | null;
  actor: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.investor.findUnique({ where: { id: input.id } });

    if (!existing) {
      return { ok: false as const, status: 404 as const, error: "Investor not found." };
    }

    const investor = await transaction.investor.update({
      where: { id: existing.id },
      data: {
        status: input.status ?? existing.status,
        notes: input.notes === undefined ? existing.notes : input.notes,
        reinvestEnabled: input.reinvestEnabled ?? existing.reinvestEnabled,
        totalCapital: input.totalCapital ?? existing.totalCapital,
        lastReportAt: input.lastReportAt === undefined ? existing.lastReportAt : input.lastReportAt
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "UPDATE_INVESTOR",
        entityType: "Investor",
        entityId: investor.id,
        beforeJson: JSON.stringify({
          status: existing.status,
          notes: existing.notes,
          reinvestEnabled: existing.reinvestEnabled,
          totalCapital: existing.totalCapital,
          lastReportAt: existing.lastReportAt
        }),
        afterJson: JSON.stringify({
          status: investor.status,
          notes: investor.notes,
          reinvestEnabled: investor.reinvestEnabled,
          totalCapital: investor.totalCapital,
          lastReportAt: investor.lastReportAt
        })
      }
    });

    return { ok: true as const, investor };
  });
}

export async function upsertInvestorForLogin(input: {
  email: string;
  fullName?: string;
  telegram?: string | null;
}) {
  const email = input.email.toLowerCase();

  return prisma.investor.upsert({
    where: { email },
    update: {
      fullName: input.fullName?.trim() || titleFromEmail(email),
      telegram: input.telegram?.trim() || null
    },
    create: {
      email,
      fullName: input.fullName?.trim() || titleFromEmail(email),
      telegram: input.telegram?.trim() || null,
      status: "ACTIVE"
    }
  });
}

export function serializeInvestor(record: InvestorRecord) {
  return {
    id: record.id,
    fullName: record.fullName,
    email: record.email,
    telegram: record.telegram,
    status: record.status,
    sourceApplicationId: record.sourceApplicationId,
    totalCapital: record.totalCapital,
    reinvestEnabled: record.reinvestEnabled,
    lastReportAt: record.lastReportAt?.toISOString() ?? null,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializeInvestorDetail(record: Awaited<ReturnType<typeof getInvestorDetailRecord>> & {}) {
  return {
    ...serializeInvestor(record),
    allocations: record.allocations.map(serializeAllocation),
    monthlyReports: record.monthlyReports.map(serializeMonthlyReport),
    sourceApplication: record.applications[0]
      ? {
          id: record.applications[0].id,
          fullName: record.applications[0].fullName,
          email: record.applications[0].email,
          status: record.applications[0].status,
          plannedAllocationAmount: record.applications[0].plannedAllocationAmount,
          createdAt: record.applications[0].createdAt.toISOString()
        }
      : null
  };
}

export async function createInvestorFromApprovedApplication(input: {
  applicationId: string;
  actor: string;
}) {
  const result = await prisma.$transaction(async (transaction) => {
    const application = await transaction.investorApplication.findUnique({
      where: { id: input.applicationId },
      include: { investor: true }
    });

    if (!application) {
      return { ok: false as const, status: 404 as const, error: "Investor application not found." };
    }

    if (application.status !== "APPROVED") {
      return { ok: false as const, status: 422 as const, error: "Application must be approved before creating an investor." };
    }

    if (!application.email) {
      return { ok: false as const, status: 422 as const, error: "Approved application must include an email to create investor access." };
    }

    if (application.investor) {
      return {
        ok: true as const,
        created: false,
        investor: application.investor,
        application
      };
    }

    const existingInvestor = await transaction.investor.findUnique({
      where: { email: application.email.toLowerCase() }
    });
    // Per-investor login code: closes the shared-INVESTOR_ACCESS_CODE hole for
    // every account created from here on. Legacy investors (null) keep using
    // the shared env code as a backward-compatible fallback.
    const personalAccessCode = crypto.randomBytes(16).toString("hex");
    const investor =
      existingInvestor ??
      (await transaction.investor.create({
        data: {
          fullName: application.fullName,
          email: application.email.toLowerCase(),
          telegram: application.telegram,
          status: "ACTIVE",
          sourceApplicationId: application.id,
          totalCapital: String(application.plannedAllocationAmount),
          reinvestEnabled: application.reinvestInterest === "yes",
          lastReportAt: null,
          notes: application.managerNotes,
          personalAccessCode
        }
      }));
    const updatedApplication = await transaction.investorApplication.update({
      where: { id: application.id },
      data: { investorId: investor.id },
      include: { investor: true }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CREATE_INVESTOR_FROM_APPLICATION",
        entityType: "InvestorApplication",
        entityId: application.id,
        beforeJson: JSON.stringify({ investorId: application.investorId ?? null }),
        afterJson: JSON.stringify({ investorId: investor.id, investorEmail: investor.email })
      }
    });

    await createNotificationEventRecord(
      {
        type: "INVESTOR_CREATED",
        channel: "INTERNAL",
        recipient: "admin",
        entityType: "InvestorApplication",
        entityId: application.id,
        payload: {
          applicationId: application.id,
          investorId: investor.id,
          fullName: investor.fullName,
          email: investor.email
        },
        status: "PENDING"
      },
      transaction
    );

    // Investor-facing approval email — only when a new investor account is created.
    if (!existingInvestor) {
      await createNotificationEventRecord(
        {
          type: "INVESTOR_CREATED",
          channel: "EMAIL",
          recipient: investor.email,
          entityType: "InvestorApplication",
          entityId: application.id,
          payload: {
            investorId: investor.id,
            fullName: investor.fullName,
            email: investor.email,
            // Personal code goes into the approval email instead of the shared one.
            personalAccessCode: investor.personalAccessCode || ""
          },
          status: "PENDING"
        },
        transaction
      );
    }

    return {
      ok: true as const,
      created: !existingInvestor,
      investor,
      application: updatedApplication
    };
  });

  await processPendingEmailNotificationEvents();

  return result;
}
