import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import type { AllocationRisk, PortfolioRisk } from "./risk-engine";
import type { AllocationReconciliation, MonthlyReportReconciliation } from "./reconciliation";

export const OPERATIONAL_INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const OPERATIONAL_INCIDENT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;
export const OPERATIONAL_INCIDENT_SOURCES = ["risk_engine", "reconciliation", "readiness", "snapshot_integrity", "withdrawal", "proof_completeness", "manual"] as const;

export type OperationalIncidentSeverity = (typeof OPERATIONAL_INCIDENT_SEVERITIES)[number];
export type OperationalIncidentStatus = (typeof OPERATIONAL_INCIDENT_STATUSES)[number];
export type OperationalIncidentSource = (typeof OPERATIONAL_INCIDENT_SOURCES)[number];

export type OperationalIncidentRecord = {
  id: string;
  incidentType: string;
  severity: string;
  status: string;
  title: string;
  summary: string;
  allocationId: string | null;
  monthlyReportId: string | null;
  investorId: string | null;
  source: string;
  detectedAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  metadataJson: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedOperationalIncident = Omit<OperationalIncidentRecord, "detectedAt" | "acknowledgedAt" | "resolvedAt" | "createdAt" | "updatedAt"> & {
  detectedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ageHours: number;
  allocation?: { id: string; supplyCode: string; productName: string } | null;
  monthlyReport?: { id: string; month: string; title: string } | null;
  investor?: { id: string; fullName: string; email: string } | null;
};

export type OperationalIncidentAuditEvent = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
  beforePreview: Record<string, unknown> | null;
  afterPreview: Record<string, unknown> | null;
};

export type OperationalIncidentLifecycleEvent = {
  label: string;
  timestamp: string;
  actor: string | null;
  detail: string;
};

export type OperationalIncidentTriageAction = {
  label: string;
  href: string;
  kind: "primary" | "secondary";
  description: string;
  source: string;
  anchor: string | null;
};

export type OperationalIncidentDetail = {
  incident: Omit<SerializedOperationalIncident, "metadataJson">;
  metadataSummary: Record<string, unknown>;
  metadataPreview: string;
  sourceSignal: {
    source: string;
    incidentType: string;
    operationalState: string;
    score: string | null;
    level: string | null;
  };
  linkedEntities: {
    allocation: SerializedOperationalIncident["allocation"];
    monthlyReport: SerializedOperationalIncident["monthlyReport"];
    investor: SerializedOperationalIncident["investor"];
  };
  lifecycle: OperationalIncidentLifecycleEvent[];
  auditEvents: OperationalIncidentAuditEvent[];
  triageActions: OperationalIncidentTriageAction[];
  recommendedNextAction: string;
};

export type CreateOperationalIncidentInput = {
  incidentType: string;
  severity: OperationalIncidentSeverity;
  status?: OperationalIncidentStatus;
  title: string;
  summary: string;
  allocationId?: string | null;
  monthlyReportId?: string | null;
  investorId?: string | null;
  source: OperationalIncidentSource;
  detectedAt?: Date;
  metadata?: Record<string, unknown> | null;
  actor?: string;
};

export type OperationalIncidentIdentity = Pick<CreateOperationalIncidentInput, "incidentType" | "source" | "allocationId" | "monthlyReportId" | "investorId">;

export type OperationalIncidentFilters = {
  severity?: string | null;
  status?: string | null;
  source?: string | null;
  limit?: number | string | null;
};

export type IncidentSummary = {
  openCount: number;
  acknowledgedCount: number;
  unresolvedCount: number;
  criticalOpenCount: number;
  highOpenCount: number;
  staleUnresolvedCount: number;
  bySource: Record<string, number>;
};

const UNRESOLVED_STATUSES = ["OPEN", "ACKNOWLEDGED"] as const;
const STALE_INCIDENT_MS = 1000 * 60 * 60 * 24 * 3;
const MAX_METADATA_LENGTH = 4000;
const SEVERITY_SET = new Set<string>(OPERATIONAL_INCIDENT_SEVERITIES);
const STATUS_SET = new Set<string>(OPERATIONAL_INCIDENT_STATUSES);
const SOURCE_SET = new Set<string>(OPERATIONAL_INCIDENT_SOURCES);

type IncidentWriter = Pick<Prisma.TransactionClient, "operationalIncident" | "auditLog">;
type IncidentReader = Pick<Prisma.TransactionClient, "operationalIncident">;
type IncidentDetailClient = Pick<Prisma.TransactionClient, "operationalIncident" | "auditLog">;

function sanitizeString(value: unknown, maxLength = 500) {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value, 240);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.map(sanitizeMetadataValue).filter((item) => item !== undefined).slice(0, 12);
  if (value && typeof value === "object") {
    return sanitizeIncidentMetadata(value as Record<string, unknown>);
  }
  return undefined;
}

function sanitizeIncidentMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return {};
  const safe = Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !/token|secret|password|metadataJson|raw|session|csrf/i.test(key))
      .slice(0, 24)
      .map(([key, value]) => [sanitizeString(key, 80), sanitizeMetadataValue(value)] as const)
      .filter(([key, value]) => key && value !== undefined)
  );
  const serialized = JSON.stringify(safe);
  if (serialized.length <= MAX_METADATA_LENGTH) return safe;
  return { truncated: true, preview: serialized.slice(0, 800) };
}

