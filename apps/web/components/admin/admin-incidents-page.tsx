"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const STRINGS = {
  en: {
    BACK: "Back to checkpoint health",
    EYEBROW: "Admin operations",
    TITLE: "Incident center",
    DESCRIPTION: "Operational alerts for risk, reconciliation, readiness, withdrawals, proof completeness, and manual manager review. Investor pages do not expose raw incident internals.",
    CRITICAL_SUFFIX: "critical",
    UNRESOLVED_INCIDENTS: "Unresolved incidents",
    SEVERITY: "Severity",
    STATUS: "Status",
    SOURCE: "Source",
    EMPTY_TITLE: "No incidents for the current filters",
    EMPTY_BODY: "Operational incidents will appear here when risk, reconciliation, readiness, withdrawal, proof, or manual checks create one.",
    DETECTED: "Detected",
    AGE_SUFFIX: "h old",
    INCIDENT_TYPE: "Incident type",
    CREATION_MODE: "Creation mode",
    OPERATIONAL_STATE: "Operational state",
    LAST_REFRESH: "Last refresh",
    ACKNOWLEDGED: "Acknowledged",
    RESOLVED: "Resolved",
    AUTO_CREATED: "Auto-created",
    MANUAL: "Manual",
    NOT_ACKNOWLEDGED: "Not acknowledged",
    OPEN: "Open",
    BY: "by",
    ADMIN_FALLBACK: "admin",
    ALLOCATION: "Allocation",
    REPORT: "Report",
    INVESTOR: "Investor",
    NOT_LINKED: "Not linked",
    SANITIZED_NOTICE: "Incident metadata is sanitized. Raw ledger metadata, internal risk mechanics, and audit internals are not shown to investors.",
    DETAILS: "Details",
    HIDE_DETAILS: "Hide details",
    LOADING: "Loading...",
    ACKNOWLEDGE: "Acknowledge",
    RESOLVE: "Resolve",
    INCIDENT_ACKNOWLEDGED: "Incident acknowledged.",
    INCIDENT_RESOLVED: "Incident resolved.",
    UNABLE_TO_UPDATE: "Unable to update incident.",
    UNABLE_TO_LOAD: "Unable to load incident detail.",
    INCIDENT_DETAIL: "Incident detail",
    SIGNAL: "Signal",
    STATE: "State",
    SCORE: "Score",
    LEVEL: "Level",
    NOT_STORED: "Not stored",
    TRIAGE_ACTIONS: "Triage actions",
    TRIAGE_EMPTY: "No direct triage action is available for this incident.",
    SANITIZED_METADATA_PREVIEW: "Sanitized metadata preview",
    LIFECYCLE_TIMELINE: "Lifecycle timeline",
    LIFECYCLE_EMPTY: "No lifecycle events stored.",
    RELATED_AUDIT_EVENTS: "Related audit events",
    AUDIT_EMPTY: "No related audit events stored for this incident.",
    RECOMMENDED_NEXT_ACTION: "Recommended next action",
    LOADING_DETAIL: "Loading sanitized incident detail...",
    NO_CONTEXT_LOADED: "No detailed incident context loaded yet.",
    NO_METADATA_STORED: "No metadata stored.",
    TRACKED: "Tracked"
  },
  ru: {
    BACK: "Назад к состоянию контрольных точек",
    EYEBROW: "Административные операции",
    TITLE: "Центр инцидентов",
    DESCRIPTION: "Операционные оповещения по рискам, сверке, готовности, выводам средств, полноте подтверждений и ручной проверке менеджером. Страницы инвесторов не раскрывают внутренние данные инцидентов.",
    CRITICAL_SUFFIX: "критических",
    UNRESOLVED_INCIDENTS: "Нерешённые инциденты",
    SEVERITY: "Серьёзность",
    STATUS: "Статус",
    SOURCE: "Источник",
    EMPTY_TITLE: "Нет инцидентов по текущим фильтрам",
    EMPTY_BODY: "Операционные инциденты появятся здесь, когда их создадут проверки рисков, сверки, готовности, вывода средств, подтверждений или ручные проверки.",
    DETECTED: "Обнаружен",
    AGE_SUFFIX: " ч",
    INCIDENT_TYPE: "Тип инцидента",
    CREATION_MODE: "Режим создания",
    OPERATIONAL_STATE: "Операционное состояние",
    LAST_REFRESH: "Последнее обновление",
    ACKNOWLEDGED: "Принят",
    RESOLVED: "Решён",
    AUTO_CREATED: "Создан автоматически",
    MANUAL: "Вручную",
    NOT_ACKNOWLEDGED: "Не принят",
    OPEN: "Открыт",
    BY: "·",
    ADMIN_FALLBACK: "администратор",
    ALLOCATION: "Аллокация",
    REPORT: "Отчёт",
    INVESTOR: "Инвестор",
    NOT_LINKED: "Не связано",
    SANITIZED_NOTICE: "Метаданные инцидента очищены. Сырые метаданные реестра, внутренняя механика рисков и служебные данные аудита инвесторам не показываются.",
    DETAILS: "Подробности",
    HIDE_DETAILS: "Скрыть подробности",
    LOADING: "Загрузка...",
    ACKNOWLEDGE: "Принять",
    RESOLVE: "Решить",
    INCIDENT_ACKNOWLEDGED: "Инцидент принят.",
    INCIDENT_RESOLVED: "Инцидент решён.",
    UNABLE_TO_UPDATE: "Не удалось обновить инцидент.",
    UNABLE_TO_LOAD: "Не удалось загрузить данные инцидента.",
    INCIDENT_DETAIL: "Детали инцидента",
    SIGNAL: "Сигнал",
    STATE: "Состояние",
    SCORE: "Оценка",
    LEVEL: "Уровень",
    NOT_STORED: "Не сохранено",
    TRIAGE_ACTIONS: "Действия по разбору",
    TRIAGE_EMPTY: "Для этого инцидента нет прямого действия по разбору.",
    SANITIZED_METADATA_PREVIEW: "Предпросмотр очищенных метаданных",
    LIFECYCLE_TIMELINE: "Хронология жизненного цикла",
    LIFECYCLE_EMPTY: "События жизненного цикла не сохранены.",
    RELATED_AUDIT_EVENTS: "Связанные события аудита",
    AUDIT_EMPTY: "Связанные события аудита для этого инцидента не сохранены.",
    RECOMMENDED_NEXT_ACTION: "Рекомендуемое следующее действие",
    LOADING_DETAIL: "Загрузка очищенных данных инцидента...",
    NO_CONTEXT_LOADED: "Подробный контекст инцидента ещё не загружен.",
    NO_METADATA_STORED: "Метаданные не сохранены.",
    TRACKED: "Отслеживается"
  }
} as const;

