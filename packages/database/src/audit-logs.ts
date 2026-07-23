import { Prisma } from "@prisma/client";
import { prisma } from "./client";

// Generic audit-log writer. Every admin action (login, approvals, edits) should
// record one of these. Best-effort: never throws into the caller's flow.
export async function createAuditLogEntry(input: {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: string | null;
  afterJson?: string | null;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actor: input.actor,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        beforeJson: input.beforeJson ?? null,
        afterJson: input.afterJson ?? null
      }
    });
  } catch {
    return null;
  }
}

export type InvestorFileAccessType = "InvestorDocument" | "InvestorFileReport";

export function buildInvestorFileAccessAudit(input: {
  investorId: string;
  entityType: InvestorFileAccessType;
  entityId: string;
  accessedAt: Date;
}) {
  return {
    actor: `investor:${input.investorId}`,
    action: "INVESTOR_ACCESSED_FILE",
    entityType: input.entityType,
    entityId: input.entityId,
    afterJson: JSON.stringify({ accessedAt: input.accessedAt.toISOString() })
  };
}

// Records the first successful access to an investor-owned file. Access
// tracking is best-effort so an audit outage never blocks an authorized
// document or report download.
export async function recordInvestorFileAccess(input: {
  investorId: string;
  entityType: InvestorFileAccessType;
  entityId: string;
  accessedAt?: Date;
}) {
  const audit = buildInvestorFileAccessAudit({
    ...input,
    accessedAt: input.accessedAt ?? new Date()
  });

  try {
    return await prisma.$transaction(async (transaction) => {
      const existing = await transaction.auditLog.findFirst({
        where: {
          actor: audit.actor,
          action: audit.action,
          entityType: audit.entityType,
          entityId: audit.entityId
        },
        select: { id: true }
      });
      if (existing) return existing;
      return transaction.auditLog.create({ data: audit });
    });
  } catch {
    return null;
  }
}

type LedgerCsvExportAuditFilters = {
  ledgerType?: string | null;
  entryType?: string | null;
  sourceType?: string | null;
  reversalStatus?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  minAmount?: string | number | null;
  maxAmount?: string | number | null;
  query?: string | null;
  limit?: string | number | null;
};

export const READINESS_POLICY_AUDIT_ACTIONS = [
  "CREATE_READINESS_POLICY",
  "CREATE_AND_ACTIVATE_READINESS_POLICY",
  "UPDATE_READINESS_POLICY",
  "ACTIVATE_READINESS_POLICY"
] as const;

export type ReadinessPolicyAuditAction = (typeof READINESS_POLICY_AUDIT_ACTIONS)[number];

export type ReadinessPolicyAuditFilters = {
  action?: string;
  policyId?: string;
  actor?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
};

const READINESS_POLICY_ACTION_SET = new Set<string>(READINESS_POLICY_AUDIT_ACTIONS);

type ReadinessPolicyAuditRecord = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: Date;
};

export async function listAuditLogs(options: {
  entityType: string;
  entityId: string;
  limit?: number;
}) {
  return prisma.auditLog.findMany({
    where: {
      entityType: options.entityType,
      entityId: options.entityId
    },
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 20
  });
}

export type AuditLogSearchOptions = {
  query?: string;
  actor?: string;
  action?: string;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
};