function parseJsonObject(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function sanitizePreviewObject(value: string | null, allowedKeys?: string[]) {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;
  const sanitized = sanitizeIncidentMetadata(parsed);
  if (!allowedKeys) return sanitized;
  return Object.fromEntries(allowedKeys.map((key) => [key, sanitized[key]] as const).filter(([, item]) => item !== undefined));
}

function compactMetadataSummary(value: string | null) {
  const metadata = sanitizeIncidentMetadata(parseJsonObject(value));
  const allowedKeys = [
    "autoCreated",
    "autoResolved",
    "lastSignalAt",
    "source",
    "riskLevel",
    "riskScore",
    "currentLevel",
    "currentScore",
    "status",
    "currentStatus",
    "state",
    "score",
    "reportStatus",
    "blockingIssueCount",
    "warningCount",
    "missingProofSnapshot",
    "missingReconciliationSnapshot",
    "missingRiskSnapshot",
    "staleSnapshot",
    "staleHours",
    "reason"
  ];
  return Object.fromEntries(allowedKeys.map((key) => [key, metadata[key]] as const).filter(([, item]) => item !== undefined));
}

function safeSeverity(value: string): OperationalIncidentSeverity {
  return SEVERITY_SET.has(value) ? value as OperationalIncidentSeverity : "MEDIUM";
}

function safeStatus(value: string | null | undefined): OperationalIncidentStatus | undefined {
  return value && STATUS_SET.has(value) ? value as OperationalIncidentStatus : undefined;
}

function safeSource(value: string | null | undefined): OperationalIncidentSource | undefined {
  return value && SOURCE_SET.has(value) ? value as OperationalIncidentSource : undefined;
}

function normalizeNullableId(value: string | null | undefined) {
  const sanitized = sanitizeString(value, 160);
  return sanitized || null;
}

function metadataString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return "Tracked";
}

function recommendedNextActionForIncident(incident: Pick<OperationalIncidentRecord, "source" | "severity" | "status" | "incidentType">) {
  if (incident.status === "RESOLVED") return "No immediate action required. Keep the resolved incident in the audit trail.";
  if (incident.source === "risk_engine") return "Review the risk timeline, resolve blocking risk factors, then re-run manual risk evaluation.";
  if (incident.source === "reconciliation") return "Review ledger entries, fix the reconciliation exception with correction/reversal entries, then refresh reconciliation.";
  if (incident.source === "readiness") return "Open the monthly report readiness panel, clear blocking checks, and re-evaluate readiness.";
  if (incident.source === "snapshot_integrity") return "Regenerate the affected report snapshot and confirm proof, reconciliation, and risk snapshots are frozen.";
  if (incident.source === "withdrawal") return "Review the withdrawal queue and document the manager decision.";
  if (incident.source === "proof_completeness") return "Add or review required investor-visible proof placeholders.";
  return incident.severity === "CRITICAL" ? "Triage this incident and document the operational resolution." : "Acknowledge the incident after manager review, then resolve it when the signal clears.";
}

function safeLocaleSegment(locale: string | null | undefined) {
  const sanitized = sanitizeString(locale, 16).toLowerCase();
  return /^[a-z]{2}(?:-[a-z0-9]+)?$/.test(sanitized) ? sanitized : "en";
}

type IncidentTriageInput = Pick<SerializedOperationalIncident, "source" | "allocationId" | "monthlyReportId" | "investorId"> & Partial<Pick<SerializedOperationalIncident, "allocation" | "monthlyReport" | "investor">>;

function linkedId(value: string | null | undefined, linked: { id: string } | null | undefined) {
  return normalizeNullableId(value) ?? normalizeNullableId(linked?.id);
}

function adminHref(locale: string, path: string, anchor?: string) {
  return `/${safeLocaleSegment(locale)}/admin/${path}${anchor ? `#${anchor}` : ""}`;
}

export function buildIncidentTriageActions(incident: IncidentTriageInput, locale = "en"): OperationalIncidentTriageAction[] {
  const allocationId = linkedId(incident.allocationId, incident.allocation);
  const monthlyReportId = linkedId(incident.monthlyReportId, incident.monthlyReport);
  const investorId = linkedId(incident.investorId, incident.investor);
  const actions: OperationalIncidentTriageAction[] = [];
  const hrefs = new Set<string>();

  function addAction(action: Omit<OperationalIncidentTriageAction, "kind" | "source"> & { kind?: "primary" | "secondary"; source?: string }) {
    if (!action.href || hrefs.has(action.href)) return;
    hrefs.add(action.href);
    actions.push({
      ...action,
      kind: action.kind ?? (actions.some((item) => item.kind === "primary") ? "secondary" : "primary"),
      source: action.source ?? (sanitizeString(incident.source, 40) || "manual")
    });
  }

  if (incident.source === "readiness" && monthlyReportId) {
    addAction({
      label: "Open report readiness",
      href: adminHref(locale, `reports/${monthlyReportId}`, "readiness"),
      description: "Review the publish gate checks and clear readiness blockers.",
      anchor: "readiness"
    });
  }

  if (incident.source === "reconciliation") {
    if (allocationId) {
      addAction({
        label: "Open allocation reconciliation",
        href: adminHref(locale, `allocations/${allocationId}`, "reconciliation"),
        description: "Inspect ledger summaries, blocking issues, and correction history.",
        anchor: "reconciliation"
      });
    } else if (monthlyReportId) {
      addAction({
        label: "Open report reconciliation",
        href: adminHref(locale, `reports/${monthlyReportId}`, "reconciliation"),
        description: "Review linked allocation reconciliation status for this report.",
        anchor: "reconciliation"
      });
    }
  }

  if (incident.source === "risk_engine") {
    if (allocationId) {
      addAction({
        label: "Open allocation risk timeline",
        href: adminHref(locale, `allocations/${allocationId}`, "risk"),
        description: "Review risk factors, manual evaluations, and timeline events.",
        anchor: "risk"
      });
    } else if (monthlyReportId) {
      addAction({
        label: "Open report risk timeline",
        href: adminHref(locale, `reports/${monthlyReportId}`, "risk"),
        description: "Review portfolio risk events for the report snapshot.",
        anchor: "risk"
      });
    }
  }

  if (incident.source === "snapshot_integrity" && monthlyReportId) {
    addAction({
      label: "Open report snapshots",
      href: adminHref(locale, `reports/${monthlyReportId}`, "snapshots"),
      description: "Review snapshot controls and regenerate frozen report data if appropriate.",
      anchor: "snapshots"
    });
  }

  if (incident.source === "withdrawal") {
    addAction({
      label: "Open withdrawals",
      href: adminHref(locale, "withdrawals"),
      description: "Review payout requests, schedule state, and manager decision history.",
      anchor: null
    });
  }

  if (incident.source === "proof_completeness" && allocationId) {
    addAction({
      label: "Open proof requirements",
      href: adminHref(locale, `allocations/${allocationId}`, "proofs"),
      description: "Review missing evidence, accepted proof types, and operator guidance.",
      anchor: "proofs"
    });
  }

  if (allocationId) {
    addAction({
      label: "Open allocation",
      href: adminHref(locale, `allocations/${allocationId}`),
      description: "Open the linked allocation detail page.",
      anchor: null
    });
  }
  if (monthlyReportId) {
    addAction({
      label: "Open report",
      href: adminHref(locale, `reports/${monthlyReportId}`),
      description: "Open the linked monthly report detail page.",
      anchor: null
    });
  }
  if (investorId) {
    addAction({
      label: "Open investor",
      href: adminHref(locale, `investors/${investorId}`),
      description: "Open the linked investor profile.",
      anchor: null
    });
  }

  return actions;
}

