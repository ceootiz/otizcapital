import { prisma } from "./client";

export const WITHDRAWAL_REQUEST_STATUSES = ["REQUESTED", "APPROVED", "SCHEDULED", "PAID", "REJECTED", "CANCELLED"] as const;
export const WITHDRAWAL_LOCK_DAYS = 90;
export const WITHDRAWAL_FORCE_UNLOCK_ACTION = "FORCE_UNLOCK_INVESTOR_WITHDRAWALS";
export const WITHDRAWAL_PENDING_STATUSES = ["REQUESTED", "APPROVED", "SCHEDULED"] as const;
export const WITHDRAWAL_TERMINAL_STATUSES = ["PAID", "REJECTED", "CANCELLED"] as const;

export type WithdrawalRequestStatus = (typeof WITHDRAWAL_REQUEST_STATUSES)[number];

export type WithdrawalLockStatus = {
  locked: boolean;
  unlockDate: string | null;
  manuallyUnlocked: boolean;
  overrideAt: string | null;
  overrideBy: string | null;
};

export function calculateWithdrawalLockStatus(input: {
  firstAllocationAt: Date | null;
  overrideAt?: Date | null;
  overrideBy?: string | null;
  now?: Date;
}): WithdrawalLockStatus {
  const unlockAt = input.firstAllocationAt
    ? new Date(input.firstAllocationAt.getTime() + WITHDRAWAL_LOCK_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const manuallyUnlocked = Boolean(input.overrideAt);
  const locked = !manuallyUnlocked && (!unlockAt || (input.now ?? new Date()).getTime() < unlockAt.getTime());

  return {
    locked,
    unlockDate: unlockAt?.toISOString() ?? null,
    manuallyUnlocked,
    overrideAt: input.overrideAt?.toISOString() ?? null,
    overrideBy: input.overrideBy ?? null
  };
}

export async function getInvestorWithdrawalLockStatus(investorId: string): Promise<WithdrawalLockStatus> {
  const [allocations, override] = await Promise.all([
    prisma.allocation.findMany({
      where: { investorId },
      select: { startedAt: true, createdAt: true }
    }),
    prisma.auditLog.findFirst({
      where: { entityType: "Investor", entityId: investorId, action: WITHDRAWAL_FORCE_UNLOCK_ACTION },
      orderBy: { createdAt: "desc" },
      select: { actor: true, createdAt: true }
    })
  ]);
  const allocationTimes = allocations.map((allocation) => (allocation.startedAt ?? allocation.createdAt).getTime());
  const firstAllocationAt = allocationTimes.length ? new Date(Math.min(...allocationTimes)) : null;

  return calculateWithdrawalLockStatus({
    firstAllocationAt,
    overrideAt: override?.createdAt ?? null,
    overrideBy: override?.actor ?? null
  });
}

export async function forceUnlockInvestorWithdrawals(input: { investorId: string; actor: string; reason: string }) {
  const reason = input.reason.trim();
  if (!reason) return { ok: false as const, status: 422 as const, error: "Unlock reason is required." };

  const [investor, current] = await Promise.all([
    prisma.investor.findUnique({ where: { id: input.investorId }, select: { id: true } }),
    getInvestorWithdrawalLockStatus(input.investorId)
  ]);
  if (!investor) return { ok: false as const, status: 404 as const, error: "Investor not found." };
  if (current.manuallyUnlocked) return { ok: true as const, created: false, access: current };

  const event = await prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: WITHDRAWAL_FORCE_UNLOCK_ACTION,
      entityType: "Investor",
      entityId: input.investorId,
      beforeJson: JSON.stringify(current),
      afterJson: JSON.stringify({ manuallyUnlocked: true, reason })
    }
  });

  return {
    ok: true as const,
    created: true,
    access: calculateWithdrawalLockStatus({
      firstAllocationAt: current.unlockDate ? new Date(new Date(current.unlockDate).getTime() - WITHDRAWAL_LOCK_DAYS * 24 * 60 * 60 * 1000) : null,
      overrideAt: event.createdAt,
      overrideBy: input.actor
    })
  };
}
export type WithdrawalPendingStatus = (typeof WITHDRAWAL_PENDING_STATUSES)[number];