type Strings = typeof STRINGS.en;

const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

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

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
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

function parseIncidentMetadata(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function metadataValue(metadata: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return fallback;
}

function compactJson(value: unknown, emptyLabel: string) {
  if (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0)) return emptyLabel;
  return JSON.stringify(value);
}

export function AdminIncidentsPage({ locale, incidents: initialIncidents }: { locale: Locale; incidents: Incident[] }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.UNABLE_TO_UPDATE);
      setIncidents((current) => current.map((item) => (item.id === incident.id ? payload.data as Incident : item)));
      setDetailsById((current) => {
        const { [incident.id]: _stale, ...rest } = current;
        return rest;
      });
      setNotice(action === "acknowledge" ? t.INCIDENT_ACKNOWLEDGED : t.INCIDENT_RESOLVED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.UNABLE_TO_UPDATE);
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.UNABLE_TO_LOAD);
      setDetailsById((current) => ({ ...current, [incident.id]: payload.data as IncidentDetail }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.UNABLE_TO_LOAD);
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
            <Link href={`/${locale}/admin/checkpoint-health`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />{t.BACK}</Link>
            <AdminNavigation locale={locale} activeSection="incidents" />
          </div>

          <Card className="mb-6 rounded-[1.35rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.EYEBROW}</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.TITLE}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{t.DESCRIPTION}</p>
              </div>
              <div className="grid gap-2 text-right">
                <Badge className={`justify-center rounded-full border px-4 py-2 ${criticalCount ? severityTone("CRITICAL") : severityTone("LOW")}`}>{criticalCount} {t.CRITICAL_SUFFIX}</Badge>
                <p className="text-3xl font-semibold text-foreground">{unresolvedCount}</p>
                <p className="text-xs text-muted-foreground">{t.UNRESOLVED_INCIDENTS}</p>
              </div>
            </CardContent>
          </Card>

          {notice ? <Notice tone="success" message={notice} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}

          <Card className="mb-6 rounded-[1.35rem] bg-graphite-900/[0.72]">
            <CardContent className="grid gap-3 p-4 md:grid-cols-3">
              <Filter label={t.SEVERITY} value={severity} onChange={setSeverity} options={SEVERITIES} group="incidentSeverity" locale={locale} />
              <Filter label={t.STATUS} value={status} onChange={setStatus} options={STATUSES} group="incidentStatus" locale={locale} />
              <Filter label={t.SOURCE} value={source} onChange={setSource} options={SOURCES} group="riskSource" locale={locale} />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {visibleIncidents.length === 0 ? (
              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto size-9 text-gold-100" /><p className="mt-4 font-semibold text-foreground">{t.EMPTY_TITLE}</p><p className="mt-2 text-sm text-muted-foreground">{t.EMPTY_BODY}</p></CardContent></Card>
            ) : visibleIncidents.map((incident) => {
              const metadata = parseIncidentMetadata(incident.metadataJson);
              const autoCreated = metadata.autoCreated === true ? t.AUTO_CREATED : t.MANUAL;
              const operationalState = metadataValue(metadata, ["riskLevel", "status", "state", "currentStatus", "reportStatus"], t.TRACKED);
              const lastRefresh = typeof metadata.lastSignalAt === "string" ? metadata.lastSignalAt : incident.updatedAt;
              const detail = detailsById[incident.id];
              const detailsOpen = selectedDetailId === incident.id;
              return (
              <Card key={incident.id} className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`border ${severityTone(incident.severity)}`}>{enumLabel("incidentSeverity", incident.severity, locale)}</Badge>
                        <Badge className={`border ${statusTone(incident.status)}`}>{enumLabel("incidentStatus", incident.status, locale)}</Badge>
                        <Badge variant="secondary">{enumLabel("riskSource", incident.source, locale)}</Badge>
                      </div>
                      <CardTitle className="mt-4 flex items-center gap-2"><ShieldAlert className="size-5 text-gold-100" />{incident.title}</CardTitle>
                      <CardDescription>{incident.summary}</CardDescription>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{t.DETECTED} {formatters.dateTime(incident.detectedAt)}</p>
                      <p>{incident.ageHours}{t.AGE_SUFFIX}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Metric label={t.INCIDENT_TYPE} value={incident.incidentType} />
                    <Metric label={t.CREATION_MODE} value={autoCreated} />
                    <Metric label={t.OPERATIONAL_STATE} value={operationalState} />
                    <Metric label={t.LAST_REFRESH} value={formatters.dateTime(lastRefresh)} />
                    <Metric label={t.ACKNOWLEDGED} value={incident.acknowledgedAt ? `${formatters.dateTime(incident.acknowledgedAt)} ${t.BY} ${incident.acknowledgedBy || t.ADMIN_FALLBACK}` : t.NOT_ACKNOWLEDGED} />
                    <Metric label={t.RESOLVED} value={incident.resolvedAt ? `${formatters.dateTime(incident.resolvedAt)} ${t.BY} ${incident.resolvedBy || t.ADMIN_FALLBACK}` : t.OPEN} />
                  </div>
                  <LinkedEntities locale={locale} incident={incident} t={t} />
                  <Separator />
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground"><AlertTriangle className="mr-2 inline size-4 text-gold-100" />{t.SANITIZED_NOTICE}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={pendingDetailId === incident.id} onClick={() => toggleDetails(incident)}>{detailsOpen ? t.HIDE_DETAILS : pendingDetailId === incident.id ? t.LOADING : t.DETAILS}</Button>
                      <Button type="button" variant="outline" size="sm" disabled={pendingId === incident.id || incident.status !== "OPEN"} onClick={() => runAction(incident, "acknowledge")}>{t.ACKNOWLEDGE}</Button>
                      <Button type="button" size="sm" disabled={pendingId === incident.id || incident.status === "RESOLVED"} onClick={() => runAction(incident, "resolve")}>{t.RESOLVE}</Button>
                    </div>
                  </div>
                  {detailsOpen ? <IncidentDetailDrawer locale={locale} detail={detail} loading={pendingDetailId === incident.id} t={t} formatters={formatters} /> : null}
                </CardContent>
              </Card>
            );})}
          </div>
        </div>
      </section>
    </main>
  );
}