export function buildOperationalIncidentIdentity(input: Pick<CreateOperationalIncidentInput, "incidentType" | "source" | "allocationId" | "monthlyReportId" | "investorId">) {
  return {
    incidentType: sanitizeString(input.incidentType, 80),
    source: input.source,
    allocationId: normalizeNullableId(input.allocationId),
    monthlyReportId: normalizeNullableId(input.monthlyReportId),
    investorId: normalizeNullableId(input.investorId)
  };
}

function buildIncidentAuditContext(incident: OperationalIncidentRecord) {
  return {
    id: incident.id,
    incidentType: incident.incidentType,
    source: incident.source,
    allocationId: incident.allocationId,
    monthlyReportId: incident.monthlyReportId,
    investorId: incident.investorId,
    severity: incident.severity,
    status: incident.status,
    title: incident.title
  };
}

export function isDuplicateUnresolvedIncident(candidate: Pick<CreateOperationalIncidentInput, "incidentType" | "source" | "allocationId" | "monthlyReportId" | "investorId">, existing: Pick<OperationalIncidentRecord, "incidentType" | "source" | "allocationId" | "monthlyReportId" | "investorId" | "status">) {
  const identity = buildOperationalIncidentIdentity(candidate);
  return UNRESOLVED_STATUSES.includes(existing.status as (typeof UNRESOLVED_STATUSES)[number])
    && existing.incidentType === identity.incidentType
    && existing.source === identity.source
    && existing.allocationId === identity.allocationId
    && existing.monthlyReportId === identity.monthlyReportId
    && existing.investorId === identity.investorId;
}

export async function createOperationalIncident(input: CreateOperationalIncidentInput, client: IncidentWriter = prisma) {
  const identity = buildOperationalIncidentIdentity(input);
  const existing = await client.operationalIncident.findFirst({
    where: {
      ...identity,
      status: { in: [...UNRESOLVED_STATUSES] }
    },
    orderBy: { detectedAt: "desc" }
  });

  if (existing) return { created: false, incident: existing };

  const metadata = sanitizeIncidentMetadata(input.metadata);
  const incident = await client.operationalIncident.create({
    data: {
      ...identity,
      severity: input.severity,
      status: input.status ?? "OPEN",
      title: sanitizeString(input.title, 180) || "Operational incident",
      summary: sanitizeString(input.summary, 1200) || "Operational incident requires manager review.",
      detectedAt: input.detectedAt ?? new Date(),
      metadataJson: JSON.stringify(metadata)
    }
  });

  await client.auditLog.create({
    data: {
      actor: sanitizeString(input.actor, 120) || "system",
      action: "CREATE_OPERATIONAL_INCIDENT",
      entityType: "OperationalIncident",
      entityId: incident.id,
      beforeJson: null,
      afterJson: JSON.stringify({ id: incident.id, ...identity, severity: incident.severity, status: incident.status, title: incident.title })
    }
  });

  return { created: true, incident };
}

export async function findMatchingOpenIncident(input: OperationalIncidentIdentity, client: IncidentReader = prisma) {
  const identity = buildOperationalIncidentIdentity(input);
  return client.operationalIncident.findFirst({
    where: {
      ...identity,
      status: { in: [...UNRESOLVED_STATUSES] }
    },
    orderBy: { detectedAt: "desc" }
  });
}