export type WithdrawalRequestRecord = {
  id: string;
  investorId: string;
  amount: string;
  currency: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  paidAt: Date | null;
  scheduledFor: Date | null;
  method: string | null;
  destinationMasked: string | null;
  adminNote: string | null;
  investorNote: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WithdrawalRequestWithInvestor = WithdrawalRequestRecord & {
  investor: {
    id: string;
    fullName: string;
    email: string;
    telegram: string | null;
    status: string;
  };
};

export type WithdrawalAllocationRecord = {
  investorId: string;
  status: string;
  actualProfit: unknown;
};

export type WithdrawalPayoutSummary = {
  availableForWithdrawal: number;
  pendingPayouts: number;
  scheduledPayouts: number;
  paidPayouts: number;
  nextExpectedPayoutDate: string | null;
};

export function isWithdrawalRequestStatus(value: string): value is WithdrawalRequestStatus {
  return WITHDRAWAL_REQUEST_STATUSES.includes(value as WithdrawalRequestStatus);
}

export function isWithdrawalTerminalStatus(value: string) {
  return WITHDRAWAL_TERMINAL_STATUSES.includes(value as (typeof WITHDRAWAL_TERMINAL_STATUSES)[number]);
}

export function isWithdrawalPendingStatus(value: string): value is WithdrawalPendingStatus {
  return WITHDRAWAL_PENDING_STATUSES.includes(value as WithdrawalPendingStatus);
}

export function toMoneyNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function isPositiveMoney(value: string) {
  return toMoneyNumber(value) > 0;
}

export function maskWithdrawalDestination(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const compact = normalized.replace(/[^a-zA-Z0-9]/g, "");
  if (!compact) return "••••";
  return `•••• ${compact.slice(-4)}`;
}

export function filterInvestorWithdrawalRequests<T extends { investorId: string }>(requests: T[], investorId: string) {
  return requests.filter((request) => request.investorId === investorId);
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function serializeBaseWithdrawalRequest(record: WithdrawalRequestRecord) {
  return {
    id: record.id,
    investorId: record.investorId,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    requestedAt: record.requestedAt.toISOString(),
    approvedAt: toIsoDate(record.approvedAt),
    rejectedAt: toIsoDate(record.rejectedAt),
    paidAt: toIsoDate(record.paidAt),
    scheduledFor: toIsoDate(record.scheduledFor),
    method: record.method,
    destinationMasked: maskWithdrawalDestination(record.destinationMasked),
    investorNote: record.investorNote,
    rejectionReason: record.rejectionReason,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializeInvestorWithdrawalRequest(record: WithdrawalRequestRecord) {
  return serializeBaseWithdrawalRequest(record);
}

export function serializeAdminWithdrawalRequest(record: WithdrawalRequestWithInvestor) {
  return {
    ...serializeBaseWithdrawalRequest(record),
    adminNote: record.adminNote,
    investor: record.investor
  };
}

export function buildInvestorPayoutSummary(input: {
  investorId: string;
  withdrawalRequests: WithdrawalRequestRecord[];
  allocations: WithdrawalAllocationRecord[];
  now?: Date;
}): WithdrawalPayoutSummary {
  const investorRequests = filterInvestorWithdrawalRequests(input.withdrawalRequests, input.investorId);
  const investorAllocations = input.allocations.filter((allocation) => allocation.investorId === input.investorId);
  const completedProfit = investorAllocations
    .filter((allocation) => allocation.status === "COMPLETED")
    .reduce((sum, allocation) => sum + toMoneyNumber(allocation.actualProfit), 0);
  const pendingPayouts = investorRequests
    .filter((request) => isWithdrawalPendingStatus(request.status))
    .reduce((sum, request) => sum + toMoneyNumber(request.amount), 0);
  const scheduledPayouts = investorRequests
    .filter((request) => request.status === "SCHEDULED")
    .reduce((sum, request) => sum + toMoneyNumber(request.amount), 0);
  const paidPayouts = investorRequests
    .filter((request) => request.status === "PAID")
    .reduce((sum, request) => sum + toMoneyNumber(request.amount), 0);
  const activeRequestedTotal = investorRequests
    .filter((request) => !["REJECTED", "CANCELLED"].includes(request.status))
    .reduce((sum, request) => sum + toMoneyNumber(request.amount), 0);
  const nextExpectedPayoutDate =
    investorRequests
      .filter((request) => ["APPROVED", "SCHEDULED"].includes(request.status) && request.scheduledFor)
      .map((request) => request.scheduledFor as Date)
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

  return {
    availableForWithdrawal: Math.max(0, completedProfit - activeRequestedTotal),
    pendingPayouts,
    scheduledPayouts,
    paidPayouts,
    nextExpectedPayoutDate: toIsoDate(nextExpectedPayoutDate)
  };
}

async function writeWithdrawalAudit(input: {
  actor: string;
  action: string;
  before: WithdrawalRequestRecord | null;
  after: WithdrawalRequestRecord;
}) {
  await prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entityType: "WithdrawalRequest",
      entityId: input.after.id,
      beforeJson: input.before ? JSON.stringify({ status: input.before.status, scheduledFor: input.before.scheduledFor, amount: input.before.amount }) : null,
      afterJson: JSON.stringify({ status: input.after.status, scheduledFor: input.after.scheduledFor, amount: input.after.amount })
    }
  });
}

async function getMutableWithdrawalRequest(id: string) {
  const existing = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, status: 404 as const, error: "Withdrawal request not found." };
  if (isWithdrawalTerminalStatus(existing.status)) {
    return { ok: false as const, status: 409 as const, error: "Terminal withdrawal requests cannot be modified." };
  }
  return { ok: true as const, existing };
}

