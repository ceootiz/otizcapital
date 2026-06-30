"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const SEVERITIES = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUSES = ["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const;
const SOURCES = ["ALL", "risk_engine", "reconciliation", "readiness", "snapshot_integrity", "withdrawal", "proof_completeness", "manual"] as const;

type Incident = {
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
  detectedAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
  ageHours: number;
  allocation?: { id: string; supplyCode: string; productName: string } | null;
  monthlyReport?: { id: string; month: string; title: string } | null;
  investor?: { id: string; fullName: string; email: string } | null;
};

type IncidentDetail = {
  incident: Omit<Incident, "metadataJson">;
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
    allocation?: Incident["allocation"];
    monthlyReport?: Incident["monthlyReport"];
    investor?: Incident["investor"];
  };
  lifecycle: Array<{
    label: string;
    timestamp: string;
    actor: string | null;
    detail: string;
  }>;
  auditEvents: Array<{
    id: string;
    actor: string;
    action: string;
    createdAt: string;
    beforePreview: Record<string, unknown> | null;
    afterPreview: Record<string, unknown> | null;
  }>;
  triageActions: Array<{
    label: string;
    href: string;
    kind: "primary" | "secondary";
    description: string;
    source: string;
    anchor: string | null;
  }>;
  recommendedNextAction: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function severityTone(severity: string) {
  if (severity === "CRITICAL") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (severity === "HIGH") return "border-gold-200/30 bg-gold-200/10 text-gold-100";
  if (severity === "MEDIUM") return "border-white/15 bg-white/[0.06] text-foreground";
  return "border-white/10 bg-white/[0.04] text-muted-foreground";
}

function statusTone(status: string) {
  if (status === "OPEN") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (status === "ACKNOWLEDGED") return "border-gold-200/30 bg-gold-200/10 text-gold-100";
  return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
}

function sourceLabel(source: string) {
  return source.replace(/_/g, " ");
}

function parseIncidentMetadata(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function metadataValue(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return "Tracked";
}

function compactJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) return "No metadata stored.";
  return JSON.stringify(value);
}