export async function upsertOperationalIncident(input: CreateOperationalIncidentInput, client: IncidentWriter = prisma) {
  const identity = buildOperationalIncidentIdentity(input);
  const actor = sanitizeString(input.actor, 120) || "system";
  const existing = await findMatchingOpenIncident(input, client);
  const metadata = {
    ...sanitizeIncidentMetadata(input.metadata),
    autoCreated: true,
    lastSignalAt: (input.detectedAt ?? new Date()).toISOString()
  };
  const metadataJson = JSON.stringify(metadata);

  if (existing) {
    const next = {
      severity: input.severity,
      title: sanitizeString(input.title, 180) || existing.title,
      summary: sanitizeString(input.summary, 1200) || existing.summary,
      metadataJson
    };
    const changed = existing.severity !== next.severity
      || existing.title !== next.title
      || existing.summary !== next.summary
      || existing.metadataJson !== next.metadataJson;

    if (!changed) return { created: false, updated: false, incident: existing };

    const incident = await client.operationalIncident.update({
      where: { id: existing.id },
      data: {
        ...next,
        detectedAt: input.detectedAt ?? new Date()
      }
    });

    await client.auditLog.create({
      data: {
        actor,
        action: "AUTO_UPDATE_OPERATIONAL_INCIDENT",
        entityType: "OperationalIncident",
        entityId: incident.id,
        beforeJson: JSON.stringify(buildIncidentAuditContext(existing)),
        afterJson: JSON.stringify({ ...buildIncidentAuditContext(incident), metadata })
      }
    });

    return { created: false, updated: true, incident };
  }

  const incident = await client.operationalIncident.create({
    data: {
      ...identity,
      severity: input.severity,
      status: input.status ?? "OPEN",
      title: sanitizeString(input.title, 180) || "Operational incident",
      summary: sanitizeString(input.summary, 1200) || "Operational incident requires manager review.",
      detectedAt: input.detectedAt ?? new Date(),
      metadataJson
    }
  });

  await client.auditLog.create({
    data: {
      actor,
      action: "AUTO_CREATE_OPERATIONAL_INCIDENT",
      entityType: "OperationalIncident",
      entityId: incident.id,
      beforeJson: null,
      afterJson: JSON.stringify({ ...buildIncidentAuditContext(incident), metadata })
    }
  });

  return { created: true, updated: false, incident };
}

export async function autoResolveOperationalIncident(input: OperationalIncidentIdentity & { actor?: string; reason?: string; metadata?: Record<string, unknown> | null }, client: IncidentWriter = prisma) {
  const actor = sanitizeString(input.actor, 120) || "system";
  const existing = await findMatchingOpenIncident(input, client);
  if (!existing) return { resolved: false, incident: null };

  const metadata = sanitizeIncidentMetadata({ ...(input.metadata ?? {}), autoResolved: true, reason: input.reason ?? "Signal returned to acceptable state." });
  const incident = await client.operationalIncident.update({
    where: { id: existing.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: actor,
      metadataJson: JSON.stringify(metadata)
    }
  });

  await client.auditLog.create({
    data: {
      actor,
      action: "AUTO_RESOLVE_OPERATIONAL_INCIDENT",
      entityType: "OperationalIncident",
      entityId: incident.id,
      beforeJson: JSON.stringify(buildIncidentAuditContext(existing)),
      afterJson: JSON.stringify({ ...buildIncidentAuditContext(incident), metadata })
    }
  });

  return { resolved: true, incident };
}

export async function acknowledgeOperationalIncident(input: { id: string; actor: string }, client: IncidentWriter = prisma) {
  const id = sanitizeString(input.id, 160);
  const actor = sanitizeString(input.actor, 120) || "admin";
  const current = await client.operationalIncident.findUnique({ where: { id } });
  if (!current) return { ok: false as const, status: 404 as const, error: "Incident not found." };
  if (current.status === "RESOLVED") return { ok: false as const, status: 409 as const, error: "Resolved incidents cannot be acknowledged." };
  if (current.status === "ACKNOWLEDGED") return { ok: true as const, incident: current };

  const incident = await client.operationalIncident.update({
    where: { id },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date(), acknowledgedBy: actor }
  });

  await client.auditLog.create({
    data: {
      actor,
      action: "ACKNOWLEDGE_OPERATIONAL_INCIDENT",
      entityType: "OperationalIncident",
      entityId: id,
      beforeJson: JSON.stringify({ status: current.status }),
      afterJson: JSON.stringify({ status: incident.status, acknowledgedBy: actor, acknowledgedAt: incident.acknowledgedAt?.toISOString() })
    }
  });

  return { ok: true as const, incident };
}

export async function resolveOperationalIncident(input: { id: string; actor: string }, client: IncidentWriter = prisma) {
  const id = sanitizeString(input.id, 160);
  const actor = sanitizeString(input.actor, 120) || "admin";
  const current = await client.operationalIncident.findUnique({ where: { id } });
  if (!current) return { ok: false as const, status: 404 as const, error: "Incident not found." };
  if (current.status === "RESOLVED") return { ok: true as const, incident: current };

  const incident = await client.operationalIncident.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: actor }
  });

  await client.auditLog.create({
    data: {
      actor,
      action: "RESOLVE_OPERATIONAL_INCIDENT",
      entityType: "OperationalIncident",
      entityId: id,
      beforeJson: JSON.stringify({ status: current.status }),
      afterJson: JSON.stringify({ status: incident.status, resolvedBy: actor, resolvedAt: incident.resolvedAt?.toISOString() })
    }
  });

  return { ok: true as const, incident };
}

function buildIncidentWhere(filters: OperationalIncidentFilters = {}) {
  const severity = sanitizeString(filters.severity, 20);
  const status = sanitizeString(filters.status, 24);
  const source = sanitizeString(filters.source, 40);
  const where: Prisma.OperationalIncidentWhereInput = {};
  if (severity && severity !== "ALL" && SEVERITY_SET.has(severity)) where.severity = severity;
  if (status && status !== "ALL" && STATUS_SET.has(status)) where.status = status;
  if (source && source !== "ALL" && SOURCE_SET.has(source)) where.source = source;
  return where;
}

function safeLimit(value: OperationalIncidentFilters["limit"]) {
  const numeric = Number(value ?? 100);
  return Math.max(1, Math.min(Number.isFinite(numeric) ? Math.trunc(numeric) : 100, 200));
}

