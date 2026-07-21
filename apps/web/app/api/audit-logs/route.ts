import { NextResponse } from "next/server";
import { isProductFeatureEnabled, listAuditLogs, searchAuditLogs, serializeAuditLog } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

function sanitizeString(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request) {
  const session = getAdminSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const entityType = sanitizeString(url.searchParams.get("entityType"));
  const entityId = sanitizeString(url.searchParams.get("entityId"));

  if (entityType && entityId && url.searchParams.get("scope") !== "global") {
    const items = await listAuditLogs({ entityType, entityId });
    return NextResponse.json({ ok: true, data: items.map(serializeAuditLog) });
  }

  if (url.searchParams.get("scope") !== "global") {
    return NextResponse.json({ ok: false, error: "entityType and entityId are required." }, { status: 422 });
  }

  if (!(await isProductFeatureEnabled("audit-log"))) {
    return NextResponse.json({ ok: false, error: "Global audit log is not enabled." }, { status: 404 });
  }

  const parseDate = (value: string | null, endOfDay = false) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };
  const format = url.searchParams.get("format");
  const result = await searchAuditLogs({
    query: sanitizeString(url.searchParams.get("query")),
    actor: sanitizeString(url.searchParams.get("actor")),
    action: sanitizeString(url.searchParams.get("action")),
    entityType: sanitizeString(url.searchParams.get("entityType")),
    dateFrom: parseDate(url.searchParams.get("dateFrom")),
    dateTo: parseDate(url.searchParams.get("dateTo"), true),
    page: format === "csv" ? 1 : Number(url.searchParams.get("page")) || 1,
    pageSize: format === "csv" ? 5000 : 30
  });

  if (format === "csv") {
    const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["createdAt", "actor", "action", "entityType", "entityId", "beforeJson", "afterJson"],
      ...result.rows.map((row) => [row.createdAt.toISOString(), row.actor, row.action, row.entityType, row.entityId, row.beforeJson ?? "", row.afterJson ?? ""])
    ].map((row) => row.map(csvCell).join(","));
    return new Response(`\uFEFF${lines.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="otiz-audit-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  return NextResponse.json({
    ok: true,
    data: result.rows.map(serializeAuditLog),
    pagination: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages }
  });
}