export async function createWithdrawalRequest(input: {
  investorId: string;
  amount: string;
  currency?: string;
  method?: string | null;
  destinationMasked?: string | null;
  investorNote?: string | null;
}) {
  const [investor, access] = await Promise.all([
    prisma.investor.findUnique({ where: { id: input.investorId } }),
    getInvestorWithdrawalLockStatus(input.investorId)
  ]);
  if (!investor) return { ok: false as const, status: 404 as const, error: "Investor not found." };
  if (!isPositiveMoney(input.amount)) return { ok: false as const, status: 422 as const, error: "Withdrawal amount must be greater than 0." };
  if (access.locked) {
    return {
      ok: false as const,
      status: 409 as const,
      error: access.unlockDate ? `Withdrawals are locked until ${access.unlockDate}.` : "Withdrawals are locked until the first allocation holding period ends."
    };
  }

  const request = await prisma.withdrawalRequest.create({
    data: {
      investorId: investor.id,
      amount: String(toMoneyNumber(input.amount)),
      currency: input.currency || "USD",
      method: input.method || null,
      destinationMasked: maskWithdrawalDestination(input.destinationMasked),
      investorNote: input.investorNote || null,
      status: "REQUESTED"
    }
  });

  return { ok: true as const, request };
}

export async function getInvestorWithdrawalRequests(investorId: string) {
  return prisma.withdrawalRequest.findMany({
    where: { investorId },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }]
  });
}

export async function getInvestorPayoutSummary(investorId: string) {
  const [withdrawalRequests, allocations] = await Promise.all([
    prisma.withdrawalRequest.findMany({ where: { investorId } }),
    prisma.allocation.findMany({ where: { investorId }, select: { investorId: true, status: true, actualProfit: true } })
  ]);

  return buildInvestorPayoutSummary({ investorId, withdrawalRequests, allocations });
}

export async function getAdminWithdrawalRequests(options: { status?: WithdrawalRequestStatus } = {}) {
  return prisma.withdrawalRequest.findMany({
    where: options.status ? { status: options.status } : undefined,
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } }
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }]
  });
}

export async function approveWithdrawalRequest(input: { id: string; actor: string; adminNote?: string | null }) {
  const mutable = await getMutableWithdrawalRequest(input.id);
  if (!mutable.ok) return mutable;
  const request = await prisma.withdrawalRequest.update({
    where: { id: mutable.existing.id },
    data: { status: "APPROVED", approvedAt: mutable.existing.approvedAt ?? new Date(), adminNote: input.adminNote ?? mutable.existing.adminNote }
  });
  await writeWithdrawalAudit({ actor: input.actor, action: "APPROVE_WITHDRAWAL_REQUEST", before: mutable.existing, after: request });
  return { ok: true as const, request };
}

export async function rejectWithdrawalRequest(input: { id: string; actor: string; rejectionReason?: string | null; adminNote?: string | null }) {
  const mutable = await getMutableWithdrawalRequest(input.id);
  if (!mutable.ok) return mutable;
  const request = await prisma.withdrawalRequest.update({
    where: { id: mutable.existing.id },
    data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: input.rejectionReason || null, adminNote: input.adminNote ?? mutable.existing.adminNote }
  });
  await writeWithdrawalAudit({ actor: input.actor, action: "REJECT_WITHDRAWAL_REQUEST", before: mutable.existing, after: request });
  return { ok: true as const, request };
}

export async function scheduleWithdrawalRequest(input: { id: string; actor: string; scheduledFor: Date; adminNote?: string | null }) {
  const mutable = await getMutableWithdrawalRequest(input.id);
  if (!mutable.ok) return mutable;
  const request = await prisma.withdrawalRequest.update({
    where: { id: mutable.existing.id },
    data: { status: "SCHEDULED", scheduledFor: input.scheduledFor, approvedAt: mutable.existing.approvedAt ?? new Date(), adminNote: input.adminNote ?? mutable.existing.adminNote }
  });
  await writeWithdrawalAudit({ actor: input.actor, action: "SCHEDULE_WITHDRAWAL_REQUEST", before: mutable.existing, after: request });
  return { ok: true as const, request };
}

export async function markWithdrawalPaid(input: { id: string; actor: string; adminNote?: string | null }) {
  const mutable = await getMutableWithdrawalRequest(input.id);
  if (!mutable.ok) return mutable;
  const request = await prisma.withdrawalRequest.update({
    where: { id: mutable.existing.id },
    data: { status: "PAID", paidAt: new Date(), adminNote: input.adminNote ?? mutable.existing.adminNote }
  });
  await writeWithdrawalAudit({ actor: input.actor, action: "MARK_WITHDRAWAL_PAID", before: mutable.existing, after: request });
  return { ok: true as const, request };
}

export async function cancelWithdrawalRequest(input: { id: string; actor: string; adminNote?: string | null }) {
  const mutable = await getMutableWithdrawalRequest(input.id);
  if (!mutable.ok) return mutable;
  const request = await prisma.withdrawalRequest.update({
    where: { id: mutable.existing.id },
    data: { status: "CANCELLED", adminNote: input.adminNote ?? mutable.existing.adminNote }
  });
  await writeWithdrawalAudit({ actor: input.actor, action: "CANCEL_WITHDRAWAL_REQUEST", before: mutable.existing, after: request });
  return { ok: true as const, request };
}