export async function getOperationalIncidents(filters: OperationalIncidentFilters = {}, client: IncidentReader = prisma) {
  return client.operationalIncident.findMany({
    where: buildIncidentWhere(filters),
    orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
    take: safeLimit(filters.limit),
    include: {
      allocation: { select: { id: true, supplyCode: true, productName: true } },
      monthlyReport: { select: { id: true, month: true, title: true } },
      investor: { select: { id: true, fullName: true, email: true } }
    }
  });
}

export async function getOperationalIncidentDetail(id: string, localeOrClient: string | IncidentDetailClient = "en", clientArg?: IncidentDetailClient): Promise<OperationalIncidentDetail | null> {
  const incidentId = sanitizeString(id, 160);
  const locale = typeof localeOrClient === "string" ? localeOrClient : "en";
  const client = typeof localeOrClient === "string" ? clientArg ?? prisma : localeOrClient;
  const incident = await client.operationalIncident.findUnique({
    where: { id: incidentId },
    include: {
      allocation: { select: { id: true, supplyCode: true, productName: true } },
      monthlyReport: { select: { id: true, month: true, title: true } },
      investor: { select: { id: true, fullName: true, email: true } }
    }
  });
  if (!incident) return null;

  const auditRecords = await client.auditLog.findMany({
    where: {
      entityType: "OperationalIncident",
      entityId: incident.id
    },
    orderBy: { createdAt: "asc" },
    take: 50
  });
  const serialized = serializeOperationalIncident(incident);
  const { metadataJson: _metadataJson, ...safeIncident } = serialized;
  const metadataSummary = compactMetadataSummary(incident.metadataJson);
  const auditEvents = auditRecords.map((record) => ({
    id: record.id,
    actor: sanitizeString(record.actor, 120) || "system",
    action: sanitizeString(record.action, 120) || "AUDIT_EVENT",
    createdAt: record.createdAt.toISOString(),
    beforePreview: sanitizePreviewObject(record.beforeJson, ["id", "incidentType", "source", "allocationId", "monthlyReportId", "investorId", "severity", "status", "title"]),
    afterPreview: sanitizePreviewObject(record.afterJson, ["id", "incidentType", "source", "allocationId", "monthlyReportId", "investorId", "severity", "status", "title", "metadata"])
  }));
  const lifecycle: OperationalIncidentLifecycleEvent[] = [
    { label: "Detected", timestamp: incident.detectedAt.toISOString(), actor: null, detail: "Source signal detected." },
    ...auditEvents
      .filter((event) => event.action === "AUTO_CREATE_OPERATIONAL_INCIDENT" || event.action === "CREATE_OPERATIONAL_INCIDENT")
      .map((event) => ({ label: "Created", timestamp: event.createdAt, actor: event.actor, detail: "Incident record created." })),
    ...auditEvents
      .filter((event) => event.action === "AUTO_UPDATE_OPERATIONAL_INCIDENT")
      .map((event) => ({ label: "Auto updated", timestamp: event.createdAt, actor: event.actor, detail: "Operational signal refreshed this incident." })),
    ...(incident.acknowledgedAt ? [{ label: "Acknowledged", timestamp: incident.acknowledgedAt.toISOString(), actor: incident.acknowledgedBy, detail: "Manager acknowledged the incident." }] : []),
    ...(incident.resolvedAt ? [{ label: "Resolved", timestamp: incident.resolvedAt.toISOString(), actor: incident.resolvedBy, detail: "Incident was resolved." }] : [])
  ].sort((left, right) => left.timestamp.localeCompare(right.timestamp));

  return {
    incident: safeIncident,
    metadataSummary,
    metadataPreview: JSON.stringify(metadataSummary),
    sourceSignal: {
      source: incident.source,
      incidentType: incident.incidentType,
      operationalState: metadataString(metadataSummary, ["riskLevel", "currentLevel", "status", "currentStatus", "state", "reportStatus"]),
      score: metadataString(metadataSummary, ["riskScore", "currentScore", "score"]) === "Tracked" ? null : metadataString(metadataSummary, ["riskScore", "currentScore", "score"]),
      level: metadataString(metadataSummary, ["riskLevel", "currentLevel"]) === "Tracked" ? null : metadataString(metadataSummary, ["riskLevel", "currentLevel"])
    },
    linkedEntities: {
      allocation: serialized.allocation ?? null,
      monthlyReport: serialized.monthlyReport ?? null,
      investor: serialized.investor ?? null
    },
    lifecycle,
    auditEvents,
    triageActions: buildIncidentTriageActions(serialized, locale),
    recommendedNextAction: recommendedNextActionForIncident(incident)
  };
}

export async function getOpenOperationalIncidents(client: IncidentReader = prisma) {
  return client.operationalIncident.findMany({
    where: { status: { in: [...UNRESOLVED_STATUSES] } },
    orderBy: { detectedAt: "desc" }
  });
}

export function buildIncidentSummary(records: Array<Pick<OperationalIncidentRecord, "severity" | "status" | "source" | "detectedAt">>, now: Date = new Date()): IncidentSummary {
  const unresolved = records.filter((record) => UNRESOLVED_STATUSES.includes(record.status as (typeof UNRESOLVED_STATUSES)[number]));
  return {
    openCount: records.filter((record) => record.status === "OPEN").length,
    acknowledgedCount: records.filter((record) => record.status === "ACKNOWLEDGED").length,
    unresolvedCount: unresolved.length,
    criticalOpenCount: unresolved.filter((record) => record.severity === "CRITICAL").length,
    highOpenCount: unresolved.filter((record) => record.severity === "HIGH").length,
    staleUnresolvedCount: unresolved.filter((record) => now.getTime() - record.detectedAt.getTime() > STALE_INCIDENT_MS).length,
    bySource: unresolved.reduce<Record<string, number>>((counts, record) => {
      const source = "source" in record && typeof record.source === "string" ? record.source : "unknown";
      counts[source] = (counts[source] || 0) + 1;
      return counts;
    }, {})
  };
}