export function AdminIncidentsPage({ locale, incidents: initialIncidents }: { locale: Locale; incidents: Incident[] }) {
  const [incidents, setIncidents] = React.useState(initialIncidents);
  const [severity, setSeverity] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");
  const [source, setSource] = React.useState("ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = React.useState<string | null>(null);
  const [pendingDetailId, setPendingDetailId] = React.useState<string | null>(null);
  const [detailsById, setDetailsById] = React.useState<Record<string, IncidentDetail>>({});
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visibleIncidents = incidents.filter((incident) =>
    (severity === "ALL" || incident.severity === severity)
    && (status === "ALL" || incident.status === status)
    && (source === "ALL" || incident.source === source)
  );
  const unresolvedCount = incidents.filter((incident) => incident.status !== "RESOLVED").length;
  const criticalCount = incidents.filter((incident) => incident.status !== "RESOLVED" && incident.severity === "CRITICAL").length;

  async function runAction(incident: Incident, action: "acknowledge" | "resolve") {
    setPendingId(incident.id);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/incidents/${incident.id}/${action}`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({})
      });
      const payload = (await response.json()) as { ok: boolean; data?: Incident; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to update incident.");
      setIncidents((current) => current.map((item) => (item.id === incident.id ? payload.data as Incident : item)));
      setDetailsById((current) => {
        const { [incident.id]: _stale, ...rest } = current;
        return rest;
      });
      setNotice(action === "acknowledge" ? "Incident acknowledged." : "Incident resolved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update incident.");
    } finally {
      setPendingId(null);
    }
  }

  async function toggleDetails(incident: Incident) {
    if (selectedDetailId === incident.id) {
      setSelectedDetailId(null);
      return;
    }

    setSelectedDetailId(incident.id);
    setError(null);
    if (detailsById[incident.id]) return;

    setPendingDetailId(incident.id);
    try {
      const response = await fetch(`/api/admin/incidents/${incident.id}?locale=${encodeURIComponent(locale)}`);
      const payload = (await response.json()) as { ok: boolean; data?: IncidentDetail; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load incident detail.");
      setDetailsById((current) => ({ ...current, [incident.id]: payload.data as IncidentDetail }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load incident detail.");
    } finally {
      setPendingDetailId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/checkpoint-health`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to checkpoint health</Link>
            <AdminNavigation locale={locale} activeSection="incidents" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Admin operations</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">Incident center</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Operational alerts for risk, reconciliation, readiness, withdrawals, proof completeness, and manual manager review. Investor pages do not expose raw incident internals.</p>
              </div>
              <div className="grid gap-2 text-right">
                <Badge className={`justify-center rounded-full border px-4 py-2 ${criticalCount ? severityTone("CRITICAL") : severityTone("LOW")}`}>{criticalCount} critical</Badge>
                <p className="text-3xl font-semibold text-foreground">{unresolvedCount}</p>
                <p className="text-xs text-muted-foreground">Unresolved incidents</p>
              </div>
            </CardContent>
          </Card>

          {notice ? <Notice tone="success" message={notice} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.72]">
            <CardContent className="grid gap-3 p-4 md:grid-cols-3">
              <Filter label="Severity" value={severity} onChange={setSeverity} options={SEVERITIES} />
              <Filter label="Status" value={status} onChange={setStatus} options={STATUSES} />
              <Filter label="Source" value={source} onChange={setSource} options={SOURCES} />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {visibleIncidents.length === 0 ? (
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto size-9 text-gold-100" /><p className="mt-4 font-semibold text-foreground">No incidents for the current filters</p><p className="mt-2 text-sm text-muted-foreground">Operational incidents will appear here when risk, reconciliation, readiness, withdrawal, proof, or manual checks create one.</p></CardContent></Card>
            ) : visibleIncidents.map((incident) => {
              const metadata = parseIncidentMetadata(incident.metadataJson);
              const autoCreated = metadata.autoCreated === true ? "Auto-created" : "Manual";
              const operationalState = metadataValue(metadata, ["riskLevel", "status", "state", "currentStatus", "reportStatus"]);
              const lastRefresh = typeof metadata.lastSignalAt === "string" ? metadata.lastSignalAt : incident.updatedAt;
              const detail = detailsById[incident.id];
              const detailsOpen = selectedDetailId === incident.id;
              return (
              <Card key={incident.id} className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`border ${severityTone(incident.severity)}`}>{incident.severity}</Badge>
                        <Badge className={`border ${statusTone(incident.status)}`}>{incident.status}</Badge>
                        <Badge variant="secondary">{sourceLabel(incident.source)}</Badge>
                      </div>
                      <CardTitle className="mt-4 flex items-center gap-2"><ShieldAlert className="size-5 text-gold-100" />{incident.title}</CardTitle>
                      <CardDescription>{incident.summary}</CardDescription>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Detected {formatDate(incident.detectedAt)}</p>
                      <p>{incident.ageHours}h old</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Metric label="Incident type" value={incident.incidentType} />
                    <Metric label="Creation mode" value={autoCreated} />
                    <Metric label="Operational state" value={operationalState} />
                    <Metric label="Last refresh" value={formatDate(lastRefresh)} />
                    <Metric label="Acknowledged" value={incident.acknowledgedAt ? `${formatDate(incident.acknowledgedAt)} by ${incident.acknowledgedBy || "admin"}` : "Not acknowledged"} />
                    <Metric label="Resolved" value={incident.resolvedAt ? `${formatDate(incident.resolvedAt)} by ${incident.resolvedBy || "admin"}` : "Open"} />
                  </div>
                  <LinkedEntities locale={locale} incident={incident} />
                  <Separator />
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground"><AlertTriangle className="mr-2 inline size-4 text-gold-100" />Incident metadata is sanitized. Raw ledger metadata, internal risk mechanics, and audit internals are not shown to investors.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={pendingDetailId === incident.id} onClick={() => toggleDetails(incident)}>{detailsOpen ? "Hide details" : pendingDetailId === incident.id ? "Loading..." : "Details"}</Button>
                      <Button type="button" variant="outline" size="sm" disabled={pendingId === incident.id || incident.status !== "OPEN"} onClick={() => runAction(incident, "acknowledge")}>Acknowledge</Button>
                      <Button type="button" size="sm" disabled={pendingId === incident.id || incident.status === "RESOLVED"} onClick={() => runAction(incident, "resolve")}>Resolve</Button>
                    </div>
                  </div>
                  {detailsOpen ? <IncidentDetailDrawer locale={locale} detail={detail} loading={pendingDetailId === incident.id} /> : null}
                </CardContent>
              </Card>
            );})}
          </div>
        </div>
      </section>
    </main>
  );
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
        {options.map((option) => <option key={option} value={option}>{sourceLabel(option)}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm leading-6 text-foreground">{value}</p></div>;
}

function LinkedEntities({ locale, incident }: { locale: Locale; incident: Incident }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <EntityLink label="Allocation" href={incident.allocation ? `/${locale}/admin/allocations/${incident.allocation.id}` : null} value={incident.allocation ? `${incident.allocation.supplyCode} · ${incident.allocation.productName}` : "Not linked"} />
      <EntityLink label="Report" href={incident.monthlyReport ? `/${locale}/admin/reports/${incident.monthlyReport.id}` : null} value={incident.monthlyReport ? `${incident.monthlyReport.month} · ${incident.monthlyReport.title}` : "Not linked"} />
      <EntityLink label="Investor" href={incident.investor ? `/${locale}/admin/investors/${incident.investor.id}` : null} value={incident.investor ? `${incident.investor.fullName} · ${incident.investor.email}` : "Not linked"} />
    </div>
  );
}

function EntityLink({ label, href, value }: { label: string; href: string | null; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>{href ? <Link href={href} className="mt-2 block break-words text-sm font-semibold leading-6 text-gold-100 hover:text-gold-50">{value}</Link> : <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>}</div>;
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>;
}

function IncidentDetailDrawer({ locale, detail, loading }: { locale: Locale; detail?: IncidentDetail; loading: boolean }) {
  if (loading) {
    return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">Loading sanitized incident detail...</div>;
  }
  if (!detail) {
    return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">No detailed incident context loaded yet.</div>;
  }

  return (
    <div className="grid gap-4 rounded-[1.75rem] border border-gold-200/15 bg-black/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">Incident detail</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{detail.incident.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail.incident.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`border ${severityTone(detail.incident.severity)}`}>{detail.incident.severity}</Badge>
          <Badge className={`border ${statusTone(detail.incident.status)}`}>{detail.incident.status}</Badge>
          <Badge variant="secondary">{sourceLabel(detail.sourceSignal.source)}</Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Signal" value={detail.sourceSignal.incidentType} />
        <Metric label="State" value={detail.sourceSignal.operationalState} />
        <Metric label="Score" value={detail.sourceSignal.score || "Not stored"} />
        <Metric label="Level" value={detail.sourceSignal.level || "Not stored"} />
      </div>

      <LinkedEntities locale={locale} incident={{
        ...detail.incident,
        metadataJson: null,
        allocation: detail.linkedEntities.allocation ?? null,
        monthlyReport: detail.linkedEntities.monthlyReport ?? null,
        investor: detail.linkedEntities.investor ?? null
      }} />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Triage actions</p>
        {detail.triageActions.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">No direct triage action is available for this incident.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {detail.triageActions.map((action) => (
              <Link key={`${action.href}-${action.label}`} href={action.href} className={`rounded-2xl border p-4 transition-colors ${action.kind === "primary" ? "border-gold-200/30 bg-gold-200/10 hover:bg-gold-200/15" : "border-white/10 bg-black/20 hover:bg-white/[0.06]"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{action.label}</span>
                  <Badge variant={action.kind === "primary" ? "default" : "secondary"}>{action.kind}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{action.description}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sanitized metadata preview</p>
        <p className="mt-2 break-words font-mono text-xs leading-6 text-foreground">{detail.metadataPreview || compactJson(detail.metadataSummary)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title="Lifecycle timeline" empty="No lifecycle events stored.">
          {detail.lifecycle.map((event) => (
            <TimelineRow key={`${event.label}-${event.timestamp}`} title={event.label} meta={`${formatDate(event.timestamp)}${event.actor ? ` · ${event.actor}` : ""}`} body={event.detail} />
          ))}
        </DetailSection>
        <DetailSection title="Related audit events" empty="No related audit events stored for this incident.">
          {detail.auditEvents.map((event) => (
            <TimelineRow key={event.id} title={event.action} meta={`${formatDate(event.createdAt)} · ${event.actor}`} body={compactJson(event.afterPreview)} />
          ))}
        </DetailSection>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recommended next action</p>
        <p className="mt-2 text-sm leading-6 text-foreground">{detail.recommendedNextAction}</p>
      </div>
    </div>
  );
}

function DetailSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = React.Children.count(children) > 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <div className="mt-3 grid gap-3">
        {hasChildren ? children : <p className="text-sm leading-6 text-muted-foreground">{empty}</p>}
      </div>
    </div>
  );
}

function TimelineRow({ title, meta, body }: { title: string; meta: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}
