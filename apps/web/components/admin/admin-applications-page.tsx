"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BellRing, CheckCircle2, Clock3, Download, FileText, LogOut, Save, Search, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import {
  APPLICATION_SLA_FILTERS,
  DEFAULT_CRM_CONFIG,
  getApplicationPriorityReasons,
  getApplicationSlaState,
  type ApplicationPriorityReason,
  type CrmConfig,
  type ApplicationSlaFilter,
  type ApplicationSlaState,
  type Locale
} from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { CRM_VIEWS, getCrmView, getCrmViewKey, type CrmViewKey } from "./crm-views";
import { AdminNavigation } from "./admin-navigation";

const APPLICATION_STATUSES = ["NEW", "REVIEWED", "APPROVED", "REJECTED", "CONTACTED"] as const;
const APPLICATION_PRIORITIES = ["LOW", "NORMAL", "HIGH", "VIP"] as const;
const REINVEST_INTEREST_OPTIONS = ["yes", "no", "not_sure"] as const;
const INVESTOR_APPLICATION_SORT_OPTIONS = ["smart", "newest", "oldest", "amount-desc", "next-action"] as const;
const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const PAGE_SIZE = 10;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
type ApplicationPriority = (typeof APPLICATION_PRIORITIES)[number];
type ReinvestInterest = (typeof REINVEST_INTEREST_OPTIONS)[number];
type InvestorApplicationSort = (typeof INVESTOR_APPLICATION_SORT_OPTIONS)[number];

type AdminApplication = {
  id: string;
  investorId: string | null;
  investor: AdminLinkedInvestor | null;
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
  status: ApplicationStatus;
  managerNotes: string | null;
  priority: ApplicationPriority;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  contactedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminLinkedInvestor = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  totalCapital: string;
  reinvestEnabled: boolean;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
};

type NotificationEvent = {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  entityType: string;
  entityId: string;
  payloadJson: string;
  status: string;
  error: string | null;
  messagePreview: {
    subject: string;
    text: string;
    html?: string;
    telegramText?: string;
  } | null;
  createdAt: string;
  processedAt: string | null;
};

type PageInfo = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type CrmSummary = {
  newLeads: number;
  contacted: number;
  approved: number;
  highVipPriority: number;
  overdueNextActions: number;
  plannedAllocationTotal: number;
};

type QueueCounts = Partial<Record<CrmViewKey, number>>;
type SlaCounts = Partial<Record<ApplicationSlaFilter, number>>;

type QueueCountsPayload = {
  views: QueueCounts;
  sla: SlaCounts;
  config: CrmConfig;
};

type ApiListResponse = {
  ok: boolean;
  data?: AdminApplication[];
  pageInfo?: PageInfo;
  summary?: CrmSummary;
  error?: string;
};

type ApiQueueCountsResponse = {
  ok: boolean;
  data?: QueueCountsPayload;
  error?: string;
};

type ApiAuditResponse = {
  ok: boolean;
  data?: AuditLog[];
  error?: string;
};

type ApiNotificationEventsResponse = {
  ok: boolean;
  data?: NotificationEvent[];
  error?: string;
};

type NotificationSummary = {
  counts: Record<"PENDING" | "SKIPPED" | "SENT" | "FAILED", number>;
  deliveryEnabled: boolean;
};

type ProcessNotificationsResult = {
  processed: number;
  skipped: number;
  failed: number;
  deliveryEnabled: boolean;
};

type ApiNotificationSummaryResponse = {
  ok: boolean;
  data?: NotificationSummary;
  error?: string;
};

type ApiProcessNotificationsResponse = {
  ok: boolean;
  data?: ProcessNotificationsResult;
  error?: string;
};

type ApiCreateInvestorResponse = {
  ok: boolean;
  created?: boolean;
  data?: {
    investor: AdminLinkedInvestor;
    application: AdminApplication;
  };
  error?: string;
};

type CrmDraft = {
  priority: ApplicationPriority;
  sourceLabel: string;
  managerNotes: string;
  nextAction: string;
  nextActionAt: string;
};

type ApplicationPatchPayload = Partial<{
  status: ApplicationStatus;
  priority: ApplicationPriority;
  managerNotes: string | null;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
}>;

type ActivityItem = {
  key: string;
  label: string;
  detail: string;
  at: string;
};

type AuditSnapshot = Partial<{
  status: string;
  priority: string;
  managerNotes: string | null;
  sourceLabel: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  contactedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
}>;

const statuses: Array<"ALL" | ApplicationStatus> = ["ALL", ...APPLICATION_STATUSES];
const priorityOptions: Array<"ALL" | ApplicationPriority> = ["ALL", ...APPLICATION_PRIORITIES];
const reinvestInterestOptions: Array<"ALL" | ReinvestInterest> = ["ALL", ...REINVEST_INTEREST_OPTIONS];
const sortOptions: Array<{ value: InvestorApplicationSort; label: string }> = [
  { value: "smart", label: "Smart priority" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "next-action", label: "Next action date" }
];
const SLA_QUICK_FILTERS: Array<{ key: ApplicationSlaFilter; label: string; description: string }> = [
  { key: "first-contact-overdue", label: "First contact overdue", description: "New leads waiting 24h+" },
  { key: "due-soon", label: "Due soon", description: "Next 24 hours" },
  { key: "high-value-no-contact", label: "High value no contact", description: "$25k+ untouched" }
];
const defaultPageInfo: PageInfo = {
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false
};
const defaultSummary: CrmSummary = {
  newLeads: 0,
  contacted: 0,
  approved: 0,
  highVipPriority: 0,
  overdueNextActions: 0,
  plannedAllocationTotal: 0
};
const defaultNotificationSummary: NotificationSummary = {
  counts: {
    PENDING: 0,
    SKIPPED: 0,
    SENT: 0,
    FAILED: 0
  },
  deliveryEnabled: false
};
const numberFormatter = new Intl.NumberFormat("en-US");
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

function getAdminMutationHeaders() {
  return {
    "Content-Type": "application/json",
    [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE)
  };
}