function riskIncidentSeverity(risk: Pick<AllocationRisk | PortfolioRisk, "level">): OperationalIncidentSeverity | null {
  if (risk.level === "CRITICAL") return "CRITICAL";
  if (risk.level === "HIGH") return "HIGH";
  return null;
}

export function buildIncidentCandidateFromRisk(risk: AllocationRisk | PortfolioRisk, options: { allocationId?: string | null; investorId?: string | null; monthlyReportId?: string | null } = {}): CreateOperationalIncidentInput | null {
  const severity = riskIncidentSeverity(risk);
  if (!severity) return null;
  const allocationId = "allocationId" in risk ? risk.allocationId : options.allocationId ?? null;
  return {
    incidentType: severity === "CRITICAL" ? "RISK_CRITICAL" : "RISK_HIGH",
    severity,
    title: `${severity === "CRITICAL" ? "Critical" : "High"} risk state detected`,
    summary: risk.adminSummary || "Risk engine detected an allocation or portfolio state requiring manager review.",
    allocationId,
    monthlyReportId: options.monthlyReportId ?? null,
    investorId: "investorId" in risk ? risk.investorId : options.investorId ?? null,
    source: "risk_engine",
    metadata: {
      riskLevel: risk.level,
      riskScore: risk.score,
      blockingIssueCount: risk.blockingIssues.length,
      warningCount: risk.warnings.length,
      factors: risk.riskFactors.slice(0, 8).map((factor) => ({ id: factor.id, severity: factor.severity, category: factor.category, label: factor.label }))
    }
  };
}

export async function createIncidentFromRisk(risk: AllocationRisk | PortfolioRisk, options: { actor?: string; allocationId?: string | null; investorId?: string | null; monthlyReportId?: string | null } = {}) {
  const candidate = buildIncidentCandidateFromRisk(risk, options);
  if (!candidate) return { created: false, incident: null };
  return createOperationalIncident({ ...candidate, actor: options.actor ?? "system" });
}

function riskIdentity(type: "RISK_HIGH" | "RISK_CRITICAL", risk: AllocationRisk | PortfolioRisk, options: { allocationId?: string | null; investorId?: string | null; monthlyReportId?: string | null } = {}): OperationalIncidentIdentity {
  return {
    incidentType: type,
    source: "risk_engine",
    allocationId: "allocationId" in risk ? risk.allocationId : options.allocationId ?? null,
    monthlyReportId: options.monthlyReportId ?? null,
    investorId: "investorId" in risk ? risk.investorId : options.investorId ?? null
  };
}

export async function syncOperationalIncidentFromRisk(risk: AllocationRisk | PortfolioRisk, options: { actor?: string; allocationId?: string | null; investorId?: string | null; monthlyReportId?: string | null; metadata?: Record<string, unknown> | null } = {}, client: IncidentWriter = prisma) {
  const candidate = buildIncidentCandidateFromRisk(risk, options);
  const baseMetadata = {
    ...(candidate?.metadata ?? {}),
    ...(options.metadata ?? {})
  };

  if (candidate) {
    const incident = await upsertOperationalIncident({ ...candidate, metadata: baseMetadata, actor: options.actor ?? "system" }, client);
    const opposite = candidate.incidentType === "RISK_CRITICAL" ? "RISK_HIGH" : "RISK_CRITICAL";
    await autoResolveOperationalIncident({ ...riskIdentity(opposite, risk, options), actor: options.actor, reason: "Risk severity changed.", metadata: { currentLevel: risk.level, currentScore: risk.score } }, client);
    return { ...incident, resolved: false };
  }

  const resolvedHigh = await autoResolveOperationalIncident({ ...riskIdentity("RISK_HIGH", risk, options), actor: options.actor, reason: "Risk dropped below high severity.", metadata: { currentLevel: risk.level, currentScore: risk.score } }, client);
  const resolvedCritical = await autoResolveOperationalIncident({ ...riskIdentity("RISK_CRITICAL", risk, options), actor: options.actor, reason: "Risk dropped below critical severity.", metadata: { currentLevel: risk.level, currentScore: risk.score } }, client);
  return { created: false, updated: false, resolved: resolvedHigh.resolved || resolvedCritical.resolved, incident: resolvedHigh.incident ?? resolvedCritical.incident };
}

export function buildIncidentCandidateFromReconciliation(reconciliation: AllocationReconciliation | MonthlyReportReconciliation, options: { allocationId?: string | null; monthlyReportId?: string | null; investorId?: string | null } = {}): CreateOperationalIncidentInput | null {
  if (reconciliation.status === "BALANCED") return null;
  const isBroken = reconciliation.status === "BROKEN";
  const allocationId = "allocationId" in reconciliation ? reconciliation.allocationId : options.allocationId ?? null;
  return {
    incidentType: isBroken ? "RECONCILIATION_BROKEN" : "RECONCILIATION_WARNING",
    severity: isBroken ? "CRITICAL" : "HIGH",
    title: isBroken ? "Broken reconciliation detected" : "Reconciliation warning detected",
    summary: isBroken ? "Three-ledger reconciliation has blocking exceptions." : "Three-ledger reconciliation has warnings that require manager review.",
    allocationId,
    monthlyReportId: "monthlyReportId" in reconciliation ? reconciliation.monthlyReportId : options.monthlyReportId ?? null,
    investorId: options.investorId ?? null,
    source: "reconciliation",
    metadata: {
      status: reconciliation.status,
      score: reconciliation.score,
      blockingIssueCount: reconciliation.blockingIssues.length,
      warningCount: reconciliation.warnings.length
    }
  };
}

