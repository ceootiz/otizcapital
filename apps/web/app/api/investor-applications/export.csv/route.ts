import { getAdminSession } from "@/lib/admin-session";
import {
  APPLICATION_PRIORITIES,
  APPLICATION_SLA_FILTERS,
  APPLICATION_STATUSES,
  CRM_WORKFLOW_FILTERS,
  INVESTOR_APPLICATION_SORT_OPTIONS,
  REINVEST_INTEREST_OPTIONS,
  exportInvestorApplicationRecords,
  type ApplicationPriority,
  type ApplicationSlaFilter,
  type ApplicationStatus,
  type CrmWorkflowFilter,
  type InvestorApplicationSort,
  type ReinvestInterest
} from "@otiz/database";

export const dynamic = "force-dynamic";

const csvHeaders = [
  "id",
  "createdAt",
  "fullName",
  "telegram",
  "email",
  "country",
  "plannedAllocationAmount",
  "preferredDepositMethod",
  "investorType",
  "reinvestInterest",
  "status",
  "priority",
  "sourceLabel",
  "nextAction",
  "nextActionAt",
  "managerNotes"
] as const;

function sanitizeString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value);
}

function csvCell(value: string | number | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = getAdminSession();

  if (!session) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawStatus = sanitizeString(url.searchParams.get("status"), 40);
  const rawPriority = sanitizeString(url.searchParams.get("priority"), 20);
  const rawReinvestInterest = sanitizeString(url.searchParams.get("reinvestInterest"), 20);
  const rawWorkflow = sanitizeString(url.searchParams.get("workflow"), 40);
  const rawSla = sanitizeString(url.searchParams.get("sla"), 40);
  const rawSort = sanitizeString(url.searchParams.get("sort"), 40);
  const search = sanitizeString(url.searchParams.get("search"), 120);
  const sourceLabelSearch = sanitizeString(url.searchParams.get("source"), 160);
  const overdueNextAction = sanitizeString(url.searchParams.get("overdueNextAction"), 20);
  const status = rawStatus && isOneOf(rawStatus, APPLICATION_STATUSES) ? (rawStatus as ApplicationStatus) : undefined;
  const priority = rawPriority && isOneOf(rawPriority, APPLICATION_PRIORITIES) ? (rawPriority as ApplicationPriority) : undefined;
  const reinvestInterest =
    rawReinvestInterest && isOneOf(rawReinvestInterest, REINVEST_INTEREST_OPTIONS) ? (rawReinvestInterest as ReinvestInterest) : undefined;
  const workflow = rawWorkflow && isOneOf(rawWorkflow, CRM_WORKFLOW_FILTERS) ? (rawWorkflow as CrmWorkflowFilter) : undefined;
  const sla = rawSla && isOneOf(rawSla, APPLICATION_SLA_FILTERS) ? (rawSla as ApplicationSlaFilter) : undefined;
  const sort = rawSort && isOneOf(rawSort, INVESTOR_APPLICATION_SORT_OPTIONS) ? (rawSort as InvestorApplicationSort) : "smart";
  const records = await exportInvestorApplicationRecords({
    status,
    priority,
    reinvestInterest,
    workflow,
    sla,
    sort,
    sourceLabelSearch: sourceLabelSearch || undefined,
    overdueNextActionOnly: overdueNextAction === "true" || overdueNextAction === "1",
    search: search || undefined
  });

  const rows = records.map((record) => [
    record.id,
    record.createdAt.toISOString(),
    record.fullName,
    record.telegram,
    record.email,
    record.country,
    record.plannedAllocationAmount,
    record.preferredDepositMethod,
    record.investorType,
    record.reinvestInterest,
    record.status,
    record.priority,
    record.sourceLabel,
    record.nextAction,
    record.nextActionAt?.toISOString() ?? null,
    record.managerNotes
  ]);
  const csv = [csvHeaders.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=otiz-investor-applications.csv",
      "Cache-Control": "no-store"
    }
  });
}