function formatInteger(value: number) {
  return numberFormatter.format(value);
}

function formatMoney(value: number) {
  return `$${formatInteger(value)}`;
}

function formatHours(value: number) {
  return `${formatInteger(value)}h`;
}

function formatDays(value: number) {
  return `${formatInteger(value)}d`;
}

function formatOptionalCount(value: number | undefined, isLoading: boolean, hasError: boolean) {
  if (isLoading) return "...";
  if (hasError || typeof value !== "number") return "—";
  return formatInteger(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

function isOverdue(value: string | null) {
  if (!value) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

function isStatusOption(value: string | null): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

function isPriorityOption(value: string | null): value is ApplicationPriority {
  return APPLICATION_PRIORITIES.includes(value as ApplicationPriority);
}

function isReinvestInterestOption(value: string | null): value is ReinvestInterest {
  return REINVEST_INTEREST_OPTIONS.includes(value as ReinvestInterest);
}

function isSlaFilterOption(value: string | null): value is ApplicationSlaFilter {
  return APPLICATION_SLA_FILTERS.includes(value as ApplicationSlaFilter);
}

function isSortOption(value: string | null): value is InvestorApplicationSort {
  return INVESTOR_APPLICATION_SORT_OPTIONS.includes(value as InvestorApplicationSort);
}

function parseInitialPage(value: string | null) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parseAuditSnapshot(value: string | null): AuditSnapshot {
  if (!value) return {};

  try {
    return JSON.parse(value) as AuditSnapshot;
  } catch {
    return {};
  }
}

function parseNotificationPayload(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function formatNotificationLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatNotificationDetail(event: NotificationEvent) {
  if (event.messagePreview?.text) {
    return event.messagePreview.text;
  }

  const payload = parseNotificationPayload(event.payloadJson);

  if (event.type === "INVESTOR_APPLICATION_CREATED") {
    const fullName = typeof payload.fullName === "string" ? payload.fullName : "Investor application";
    return `${fullName} entered the internal notification queue.`;
  }

  if (event.type === "APPLICATION_STATUS_CHANGED") {
    const previousStatus = typeof payload.previousStatus === "string" ? payload.previousStatus : "previous";
    const status = typeof payload.status === "string" ? payload.status : "updated";
    return `${previousStatus} -> ${status}`;
  }

  return `Internal ${event.channel.toLowerCase()} event for ${event.entityType}.`;
}

function getChangedFieldDetail(beforeValue: unknown, afterValue: unknown, fallback: string) {
  const before = beforeValue === null || beforeValue === undefined || beforeValue === "" ? "empty" : String(beforeValue);
  const after = afterValue === null || afterValue === undefined || afterValue === "" ? "empty" : String(afterValue);

  return before === after ? fallback : `${before} -> ${after}`;
}

function buildActivityTimeline(application: AdminApplication, auditLogs: AuditLog[]) {
  const items: ActivityItem[] = [
    {
      key: "created",
      label: "Application created",
      detail: `${application.fullName} submitted an investor application.`,
      at: application.createdAt
    }
  ];

  if (application.contactedAt) items.push({ key: "contacted", label: "Contacted timestamp set", detail: "Lead has been marked as contacted.", at: application.contactedAt });
  if (application.approvedAt) items.push({ key: "approved", label: "Approved timestamp set", detail: "Lead has been approved.", at: application.approvedAt });
  if (application.rejectedAt) items.push({ key: "rejected", label: "Rejected timestamp set", detail: "Lead has been rejected.", at: application.rejectedAt });

  for (const log of auditLogs) {
    const before = parseAuditSnapshot(log.beforeJson);
    const after = parseAuditSnapshot(log.afterJson);

    if (before.status !== after.status) {
      items.push({ key: `${log.id}-status`, label: "Status changed", detail: getChangedFieldDetail(before.status, after.status, "Status updated."), at: log.createdAt });
    }
    if (before.priority !== after.priority) {
      items.push({ key: `${log.id}-priority`, label: "Priority changed", detail: getChangedFieldDetail(before.priority, after.priority, "Priority updated."), at: log.createdAt });
    }
    if (before.managerNotes !== after.managerNotes) {
      items.push({ key: `${log.id}-notes`, label: "Notes updated", detail: after.managerNotes ? "Manager notes updated." : "Manager notes cleared.", at: log.createdAt });
    }
    if (before.sourceLabel !== after.sourceLabel) {
      items.push({ key: `${log.id}-source`, label: "Source label updated", detail: getChangedFieldDetail(before.sourceLabel, after.sourceLabel, "Source label updated."), at: log.createdAt });
    }
    if (before.nextAction !== after.nextAction || before.nextActionAt !== after.nextActionAt) {
      const hasNextAction = Boolean(after.nextAction || after.nextActionAt);
      items.push({
        key: `${log.id}-next-action`,
        label: hasNextAction ? "Next action set" : "Next action cleared",
        detail: hasNextAction ? `${after.nextAction || "Next action"} ${after.nextActionAt ? `by ${formatDateTime(after.nextActionAt)}` : ""}`.trim() : "No next action scheduled.",
        at: log.createdAt
      });
    }
  }

  return items.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

export function AdminApplicationsPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialViewKey = getCrmViewKey(searchParams.get("view"));
  const initialView = getCrmView(initialViewKey);
  const [activeView, setActiveView] = React.useState<CrmViewKey>(initialViewKey);
  const [status, setStatus] = React.useState<"ALL" | ApplicationStatus>(() => {
    const queryStatus = searchParams.get("status");
    if (isStatusOption(queryStatus)) return queryStatus;
    return initialView.filters.status ?? "ALL";
  });
  const [priority, setPriority] = React.useState<"ALL" | ApplicationPriority>(() => {
    const queryPriority = searchParams.get("priority");
    if (isPriorityOption(queryPriority)) return queryPriority;
    return initialView.filters.priority ?? "ALL";
  });
  const [reinvestInterest, setReinvestInterest] = React.useState<"ALL" | ReinvestInterest>(() => {
    const queryReinvestInterest = searchParams.get("reinvestInterest");
    if (isReinvestInterestOption(queryReinvestInterest)) return queryReinvestInterest;
    return initialView.filters.reinvestInterest ?? "ALL";
  });
  const [search, setSearch] = React.useState(() => searchParams.get("search") || "");
  const [sourceSearch, setSourceSearch] = React.useState(() => searchParams.get("source") || "");
  const [overdueOnly, setOverdueOnly] = React.useState(() => searchParams.get("overdueNextAction") === "true" || initialView.filters.overdueOnly === true);
  const [sort, setSort] = React.useState<InvestorApplicationSort>(() => {
    const querySort = searchParams.get("sort");
    return isSortOption(querySort) ? querySort : "smart";
  });
  const [slaFilter, setSlaFilter] = React.useState<"ALL" | ApplicationSlaFilter>(() => {
    const querySla = searchParams.get("sla");
    return isSlaFilterOption(querySla) ? querySla : "ALL";
  });
  const [page, setPage] = React.useState(() => parseInitialPage(searchParams.get("page")));
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [pageInfo, setPageInfo] = React.useState<PageInfo>(defaultPageInfo);
  const [summary, setSummary] = React.useState<CrmSummary>(defaultSummary);
  const [queueCounts, setQueueCounts] = React.useState<QueueCountsPayload | null>(null);
  const [applications, setApplications] = React.useState<AdminApplication[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [notificationEvents, setNotificationEvents] = React.useState<NotificationEvent[]>([]);
  const [notificationSummary, setNotificationSummary] = React.useState<NotificationSummary>(defaultNotificationSummary);
  const [notificationProcessResult, setNotificationProcessResult] = React.useState<ProcessNotificationsResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [areQueueCountsLoading, setAreQueueCountsLoading] = React.useState(true);
  const [isNotificationSummaryLoading, setIsNotificationSummaryLoading] = React.useState(true);
  const [isProcessingNotifications, setIsProcessingNotifications] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isCreatingInvestor, setIsCreatingInvestor] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [queueCountsError, setQueueCountsError] = React.useState<string | null>(null);
  const [notificationError, setNotificationError] = React.useState<string | null>(null);
  const crmConfig = queueCounts?.config ?? DEFAULT_CRM_CONFIG;

  const filterParams = React.useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (priority !== "ALL") params.set("priority", priority);
    if (reinvestInterest !== "ALL") params.set("reinvestInterest", reinvestInterest);
    if (search.trim()) params.set("search", search.trim());
    if (sourceSearch.trim()) params.set("source", sourceSearch.trim());
    if (overdueOnly) params.set("overdueNextAction", "true");
    if (slaFilter !== "ALL") params.set("sla", slaFilter);
    params.set("sort", sort);
    const activeWorkflow = getCrmView(activeView).filters.workflow;
    if (activeWorkflow) params.set("workflow", activeWorkflow);
    return params;
  }, [activeView, status, priority, reinvestInterest, search, sourceSearch, overdueOnly, slaFilter, sort]);

  React.useEffect(() => {
    const params = new URLSearchParams(filterParams);
    params.set("view", activeView);

    if (page > 1) params.set("page", String(page));

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeView, filterParams, page, pathname, router]);

  React.useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(filterParams);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    setIsLoading(true);
    setError(null);

    fetch(`/api/investor-applications?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiListResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load applications.");

        const nextPageInfo = payload.pageInfo || defaultPageInfo;
        if (nextPageInfo.total > 0 && page > nextPageInfo.totalPages) {
          setPage(nextPageInfo.totalPages);
          return;
        }

        setApplications(payload.data);
        setPageInfo(nextPageInfo);
        setSummary(payload.summary || defaultSummary);
        setSelectedId((current) => {
          if (current && payload.data?.some((application) => application.id === current)) return current;
          return payload.data?.[0]?.id || null;
        });
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setApplications([]);
        setPageInfo(defaultPageInfo);
        setSummary(defaultSummary);
        setError(requestError instanceof Error ? requestError.message : "Unable to load applications.");
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [page, filterParams, refreshKey]);

  React.useEffect(() => {
    const controller = new AbortController();

    setAreQueueCountsLoading(true);
    setQueueCountsError(null);

    fetch("/api/investor-applications/queue-counts", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiQueueCountsResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load queue counts.");

        setQueueCounts(payload.data);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setQueueCounts(null);
        setQueueCountsError(requestError instanceof Error ? requestError.message : "Unable to load queue counts.");
      })
      .finally(() => setAreQueueCountsLoading(false));

    return () => controller.abort();
  }, [refreshKey]);

  React.useEffect(() => {
    const controller = new AbortController();

    setIsNotificationSummaryLoading(true);
    setNotificationError(null);

    fetch("/api/notification-events/summary", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiNotificationSummaryResponse;

        if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load notification summary.");

        setNotificationSummary(payload.data);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;

        setNotificationSummary(defaultNotificationSummary);
        setNotificationError(requestError instanceof Error ? requestError.message : "Unable to load notification summary.");
      })
      .finally(() => setIsNotificationSummaryLoading(false));

    return () => controller.abort();
  }, [refreshKey]);

  const selectedApplication = React.useMemo(
    () => applications.find((application) => application.id === selectedId) || applications[0] || null,
    [applications, selectedId]
  );
  const selectedApplicationId = selectedApplication?.id || null;

  const hasActiveFilters =
    status !== "ALL" ||
    priority !== "ALL" ||
    reinvestInterest !== "ALL" ||
    slaFilter !== "ALL" ||
    Boolean(search.trim()) ||
    Boolean(sourceSearch.trim()) ||
    overdueOnly;

  const loadAuditLogs = React.useCallback(async (applicationId: string) => {
    const params = new URLSearchParams({ entityType: "InvestorApplication", entityId: applicationId });
    const response = await fetch(`/api/audit-logs?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiAuditResponse;

    setAuditLogs(response.ok && payload.ok && payload.data ? payload.data : []);
  }, []);

  const loadNotificationEvents = React.useCallback(async (applicationId: string) => {
    const params = new URLSearchParams({ entityType: "InvestorApplication", entityId: applicationId });
    const response = await fetch(`/api/notification-events?${params.toString()}`, { cache: "no-store" });
    const payload = (await response.json()) as ApiNotificationEventsResponse;

    setNotificationEvents(response.ok && payload.ok && payload.data ? payload.data : []);
  }, []);

  React.useEffect(() => {
    if (!selectedApplicationId) {
      setAuditLogs([]);
      setNotificationEvents([]);
      return;
    }

    void Promise.all([
      loadAuditLogs(selectedApplicationId).catch(() => setAuditLogs([])),
      loadNotificationEvents(selectedApplicationId).catch(() => setNotificationEvents([]))
    ]);
  }, [loadAuditLogs, loadNotificationEvents, selectedApplicationId]);

  async function logout() {
    setError(null);

    try {
      const response = await fetch("/api/admin/logout", { method: "POST", headers: { [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) } });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Unable to log out.");

      router.push(`/${locale}/admin/login`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to log out.");
    }
  }

  async function patchApplication(application: AdminApplication, payload: ApplicationPatchPayload, successMessage: string) {
    setIsUpdating(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investor-applications/${application.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: AdminApplication; error?: string };

      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to update application.");

      setApplications((current) => current.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item)));
      setNotice(successMessage);
      await Promise.all([loadAuditLogs(responsePayload.data.id), loadNotificationEvents(responsePayload.data.id)]);
      setRefreshKey((current) => current + 1);
      return responsePayload.data;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update application.");
      throw requestError;
    } finally {
      setIsUpdating(false);
    }
  }

  async function processPendingNotifications() {
    setIsProcessingNotifications(true);
    setNotificationError(null);
    setNotificationProcessResult(null);

    try {
      const response = await fetch("/api/admin/notifications/process", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ limit: 25 })
      });
      const payload = (await response.json()) as ApiProcessNotificationsResponse;

      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to process notifications.");

      setNotificationProcessResult(payload.data);
      if (selectedApplication) await loadNotificationEvents(selectedApplication.id);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setNotificationError(requestError instanceof Error ? requestError.message : "Unable to process notifications.");
    } finally {
      setIsProcessingNotifications(false);
    }
  }

  async function saveCrmDraft(application: AdminApplication, draft: CrmDraft) {
    return patchApplication(
      application,
      {
        priority: draft.priority,
        managerNotes: draft.managerNotes,
        sourceLabel: draft.sourceLabel,
        nextAction: draft.nextAction,
        nextActionAt: draft.nextActionAt || null
      },
      "Application changes saved."
    );
  }

  async function createInvestorFromApplication(application: AdminApplication) {
    setIsCreatingInvestor(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/investors/from-application", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ applicationId: application.id })
      });
      const payload = (await response.json()) as ApiCreateInvestorResponse;

      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to create investor account.");

      setApplications((current) => current.map((item) => (item.id === payload.data?.application.id ? payload.data.application : item)));
      setNotice(payload.created ? "Investor account created and linked." : "Existing investor account linked.");
      await Promise.all([loadAuditLogs(payload.data.application.id), loadNotificationEvents(payload.data.application.id)]);
      setRefreshKey((current) => current + 1);
      return payload.data.application;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create investor account.");
      throw requestError;
    } finally {
      setIsCreatingInvestor(false);
    }
  }

  function resetFilters() {
    setActiveView("all");
    setStatus("ALL");
    setPriority("ALL");
    setReinvestInterest("ALL");
    setSearch("");
    setSourceSearch("");
    setOverdueOnly(false);
    setSlaFilter("ALL");
    setSort("smart");
    setPage(1);
  }

  function applySavedView(viewKey: CrmViewKey) {
    const view = getCrmView(viewKey);

    setActiveView(viewKey);
    setStatus(view.filters.status ?? "ALL");
    setPriority(view.filters.priority ?? "ALL");
    setReinvestInterest(view.filters.reinvestInterest ?? "ALL");
    setOverdueOnly(view.filters.overdueOnly === true);
    setSlaFilter("ALL");
    setSearch("");
    setSourceSearch("");
    setPage(1);
  }

  function exportCsv() {
    const params = new URLSearchParams(filterParams);
    const query = params.toString();
    const link = document.createElement("a");
    link.href = `/api/investor-applications/export.csv${query ? `?${query}` : ""}`;
    link.download = "otiz-investor-applications.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to homepage
            </Link>
            <div className="flex items-center gap-3">
              <AdminNavigation locale={locale} activeSection="applications" className="hidden items-center gap-2 sm:flex" />
              <Button type="button" variant="outline" size="sm" onClick={logout}>
                <LogOut data-icon="inline-start" />
                Logout
              </Button>
            </div>
          </div>

          <div className="mb-8 rounded-[1.5rem] border border-gold-200/25 bg-gold-200/10 p-5 text-gold-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Admin access protected</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">CRM actions use the signed admin session, CSRF-protected mutations, pagination, CSV export, and audit logging.</p>
              </div>
            </div>
          </div>

          <CrmRulesCard config={crmConfig} />

          <NotificationProcessorPanel
            summary={notificationSummary}
            isLoading={isNotificationSummaryLoading}
            isProcessing={isProcessingNotifications}
            error={notificationError}
            result={notificationProcessResult}
            onProcess={processPendingNotifications}
          />

          <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <SummaryCard label="First contact overdue" value={formatOptionalCount(queueCounts?.sla["first-contact-overdue"], areQueueCountsLoading, Boolean(queueCountsError))} />
            <SummaryCard label="Due soon" value={formatOptionalCount(queueCounts?.sla["due-soon"], areQueueCountsLoading, Boolean(queueCountsError))} />
            <SummaryCard label="Overdue" value={formatOptionalCount(queueCounts?.sla.overdue, areQueueCountsLoading, Boolean(queueCountsError))} />
            <SummaryCard label="High value no contact" value={formatOptionalCount(queueCounts?.sla["high-value-no-contact"], areQueueCountsLoading, Boolean(queueCountsError))} />
            <SummaryCard label="New leads" value={formatInteger(summary.newLeads)} />
            <SummaryCard label="Contacted" value={formatInteger(summary.contacted)} />
            <SummaryCard label="Approved" value={formatInteger(summary.approved)} />
            <SummaryCard label="High/VIP priority" value={formatInteger(summary.highVipPriority)} />
            <SummaryCard label="Overdue next actions" value={formatInteger(summary.overdueNextActions)} />
            <SummaryCard label="Planned allocation total" value={formatMoney(summary.plannedAllocationTotal)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(25rem,0.84fr)]">
            <Card className="overflow-hidden rounded-[2rem] bg-graphite-900/[0.78]">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl">Investor applications</CardTitle>
                    <CardDescription>Compact CRM queue for review, prioritization, and follow-up.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{pageInfo.total} total</Badge>
                    <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
                      <Download data-icon="inline-start" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {CRM_VIEWS.map((view) => {
                    const isActive = activeView === view.key;

                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => applySavedView(view.key)}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          isActive
                            ? "border-gold-200/35 bg-gold-200/10 text-foreground"
                            : "border-white/10 bg-black/20 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="block text-sm font-semibold">{view.label}</span>
                          <QueueCountBadge value={queueCounts?.views[view.key]} isLoading={areQueueCountsLoading} hasError={Boolean(queueCountsError)} />
                        </span>
                        <span className="mt-1 block text-xs leading-5 opacity-75">{view.description}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mb-4 flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-black/15 p-3">
                  {SLA_QUICK_FILTERS.map((filter) => {
                    const isActive = slaFilter === filter.key;

                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => {
                          setSlaFilter((current) => (current === filter.key ? "ALL" : filter.key));
                          setPage(1);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                          isActive
                            ? "border-gold-200/35 bg-gold-200/10 text-gold-100"
                            : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                        }`}
                        title={filter.description}
                      >
                        <span>{filter.label}</span>
                        <QueueCountBadge value={queueCounts?.sla[filter.key]} isLoading={areQueueCountsLoading} hasError={Boolean(queueCountsError)} />
                      </button>
                    );
                  })}
                </div>
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_11rem_11rem_13rem]">
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    <input
                      aria-label="Search applications"
                      value={search}
                      onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                      placeholder="Search name, email, Telegram, country"
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <CrmSelect label="Filter by status" value={status} onChange={(value) => { setStatus(value as "ALL" | ApplicationStatus); setPage(1); }} options={statuses} />
                  <CrmSelect label="Filter by priority" value={priority} onChange={(value) => { setPriority(value as "ALL" | ApplicationPriority); setPage(1); }} options={priorityOptions} />
                  <div className="flex flex-col gap-2">
                    <SortSelect value={sort} onChange={(value) => { setSort(value); setPage(1); }} />
                    <p className="text-[0.68rem] leading-4 text-muted-foreground">
                      Smart priority raises overdue actions, first-contact SLA breaches, high-value no-contact leads, due-soon actions, and VIP/High priority leads.
                    </p>
                  </div>
                </div>
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_12rem_15rem_8rem]">
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-muted-foreground">
                    <Search className="size-4" />
                    <input
                      aria-label="Search by source label"
                      value={sourceSearch}
                      onChange={(event) => { setSourceSearch(event.target.value); setPage(1); }}
                      placeholder="Search source label"
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <CrmSelect
                    label="Filter by reinvest interest"
                    value={reinvestInterest}
                    onChange={(value) => {
                      setReinvestInterest(value as "ALL" | ReinvestInterest);
                      setPage(1);
                    }}
                    options={reinvestInterestOptions}
                  />
                  <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-muted-foreground">
                    <input type="checkbox" checked={overdueOnly} onChange={(event) => { setOverdueOnly(event.target.checked); setPage(1); }} aria-label="Show overdue next actions" />
                    <span>Overdue next actions</span>
                  </label>
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="h-12">Reset</Button>
                </div>

                {notice ? <AdminNotice tone="success" message={notice} /> : null}
                {error ? <AdminNotice tone="error" message={error} /> : null}

                <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                  <div className="hidden grid-cols-[1.2fr_0.62fr_0.7fr_0.72fr_0.88fr_0.9fr_0.86fr] gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                    <span>Lead</span>
                    <span>Priority</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span>Source</span>
                    <span>Next action</span>
                    <span>Created</span>
                  </div>
                  {isLoading ? (
                    <QueueEmptyState title="Loading applications" description="Fetching the current CRM queue." />
                  ) : applications.length === 0 ? (
                    <QueueEmptyState title={hasActiveFilters ? "No matching applications" : "No applications yet"} description={hasActiveFilters ? "Try clearing filters or broadening the search." : "New investor applications will appear here after submission."} />
                  ) : (
                    applications.map((application) => {
                      const slaState = getApplicationSlaState(application, { config: crmConfig });

                      return (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedId(application.id)}
                          className={`grid w-full gap-3 border-b border-white/10 p-4 text-left transition-colors last:border-b-0 lg:grid-cols-[1.2fr_0.62fr_0.7fr_0.72fr_0.88fr_0.9fr_0.86fr] lg:items-center ${
                            selectedApplication?.id === application.id ? "bg-gold-200/10" : "bg-white/[0.02] hover:bg-white/[0.045]"
                          } ${application.priority === "VIP" ? "ring-1 ring-gold-200/20" : ""}`}
                        >
                          <span className="flex flex-col gap-2">
                            <span>
                              <span className="block font-semibold text-foreground">{application.fullName}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{application.email || application.telegram || application.country}</span>
                            </span>
                            <SlaBadges state={slaState} compact />
                          </span>
                          <span><PriorityBadge priority={application.priority} /></span>
                          <span><Badge variant={application.status === "NEW" ? "default" : "secondary"}>{application.status}</Badge></span>
                          <span className="font-semibold text-foreground">{formatMoney(application.plannedAllocationAmount)}</span>
                          <span className="text-sm text-muted-foreground">{application.sourceLabel || "—"}</span>
                          <span className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>{application.nextAction || "No next action"}</span>
                            {application.nextActionAt ? <OverdueBadge value={application.nextActionAt} /> : null}
                          </span>
                          <span className="text-sm text-muted-foreground">{formatDateTime(application.createdAt)}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Page {pageInfo.page} of {pageInfo.totalPages} · {applications.length} shown · {pageInfo.total} total</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={isLoading || !pageInfo.hasPreviousPage} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
                    <Button type="button" variant="outline" size="sm" disabled={isLoading || !pageInfo.hasNextPage} onClick={() => setPage((current) => current + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          <ApplicationDetail
            application={selectedApplication}
            auditLogs={auditLogs}
            notificationEvents={notificationEvents}
            isUpdating={isUpdating}
            isCreatingInvestor={isCreatingInvestor}
            onPatchApplication={patchApplication}
            onSaveCrmDraft={saveCrmDraft}
            onCreateInvestor={createInvestorFromApplication}
            crmConfig={crmConfig}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function CrmRulesCard({ config }: { config: CrmConfig }) {
  return (
    <Card className="mb-6 rounded-[1.5rem] border border-white/10 bg-graphite-900/[0.58]">
      <CardContent className="grid gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
        <RuleMetric label="First contact SLA" value={formatHours(config.firstContactSlaHours)} />
        <RuleMetric label="Due soon window" value={formatHours(config.nextActionDueSoonHours)} />
        <RuleMetric label="High value threshold" value={formatMoney(config.highValueLeadAmount)} />
        <RuleMetric label="Stale lead threshold" value={formatDays(config.staleLeadDays)} />
      </CardContent>
    </Card>
  );
}

function RuleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function NotificationProcessorPanel({
  summary,
  isLoading,
  isProcessing,
  error,
  result,
  onProcess
}: {
  summary: NotificationSummary;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  result: ProcessNotificationsResult | null;
  onProcess: () => void;
}) {
  const pendingCount = summary.counts.PENDING;
  const isDisabled = isLoading || isProcessing || pendingCount === 0;

  return (
    <Card className="mb-6 rounded-[1.5rem] border border-white/10 bg-graphite-900/[0.64]">
      <CardContent className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-200/20 bg-gold-200/10 text-gold-100">
            <BellRing className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Notification worker</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Pending events are processed locally. Outbound delivery is {summary.deliveryEnabled ? "enabled but provider delivery is not implemented" : "disabled"}.
            </p>
            {result ? (
              <p className="mt-2 text-xs leading-5 text-gold-100">
                Processed {formatInteger(result.processed)} · skipped {formatInteger(result.skipped)} · failed {formatInteger(result.failed)}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs leading-5 text-gold-100">{error}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{isLoading ? "..." : `${formatInteger(pendingCount)} pending`}</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.SKIPPED)} skipped</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.SENT)} sent</Badge>
          <Badge variant="secondary">{formatInteger(summary.counts.FAILED)} failed</Badge>
          <Button type="button" variant="outline" size="sm" disabled={isDisabled} onClick={onProcess}>
            {isProcessing ? "Processing..." : "Process pending notifications"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.2rem] border border-white/10 bg-graphite-900/[0.64]">
      <CardContent className="px-5 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function QueueCountBadge({ value, isLoading, hasError }: { value: number | undefined; isLoading: boolean; hasError: boolean }) {
  if (isLoading) {
    return <span aria-label="Loading queue count" className="h-5 w-9 rounded-full border border-white/10 bg-white/[0.06] opacity-70 animate-pulse" />;
  }

  if (hasError || typeof value !== "number") {
    return <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.68rem] font-semibold text-muted-foreground">—</span>;
  }

  return <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] font-semibold text-foreground">{formatInteger(value)}</span>;
}

function CrmSelect({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
      {options.map((option) => <option key={option} value={option} className="bg-graphite-900 text-foreground">{option}</option>)}
    </select>
  );
}

function SortSelect({ value, onChange }: { value: InvestorApplicationSort; onChange: (value: InvestorApplicationSort) => void }) {
  return (
    <select aria-label="Sort applications" value={value} onChange={(event) => onChange(event.target.value as InvestorApplicationSort)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value} className="bg-graphite-900 text-foreground">{option.label}</option>
      ))}
    </select>
  );
}

function AdminNotice({ message, tone }: { message: string; tone: "success" | "error" }) {
  const toneClass = tone === "success" ? "border-gold-200/20 bg-gold-200/10 text-gold-100" : "border-red-300/20 bg-red-500/10 text-red-100";
  return <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm ${toneClass}`}><CheckCircle2 className="size-4" />{message}</div>;
}

function PriorityBadge({ priority }: { priority: ApplicationPriority }) {
  const isElevated = priority === "VIP" || priority === "HIGH";
  return <Badge variant={isElevated ? "default" : "secondary"}>{priority}</Badge>;
}

function OverdueBadge({ value }: { value: string }) {
  const overdue = isOverdue(value);
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[0.68rem] ${overdue ? "border-gold-200/30 bg-gold-200/10 text-gold-100" : "border-white/10 bg-white/[0.04] text-muted-foreground"}`}>
      <Clock3 className="size-3" />
      {overdue ? "Overdue" : formatDateTime(value)}
    </span>
  );
}

function getSlaBadgeClass(tone: "attention" | "urgent" | "value") {
  if (tone === "urgent") return "border-gold-200/40 bg-gold-200/14 text-gold-100";
  if (tone === "value") return "border-white/15 bg-white/[0.06] text-foreground";
  return "border-gold-200/25 bg-gold-200/8 text-gold-100";
}

function getPriorityReasonClass(tone: ApplicationPriorityReason["tone"]) {
  if (tone === "urgent") return "border-gold-200/40 bg-gold-200/14 text-gold-100";
  if (tone === "value") return "border-white/15 bg-white/[0.06] text-foreground";
  if (tone === "attention") return "border-gold-200/25 bg-gold-200/8 text-gold-100";
  return "border-white/10 bg-white/[0.04] text-muted-foreground";
}

function SlaBadges({ state, compact = false }: { state: ApplicationSlaState; compact?: boolean }) {
  if (state.badges.length === 0) return null;

  return (
    <span className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-3"}`}>
      {state.badges.map((badge) => (
        <span key={badge.flag} className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-[0.68rem] font-semibold ${getSlaBadgeClass(badge.tone)}`}>
          {compact ? badge.shortLabel : badge.label}
        </span>
      ))}
    </span>
  );
}

function PriorityReasonsPanel({ reasons }: { reasons: ApplicationPriorityReason[] }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Why this lead is prioritized</p>
      {reasons.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span key={reason.key} className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityReasonClass(reason.tone)}`}>
              {reason.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">No urgent priority signals.</p>
      )}
    </div>
  );
}

function InvestorLinkPanel({ application, isCreating, onCreate }: { application: AdminApplication; isCreating: boolean; onCreate: () => void }) {
  if (application.investor) {
    return (
      <div className="rounded-[1.5rem] border border-gold-200/25 bg-gold-200/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-200/25 bg-black/20 text-gold-100">
            <Users className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Investor linked</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{application.investor.fullName}</p>
            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{application.investor.email} · {application.investor.status}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Capital profile: {formatMoney(Number(application.investor.totalCapital || 0))} · Reinvest {application.investor.reinvestEnabled ? "enabled" : "disabled"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (application.status !== "APPROVED") {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Investor account</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Approve application before creating investor access.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-gold-200/25 bg-gold-200/10 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Investor account</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Create a protected investor profile from this approved application.</p>
        </div>
        <Button type="button" size="sm" disabled={isCreating || !application.email} onClick={onCreate}>
          <UserPlus data-icon="inline-start" />
          {isCreating ? "Creating..." : "Create investor account"}
        </Button>
      </div>
      {!application.email ? <p className="mt-3 text-xs text-gold-100">Email is required for investor login access.</p> : null}
    </div>
  );
}

function SlaIndicatorPanel({ state }: { state: ApplicationSlaState }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SLA indicators</p>
      {state.badges.length > 0 ? (
        <SlaBadges state={state} />
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">No active SLA flags for this application.</p>
      )}
    </div>
  );
}

function QueueEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
      <FileText className="size-8 text-gold-100" />
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ApplicationDetail({
  application,
  auditLogs,
  notificationEvents,
  isUpdating,
  isCreatingInvestor,
  onPatchApplication,
  onSaveCrmDraft,
  onCreateInvestor,
  crmConfig
}: {
  application: AdminApplication | null;
  auditLogs: AuditLog[];
  notificationEvents: NotificationEvent[];
  isUpdating: boolean;
  isCreatingInvestor: boolean;
  onPatchApplication: (application: AdminApplication, payload: ApplicationPatchPayload, successMessage: string) => Promise<AdminApplication>;
  onSaveCrmDraft: (application: AdminApplication, draft: CrmDraft) => Promise<AdminApplication>;
  onCreateInvestor: (application: AdminApplication) => Promise<AdminApplication>;
  crmConfig: CrmConfig;
}) {
  const [draft, setDraft] = React.useState<CrmDraft>({ priority: "NORMAL", sourceLabel: "", managerNotes: "", nextAction: "", nextActionAt: "" });
  const [detailNotice, setDetailNotice] = React.useState<string | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const draftDefaults = React.useMemo<CrmDraft | null>(() => {
    if (!application) return null;

    return {
      priority: application.priority,
      sourceLabel: application.sourceLabel || "",
      managerNotes: application.managerNotes || "",
      nextAction: application.nextAction || "",
      nextActionAt: toDateTimeInputValue(application.nextActionAt)
    };
  }, [application]);

  React.useEffect(() => {
    if (!draftDefaults) return;

    setDraft(draftDefaults);
    setDetailNotice(null);
    setDetailError(null);
  }, [draftDefaults]);

  if (!application) {
    return (
      <Card className="rounded-[2rem] bg-white/[0.035]">
        <CardContent className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
          <FileText className="size-10 text-gold-100" />
          <p className="mt-5 font-semibold text-foreground">Select an application</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Application details, quick actions, and timeline will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  const isDirty = draft.priority !== application.priority || draft.sourceLabel !== (application.sourceLabel || "") || draft.managerNotes !== (application.managerNotes || "") || draft.nextAction !== (application.nextAction || "") || draft.nextActionAt !== toDateTimeInputValue(application.nextActionAt);
  const timeline = buildActivityTimeline(application, auditLogs);
  const slaState = getApplicationSlaState(application, { config: crmConfig });
  const priorityReasons = getApplicationPriorityReasons(application, crmConfig);

  async function saveDraft() {
    if (!application) return;
    setIsSaving(true);
    setDetailNotice(null);
    setDetailError(null);

    try {
      await onSaveCrmDraft(application, draft);
      setDetailNotice("CRM fields saved.");
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Unable to save CRM fields.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runQuickAction(payload: ApplicationPatchPayload, successMessage: string) {
    if (!application) return;

    setDetailNotice(null);
    setDetailError(null);

    try {
      const updated = await onPatchApplication(application, payload, successMessage);
      setDetailNotice(successMessage);
      setDraft({
        priority: updated.priority,
        sourceLabel: updated.sourceLabel || "",
        managerNotes: updated.managerNotes || "",
        nextAction: updated.nextAction || "",
        nextActionAt: toDateTimeInputValue(updated.nextActionAt)
      });
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Unable to run quick action.");
    }
  }

  async function createInvestorAccount() {
    if (!application) return;

    setDetailNotice(null);
    setDetailError(null);

    try {
      await onCreateInvestor(application);
      setDetailNotice("Investor account is linked to this approved application.");
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Unable to create investor account.");
    }
  }

  return (
    <Card className="rounded-[2rem] bg-graphite-900/[0.72] xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:overflow-auto">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{application.fullName}</CardTitle>
            <CardDescription>{application.id}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PriorityBadge priority={application.priority} />
            <Badge>{application.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <SlaIndicatorPanel state={slaState} />

        <PriorityReasonsPanel reasons={priorityReasons} />

        <InvestorLinkPanel application={application} isCreating={isCreatingInvestor} onCreate={createInvestorAccount} />

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "CONTACTED"} onClick={() => runQuickAction({ status: "CONTACTED" }, "Marked as contacted.")}>Mark contacted</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "APPROVED"} onClick={() => runQuickAction({ status: "APPROVED" }, "Application approved.")}>Approve</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.status === "REJECTED"} onClick={() => runQuickAction({ status: "REJECTED" }, "Application rejected.")}>Reject</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || application.priority === "VIP"} onClick={() => runQuickAction({ priority: "VIP" }, "Priority set to VIP.")}>Set VIP</Button>
            <Button type="button" variant="outline" size="sm" disabled={isUpdating || (!application.nextAction && !application.nextActionAt)} onClick={() => runQuickAction({ nextAction: null, nextActionAt: null }, "Next action cleared.")}>Clear next action</Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Priority</span>
            <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as ApplicationPriority }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45">
              {APPLICATION_PRIORITIES.map((nextPriority) => <option key={nextPriority} value={nextPriority} className="bg-graphite-900 text-foreground">{nextPriority}</option>)}
            </select>
          </label>
          <CrmTextInput label="Source label" value={draft.sourceLabel} onChange={(value) => setDraft((current) => ({ ...current, sourceLabel: value }))} placeholder="Creator, partner, referral" />
          <CrmTextInput label="Next action" value={draft.nextAction} onChange={(value) => setDraft((current) => ({ ...current, nextAction: value }))} placeholder="Call, document review, approval prep" />
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next action date/time</span>
            <input type="datetime-local" value={draft.nextActionAt} onChange={(event) => setDraft((current) => ({ ...current, nextActionAt: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none focus:border-gold-200/45" />
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manager notes</span>
          <textarea value={draft.managerNotes} onChange={(event) => setDraft((current) => ({ ...current, managerNotes: event.target.value }))} placeholder="Internal review notes, follow-up context, allocation fit." className="min-h-32 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none focus:border-gold-200/45" />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{isDirty ? "Unsaved CRM changes" : "CRM fields are up to date"}</p>
          <Button type="button" disabled={!isDirty || isSaving} onClick={saveDraft}>
            <Save data-icon="inline-start" />
            {isSaving ? "Saving..." : "Save CRM fields"}
          </Button>
        </div>
        {detailNotice ? <AdminNotice tone="success" message={detailNotice} /> : null}
        {detailError ? <AdminNotice tone="error" message={detailError} /> : null}

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow label="Contact" value={`${application.email || "No email"} / ${application.telegram || "No Telegram"}`} />
          <DetailRow label="Country" value={application.country} />
          <DetailRow label="Planned allocation" value={formatMoney(application.plannedAllocationAmount)} />
          <DetailRow label="Deposit method" value={application.preferredDepositMethod} />
          <DetailRow label="Investor type" value={application.investorType} />
          <DetailRow label="Reinvest interest" value={application.reinvestInterest} />
          <DetailRow label="Contacted at" value={formatDateTime(application.contactedAt)} />
          <DetailRow label="Approved at" value={formatDateTime(application.approvedAt)} />
        </div>
        <NextActionState application={application} />

        <Separator />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Application message</p>
          <p className="mt-2 text-sm leading-7 text-foreground">{application.message || "No notes provided."}</p>
        </div>

        <Separator />

        <ActivityTimeline items={timeline} />

        <Separator />

        <NotificationEventsPanel events={notificationEvents} />

        <Separator />

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recent audit history</p>
          {auditLogs.length === 0 ? (
            <EmptyInlineState title="No audit history yet" description="Status, priority, notes, source, and next action updates will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{log.beforeJson || "{}"}{" -> "}{log.afterJson || "{}"} by {log.actor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationEventsPanel({ events }: { events: NotificationEvent[] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notification events</p>
      {events.length === 0 ? (
        <EmptyInlineState title="No notification events yet" description="Internal email, Telegram, or operator notification events will appear here when they are queued." />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold-200/20 bg-gold-200/10 text-gold-100">
                    <BellRing className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.messagePreview?.subject || formatNotificationLabel(event.type)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{event.channel}</Badge>
                  <Badge>{event.status}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{formatNotificationDetail(event)}</p>
              {event.messagePreview?.telegramText ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Telegram preview</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{event.messagePreview.telegramText}</p>
                </div>
              ) : null}
              <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">Recipient: {event.recipient}</p>
              {event.error ? <p className="mt-2 text-xs leading-5 text-gold-100">{event.error}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NextActionState({ application }: { application: AdminApplication }) {
  if (!application.nextAction && !application.nextActionAt) {
    return <EmptyInlineState title="No next action" description="Set a follow-up step and due date when this lead needs operator attention." />;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next action</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{application.nextAction || "No action text set."}</p>
      <p className={`mt-2 text-xs ${isOverdue(application.nextActionAt) ? "text-gold-100" : "text-muted-foreground"}`}>{formatDateTime(application.nextActionAt)}</p>
    </div>
  );
}

function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyInlineState title="No activity yet" description="Application lifecycle events will appear here." />;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Application activity timeline</p>
      <div className="relative flex flex-col gap-3 before:absolute before:left-[0.56rem] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-white/10">
        {items.map((item) => (
          <div key={item.key} className="relative flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <span className="relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-gold-200/35 bg-gold-200/10 text-gold-100">
              <Sparkles className="size-3" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
              <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">{formatDateTime(item.at)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyInlineState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function CrmTextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-gold-200/45" />
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