export async function createIncidentFromReconciliation(reconciliation: AllocationReconciliation | MonthlyReportReconciliation, options: { actor?: string; allocationId?: string | null; monthlyReportId?: string | null; investorId?: string | null } = {}) {
  const candidate = buildIncidentCandidateFromReconciliation(reconciliation, options);
  if (!candidate) return { created: false, incident: null };
  return createOperationalIncident({ ...candidate, actor: options.actor ?? "system" });
}

function reconciliationIdentity(type: "RECONCILIATION_BROKEN" | "RECONCILIATION_WARNING", reconciliation: AllocationReconciliation | MonthlyReportReconciliation, options: { allocationId?: string | null; monthlyReportId?: string | null; investorId?: string | null } = {}): OperationalIncidentIdentity {
  return {
    incidentType: type,
    source: "reconciliation",
    allocationId: "allocationId" in reconciliation ? reconciliation.allocationId : options.allocationId ?? null,
    monthlyReportId: "monthlyReportId" in reconciliation ? reconciliation.monthlyReportId : options.monthlyReportId ?? null,
    investorId: options.investorId ?? null
  };
}

export async function syncOperationalIncidentFromReconciliation(reconciliation: AllocationReconciliation | MonthlyReportReconciliation, options: { actor?: string; allocationId?: string | null; monthlyReportId?: string | null; investorId?: string | null; metadata?: Record<string, unknown> | null } = {}, client: IncidentWriter = prisma) {
  const candidate = buildIncidentCandidateFromReconciliation(reconciliation, options);

  if (candidate) {
    const incident = await upsertOperationalIncident({ ...candidate, metadata: { ...(candidate.metadata ?? {}), ...(options.metadata ?? {}) }, actor: options.actor ?? "system" }, client);
    const opposite = candidate.incidentType === "RECONCILIATION_BROKEN" ? "RECONCILIATION_WARNING" : "RECONCILIATION_BROKEN";
    await autoResolveOperationalIncident({ ...reconciliationIdentity(opposite, reconciliation, options), actor: options.actor, reason: "Reconciliation status changed.", metadata: { currentStatus: reconciliation.status, currentScore: reconciliation.score } }, client);
    return { ...incident, resolved: false };
  }

  const resolvedBroken = await autoResolveOperationalIncident({ ...reconciliationIdentity("RECONCILIATION_BROKEN", reconciliation, options), actor: options.actor, reason: "Reconciliation returned to balanced state.", metadata: { currentStatus: reconciliation.status, currentScore: reconciliation.score } }, client);
  const resolvedWarning = await autoResolveOperationalIncident({ ...reconciliationIdentity("RECONCILIATION_WARNING", reconciliation, options), actor: options.actor, reason: "Reconciliation warnings cleared.", metadata: { currentStatus: reconciliation.status, currentScore: reconciliation.score } }, client);
  return { created: false, updated: false, resolved: resolvedBroken.resolved || resolvedWarning.resolved, incident: resolvedBroken.incident ?? resolvedWarning.incident };
}

export function buildIncidentCandidateFromReadiness(input: { reportId: string; investorId?: string | null; state: string; blockingIssueCount: number; warningCount: number; score?: number | null }): CreateOperationalIncidentInput | null {
  if (input.state !== "BLOCKED" && input.warningCount === 0) return null;
  const blocked = input.state === "BLOCKED";
  return {
    incidentType: blocked ? "READINESS_BLOCKED" : "READINESS_WARNING",
    severity: blocked ? "CRITICAL" : "HIGH",
    title: blocked ? "Report readiness blocked" : "Report readiness requires review",
    summary: blocked ? "Monthly report publish is blocked by readiness checks." : "Monthly report readiness has warnings that require manager review.",
    monthlyReportId: input.reportId,
    investorId: input.investorId ?? null,
    source: "readiness",
    metadata: {
      state: input.state,
      score: input.score ?? null,
      blockingIssueCount: input.blockingIssueCount,
      warningCount: input.warningCount
    }
  };
}

export async function createIncidentFromReadiness(input: { reportId: string; investorId?: string | null; state: string; blockingIssueCount: number; warningCount: number; score?: number | null; actor?: string }) {
  const candidate = buildIncidentCandidateFromReadiness(input);
  if (!candidate) return { created: false, incident: null };
  return createOperationalIncident({ ...candidate, actor: input.actor ?? "system" });
}

function readinessIdentity(type: "READINESS_BLOCKED" | "READINESS_WARNING", input: { reportId: string; investorId?: string | null }): OperationalIncidentIdentity {
  return {
    incidentType: type,
    source: "readiness",
    allocationId: null,
    monthlyReportId: input.reportId,
    investorId: input.investorId ?? null
  };
}

export async function syncOperationalIncidentFromReadiness(input: { reportId: string; investorId?: string | null; state: string; blockingIssueCount: number; warningCount: number; score?: number | null; actor?: string; metadata?: Record<string, unknown> | null }, client: IncidentWriter = prisma) {
  const candidate = buildIncidentCandidateFromReadiness(input);

  if (candidate) {
    const incident = await upsertOperationalIncident({ ...candidate, metadata: { ...(candidate.metadata ?? {}), ...(input.metadata ?? {}) }, actor: input.actor ?? "system" }, client);
    const opposite = candidate.incidentType === "READINESS_BLOCKED" ? "READINESS_WARNING" : "READINESS_BLOCKED";
    await autoResolveOperationalIncident({ ...readinessIdentity(opposite, input), actor: input.actor, reason: "Readiness state changed.", metadata: { currentState: input.state, currentScore: input.score ?? null } }, client);
    return { ...incident, resolved: false };
  }

  const resolvedBlocked = await autoResolveOperationalIncident({ ...readinessIdentity("READINESS_BLOCKED", input), actor: input.actor, reason: "Readiness blockers cleared.", metadata: { currentState: input.state, currentScore: input.score ?? null } }, client);
  const resolvedWarning = await autoResolveOperationalIncident({ ...readinessIdentity("READINESS_WARNING", input), actor: input.actor, reason: "Readiness warnings cleared.", metadata: { currentState: input.state, currentScore: input.score ?? null } }, client);
  return { created: false, updated: false, resolved: resolvedBlocked.resolved || resolvedWarning.resolved, incident: resolvedBlocked.incident ?? resolvedWarning.incident };
}