function Filter({ label, value, onChange, options, group, locale }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; group: "incidentSeverity" | "incidentStatus" | "riskSource"; locale: Locale }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
        {options.map((option) => <option key={option} value={option}>{enumLabel(group, option, locale)}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 break-words text-sm leading-6 text-foreground">{value}</p></div>;
}

function LinkedEntities({ locale, incident, t }: { locale: Locale; incident: Incident; t: Strings }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <EntityLink label={t.ALLOCATION} href={incident.allocation ? `/${locale}/admin/allocations/${incident.allocation.id}` : null} value={incident.allocation ? `${incident.allocation.supplyCode} · ${incident.allocation.productName}` : t.NOT_LINKED} />
      <EntityLink label={t.REPORT} href={incident.monthlyReport ? `/${locale}/admin/reports/${incident.monthlyReport.id}` : null} value={incident.monthlyReport ? `${incident.monthlyReport.month} · ${incident.monthlyReport.title}` : t.NOT_LINKED} />
      <EntityLink label={t.INVESTOR} href={incident.investor ? `/${locale}/admin/investors/${incident.investor.id}` : null} value={incident.investor ? `${incident.investor.fullName} · ${incident.investor.email}` : t.NOT_LINKED} />
    </div>
  );
}

function EntityLink({ label, href, value }: { label: string; href: string | null; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>{href ? <Link href={href} className="mt-2 block break-words text-sm font-semibold leading-6 text-gold-100 hover:text-gold-50">{value}</Link> : <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>}</div>;
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return <div className={`mb-6 rounded-[1.35rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>;
}

function IncidentDetailDrawer({ locale, detail, loading, t, formatters }: { locale: Locale; detail?: IncidentDetail; loading: boolean; t: Strings; formatters: ReturnType<typeof createAdminFormatters> }) {
  if (loading) {
    return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">{t.LOADING_DETAIL}</div>;
  }
  if (!detail) {
    return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-5 text-sm text-muted-foreground">{t.NO_CONTEXT_LOADED}</div>;
  }

  return (
    <div className="grid gap-4 rounded-[1.35rem] border border-gold-200/15 bg-black/25 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">{t.INCIDENT_DETAIL}</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{detail.incident.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail.incident.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`border ${severityTone(detail.incident.severity)}`}>{enumLabel("incidentSeverity", detail.incident.severity, locale)}</Badge>
          <Badge className={`border ${statusTone(detail.incident.status)}`}>{enumLabel("incidentStatus", detail.incident.status, locale)}</Badge>
          <Badge variant="secondary">{enumLabel("riskSource", detail.sourceSignal.source, locale)}</Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label={t.SIGNAL} value={detail.sourceSignal.incidentType} />
        <Metric label={t.STATE} value={detail.sourceSignal.operationalState} />
        <Metric label={t.SCORE} value={detail.sourceSignal.score || t.NOT_STORED} />
        <Metric label={t.LEVEL} value={detail.sourceSignal.level || t.NOT_STORED} />
      </div>

      <LinkedEntities locale={locale} t={t} incident={{
        ...detail.incident,
        metadataJson: null,
        allocation: detail.linkedEntities.allocation ?? null,
        monthlyReport: detail.linkedEntities.monthlyReport ?? null,
        investor: detail.linkedEntities.investor ?? null
      }} />

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.TRIAGE_ACTIONS}</p>
        {detail.triageActions.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.TRIAGE_EMPTY}</p>
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
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.SANITIZED_METADATA_PREVIEW}</p>
        <p className="mt-2 break-words font-mono text-xs leading-6 text-foreground">{detail.metadataPreview || compactJson(detail.metadataSummary, t.NO_METADATA_STORED)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailSection title={t.LIFECYCLE_TIMELINE} empty={t.LIFECYCLE_EMPTY}>
          {detail.lifecycle.map((event) => (
            <TimelineRow key={`${event.label}-${event.timestamp}`} title={event.label} meta={`${formatters.dateTime(event.timestamp)}${event.actor ? ` · ${event.actor}` : ""}`} body={event.detail} />
          ))}
        </DetailSection>
        <DetailSection title={t.RELATED_AUDIT_EVENTS} empty={t.AUDIT_EMPTY}>
          {detail.auditEvents.map((event) => (
            <TimelineRow key={event.id} title={event.action} meta={`${formatters.dateTime(event.createdAt)} · ${event.actor}`} body={compactJson(event.afterPreview, t.NO_METADATA_STORED)} />
          ))}
        </DetailSection>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.RECOMMENDED_NEXT_ACTION}</p>
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