export async function searchAuditLogs(options: AuditLogSearchOptions = {}) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(5000, Math.max(1, Math.floor(options.pageSize ?? 30)));
  const query = options.query?.trim().slice(0, 120);
  const where: Prisma.AuditLogWhereInput = {
    ...(options.actor ? { actor: { contains: options.actor, mode: "insensitive" } } : {}),
    ...(options.action ? { action: options.action } : {}),
    ...(options.entityType ? { entityType: options.entityType } : {}),
    ...(options.dateFrom || options.dateTo
      ? { createdAt: { gte: options.dateFrom, lte: options.dateTo } }
      : {}),
    ...(query
      ? {
          OR: [
            { actor: { contains: query, mode: "insensitive" } },
            { action: { contains: query, mode: "insensitive" } },
            { entityType: { contains: query, mode: "insensitive" } },
            { entityId: { contains: query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function serializeAuditLog(record: {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: Date;
}) {
  return {
    id: record.id,
    actor: record.actor,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    beforeJson: record.beforeJson,
    afterJson: record.afterJson,
    createdAt: record.createdAt.toISOString()
  };
}

function sanitizeAuditString(value: unknown, maxLength = 120) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  if (!text) return null;
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function sanitizeLedgerCsvExportFilters(filters: LedgerCsvExportAuditFilters) {
  return {
    ledgerType: sanitizeAuditString(filters.ledgerType, 40),
    entryType: sanitizeAuditString(filters.entryType, 80),
    sourceType: sanitizeAuditString(filters.sourceType, 80),
    reversalStatus: sanitizeAuditString(filters.reversalStatus, 40),
    dateFrom: sanitizeAuditString(filters.dateFrom, 40),
    dateTo: sanitizeAuditString(filters.dateTo, 40),
    minAmount: sanitizeAuditString(filters.minAmount, 40),
    maxAmount: sanitizeAuditString(filters.maxAmount, 40),
    query: sanitizeAuditString(filters.query, 120),
    limit: sanitizeAuditString(filters.limit, 12)
  };
}

export async function createLedgerCsvExportAuditEvent(input: {
  actor: string;
  allocationId: string;
  appliedFilters: LedgerCsvExportAuditFilters;
  exportedRowCount: number;
  reversalEntriesIncluded: boolean;
}) {
  const filters = sanitizeLedgerCsvExportFilters(input.appliedFilters);
  const afterJson = JSON.stringify({
    allocationId: sanitizeAuditString(input.allocationId, 160),
    exportedRowCount: Math.max(0, Math.min(Math.trunc(input.exportedRowCount), 100000)),
    filters,
    amountFiltersApplied: Boolean(filters.minAmount || filters.maxAmount),
    queryFilterApplied: Boolean(filters.query),
    reversalEntriesIncluded: input.reversalEntriesIncluded,
    exportedAt: new Date().toISOString()
  });

  return prisma.auditLog.create({
    data: {
      actor: sanitizeAuditString(input.actor, 120) || "admin",
      action: "EXPORT_LEDGER_CSV",
      entityType: "Allocation",
      entityId: input.allocationId,
      beforeJson: null,
      afterJson
    }
  });
}

function parseJsonObject(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") return value.slice(0, 240);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean").slice(0, 12);
  }
  return undefined;
}

function sanitizePolicyAuditMetadata(source: Record<string, unknown> | null) {
  if (!source) return {};

  const allowedKeys = [
    "id",
    "policyId",
    "name",
    "source",
    "requiredProofCategories",
    "warningProofCategories",
    "minimumProofCompletenessScore",
    "blockOnUnreviewedCriticalArtifacts",
    "blockOnHiddenInvestorLeakRisk",
    "blockOnStaleSnapshot",
    "allowPublishWithWarnings",
    "requireWarningAcknowledgment",
    "previousActive"
  ];

  return Object.fromEntries(
    allowedKeys
      .map((key) => [key, sanitizeMetadataValue(source[key])] as const)
      .filter(([, value]) => value !== undefined)
  );
}

function summarizeReadinessPolicyAudit(record: { action: string; entityId: string; beforeJson: string | null; afterJson: string | null }) {
  const before = sanitizePolicyAuditMetadata(parseJsonObject(record.beforeJson));
  const after = sanitizePolicyAuditMetadata(parseJsonObject(record.afterJson));
  const policyName = typeof after.name === "string" ? after.name : typeof before.name === "string" ? before.name : "Readiness policy";

  if (record.action === "CREATE_READINESS_POLICY") return { summary: `${policyName} was created as a draft policy.`, metadata: { after } };
  if (record.action === "CREATE_AND_ACTIVATE_READINESS_POLICY") return { summary: `${policyName} was created and activated.`, metadata: { after } };
  if (record.action === "ACTIVATE_READINESS_POLICY") return { summary: `${policyName} was activated.`, metadata: { before, after } };
  if (record.action === "UPDATE_READINESS_POLICY") return { summary: `${policyName} was updated.`, metadata: { before, after } };
  return { summary: "Readiness policy audit event recorded.", metadata: { before, after } };
}

export function serializeReadinessPolicyAuditEvent(record: ReadinessPolicyAuditRecord) {
    const { summary, metadata } = summarizeReadinessPolicyAudit(record);

    return {
      id: record.id,
      actor: record.actor,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      policyId: record.entityId,
      summary,
      metadata,
      createdAt: record.createdAt.toISOString()
    };
}

export async function getReadinessPolicyAuditEvents(options: ReadinessPolicyAuditFilters = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const action = options.action && READINESS_POLICY_ACTION_SET.has(options.action) ? options.action : undefined;

  const records = await prisma.auditLog.findMany({
    where: {
      entityType: "ReadinessPolicy",
      entityId: options.policyId || undefined,
      actor: options.actor || undefined,
      action: action || { in: [...READINESS_POLICY_AUDIT_ACTIONS] },
      createdAt: options.dateFrom || options.dateTo
        ? {
            gte: options.dateFrom,
            lte: options.dateTo
          }
        : undefined
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  return records.map(serializeReadinessPolicyAuditEvent);
}