export function buildIncidentCandidateFromSnapshotIntegrity(input: {
  reportId: string;
  investorId?: string | null;
  status?: string | null;
  missingProofSnapshot?: boolean;
  missingReconciliationSnapshot?: boolean;
  missingRiskSnapshot?: boolean;
  staleSnapshot?: boolean;
  staleHours?: number | null;
}): CreateOperationalIncidentInput | null {
  const missingCount = [input.missingProofSnapshot, input.missingReconciliationSnapshot, input.missingRiskSnapshot].filter(Boolean).length;
  if (missingCount === 0 && !input.staleSnapshot) return null;
  const isCritical = missingCount > 0 && input.status === "PUBLISHED";
  return {
    incidentType: isCritical ? "SNAPSHOT_INTEGRITY_FAILURE" : "SNAPSHOT_STALE",
    severity: isCritical ? "CRITICAL" : "HIGH",
    title: isCritical ? "Published report snapshot integrity failure" : "Report snapshot is stale",
    summary: isCritical
      ? "Published monthly report is missing one or more frozen operational snapshots."
      : "Monthly report snapshot should be regenerated before readiness or publishing decisions.",
    allocationId: null,
    monthlyReportId: input.reportId,
    investorId: input.investorId ?? null,
    source: "snapshot_integrity",
    metadata: {
      reportStatus: input.status ?? null,
      missingProofSnapshot: Boolean(input.missingProofSnapshot),
      missingReconciliationSnapshot: Boolean(input.missingReconciliationSnapshot),
      missingRiskSnapshot: Boolean(input.missingRiskSnapshot),
      staleSnapshot: Boolean(input.staleSnapshot),
      staleHours: input.staleHours ?? null
    }
  };
}

function snapshotIdentity(type: "SNAPSHOT_INTEGRITY_FAILURE" | "SNAPSHOT_STALE", input: { reportId: string; investorId?: string | null }): OperationalIncidentIdentity {
  return {
    incidentType: type,
    source: "snapshot_integrity",
    allocationId: null,
    monthlyReportId: input.reportId,
    investorId: input.investorId ?? null
  };
}

export async function syncOperationalIncidentFromSnapshotIntegrity(input: {
  reportId: string;
  investorId?: string | null;
  status?: string | null;
  missingProofSnapshot?: boolean;
  missingReconciliationSnapshot?: boolean;
  missingRiskSnapshot?: boolean;
  staleSnapshot?: boolean;
  staleHours?: number | null;
  actor?: string;
}, client: IncidentWriter = prisma) {
  const candidate = buildIncidentCandidateFromSnapshotIntegrity(input);

  if (candidate) {
    const incident = await upsertOperationalIncident({ ...candidate, actor: input.actor ?? "system" }, client);
    const opposite = candidate.incidentType === "SNAPSHOT_INTEGRITY_FAILURE" ? "SNAPSHOT_STALE" : "SNAPSHOT_INTEGRITY_FAILURE";
    await autoResolveOperationalIncident({ ...snapshotIdentity(opposite, input), actor: input.actor, reason: "Snapshot integrity state changed.", metadata: candidate.metadata }, client);
    return { ...incident, resolved: false };
  }

  const resolvedMissing = await autoResolveOperationalIncident({ ...snapshotIdentity("SNAPSHOT_INTEGRITY_FAILURE", input), actor: input.actor, reason: "Snapshot integrity restored.", metadata: { reportStatus: input.status ?? null } }, client);
  const resolvedStale = await autoResolveOperationalIncident({ ...snapshotIdentity("SNAPSHOT_STALE", input), actor: input.actor, reason: "Snapshot regenerated or no longer stale.", metadata: { reportStatus: input.status ?? null } }, client);
  return { created: false, updated: false, resolved: resolvedMissing.resolved || resolvedStale.resolved, incident: resolvedMissing.incident ?? resolvedStale.incident };
}

export function serializeOperationalIncident(record: OperationalIncidentRecord & {
  allocation?: { id: string; supplyCode: string; productName: string } | null;
  monthlyReport?: { id: string; month: string; title: string } | null;
  investor?: { id: string; fullName: string; email: string } | null;
}): SerializedOperationalIncident {
  const now = Date.now();
  let metadata: Record<string, unknown> = {};
  try {
    metadata = record.metadataJson ? JSON.parse(record.metadataJson) as Record<string, unknown> : {};
  } catch {
    metadata = {};
  }
  return {
    id: record.id,
    incidentType: record.incidentType,
    severity: safeSeverity(record.severity),
    status: record.status,
    title: record.title,
    summary: record.summary,
    allocationId: record.allocationId,
    monthlyReportId: record.monthlyReportId,
    investorId: record.investorId,
    source: record.source,
    detectedAt: record.detectedAt.toISOString(),
    acknowledgedAt: record.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: record.acknowledgedBy,
    resolvedAt: record.resolvedAt?.toISOString() ?? null,
    resolvedBy: record.resolvedBy,
    metadataJson: JSON.stringify(sanitizeIncidentMetadata(metadata)),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    ageHours: Math.max(0, Math.round((now - record.detectedAt.getTime()) / 3_600_000)),
    allocation: record.allocation ?? null,
    monthlyReport: record.monthlyReport ?? null,
    investor: record.investor ?? null
  };
}
