"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, History, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const STRINGS = {
  en: {
    ADMIN_SETTINGS: "Admin settings",
    H1_TITLE: "Readiness policy",
    PAGE_DESCRIPTION:
      "Configure proof categories, completeness threshold, and publish gate behavior without changing code. Published reports keep their frozen policy snapshot.",
    ACTIVE_POLICY_TITLE: "Active policy",
    ACTIVE_POLICY_DESC: "Used by draft readiness evaluation and publish gate.",
    BADGE_SAFE_DEFAULT: "Safe default",
    BADGE_DATABASE: "Database",
    UPDATED_LABEL: "Updated:",
    REQUIRED_PROOFS: "Required proofs",
    WARNING_PROOFS: "Warning proofs",
    COMPLETENESS_THRESHOLD: "Completeness threshold",
    NONE: "None",
    POLICY_VERSIONS_TITLE: "Policy versions",
    POLICY_VERSIONS_DESC: "Only one database policy can be active at a time.",
    NO_DB_POLICIES: "No database policies yet. The safe default policy is currently active.",
    NO_REQUIRED_CATEGORIES: "No required categories",
    THRESHOLD_WORD: "threshold",
    BADGE_ACTIVE: "Active",
    BTN_ACTIVATE: "Activate",
    HISTORY_TITLE: "Policy change history",
    HISTORY_DESC: "Recent readiness policy audit events for ops review.",
    FILTER_ACTION: "Action",
    ALL_ACTIONS: "All actions",
    FILTER_POLICY: "Policy",
    ALL_POLICIES: "All policies",
    FILTER_LIMIT: "Limit",
    NO_AUDIT_EVENTS: "No readiness policy audit events match the current filters.",
    EDITOR_TITLE: "Policy editor",
    EDITOR_DESC_PREFIX: "JSON arrays are validated before save. Allowed categories:",
    LABEL_POLICY_NAME: "Policy name",
    LABEL_REQUIRED_JSON: "Required proof categories JSON",
    LABEL_WARNING_JSON: "Warning proof categories JSON",
    LABEL_MIN_SCORE: "Minimum proof completeness score",
    TOGGLE_UNREVIEWED_LABEL: "Block on unreviewed critical artifacts",
    TOGGLE_UNREVIEWED_DESC: "Pending shipment, marketplace, or payout proof artifacts block publishing.",
    TOGGLE_LEAK_LABEL: "Block hidden leak risk",
    TOGGLE_LEAK_DESC: "Snapshot cannot expose more visible proof counts than investor-visible artifacts.",
    TOGGLE_STALE_LABEL: "Block stale snapshot",
    TOGGLE_STALE_DESC: "Snapshot must be regenerated after allocation linkage changes.",
    TOGGLE_WARN_LABEL: "Allow publish with warnings",
    TOGGLE_WARN_DESC: "Warnings can pass only if acknowledged when required.",
    TOGGLE_ACK_LABEL: "Require warning acknowledgment",
    TOGGLE_ACK_DESC: "Admin must acknowledge non-blocking warnings before publish.",
    BTN_SAVE_DRAFT: "Save as draft version",
    BTN_SAVE_ACTIVATE: "Save and activate new version",
    BTN_UPDATE_ACTIVE: "Update active policy",
    DEFAULT_HELP:
      "The safe default policy is code-owned and cannot be edited directly. Save it as a new database-backed version before changing it.",
    DEFAULT_POLICY_NAME: "Readiness policy v1",
    DEFAULT_POLICY: "Default policy",
    INVALID_DATE: "Invalid date",
    PREVIEW_EXPECT_ARRAY: "Expected a JSON array.",
    PREVIEW_INVALID_CATEGORIES: "Invalid categories:",
    PREVIEW_CATEGORIES_CONFIGURED_SUFFIX: "categories configured.",
    PREVIEW_INVALID_JSON: "Invalid JSON.",
    ERR_LOAD_AUDIT: "Failed to load policy audit history.",
    ERR_REFRESH: "Failed to refresh readiness policies.",
    ERR_SAVE: "Failed to save readiness policy.",
    NOTICE_SAVED_ACTIVATED: "New policy version saved and activated.",
    NOTICE_DRAFT_SAVED: "New policy draft saved.",
    ERR_UPDATE: "Failed to update active policy.",
    NOTICE_UPDATED: "Active readiness policy updated.",
    ERR_ACTIVATE: "Failed to activate readiness policy.",
    NOTICE_ACTIVATED: "Readiness policy activated."
  },
  ru: {
    ADMIN_SETTINGS: "Настройки администратора",
    H1_TITLE: "Политика готовности",
    PAGE_DESCRIPTION:
      "Настройте категории подтверждений, порог полноты и поведение шлюза публикации без изменения кода. Опубликованные отчёты сохраняют зафиксированный снимок политики.",
    ACTIVE_POLICY_TITLE: "Активная политика",
    ACTIVE_POLICY_DESC: "Используется при оценке готовности черновика и шлюзом публикации.",
    BADGE_SAFE_DEFAULT: "Безопасное значение по умолчанию",
    BADGE_DATABASE: "База данных",
    UPDATED_LABEL: "Обновлено:",
    REQUIRED_PROOFS: "Обязательные подтверждения",
    WARNING_PROOFS: "Предупреждающие подтверждения",
    COMPLETENESS_THRESHOLD: "Порог полноты",
    NONE: "Нет",
    POLICY_VERSIONS_TITLE: "Версии политики",
    POLICY_VERSIONS_DESC: "Одновременно может быть активна только одна политика из базы данных.",
    NO_DB_POLICIES: "Пока нет политик в базе данных. Сейчас активна безопасная политика по умолчанию.",
    NO_REQUIRED_CATEGORIES: "Нет обязательных категорий",
    THRESHOLD_WORD: "порог",
    BADGE_ACTIVE: "Активна",
    BTN_ACTIVATE: "Активировать",
    HISTORY_TITLE: "История изменений политики",
    HISTORY_DESC: "Недавние события аудита политики готовности для проверки операционной командой.",
    FILTER_ACTION: "Действие",
    ALL_ACTIONS: "Все действия",
    FILTER_POLICY: "Политика",
    ALL_POLICIES: "Все политики",
    FILTER_LIMIT: "Лимит",
    NO_AUDIT_EVENTS: "Нет событий аудита политики готовности, соответствующих текущим фильтрам.",
    EDITOR_TITLE: "Редактор политики",
    EDITOR_DESC_PREFIX: "JSON-массивы проверяются перед сохранением. Допустимые категории:",
    LABEL_POLICY_NAME: "Название политики",
    LABEL_REQUIRED_JSON: "JSON обязательных категорий подтверждений",
    LABEL_WARNING_JSON: "JSON предупреждающих категорий подтверждений",
    LABEL_MIN_SCORE: "Минимальный балл полноты подтверждений",
    TOGGLE_UNREVIEWED_LABEL: "Блокировать при непроверенных критических артефактах",
    TOGGLE_UNREVIEWED_DESC: "Ожидающие проверки артефакты подтверждений отгрузки, маркетплейса или выплат блокируют публикацию.",
    TOGGLE_LEAK_LABEL: "Блокировать скрытый риск утечки",
    TOGGLE_LEAK_DESC: "Снимок не может показывать больше видимых подтверждений, чем артефакты, видимые инвестору.",
    TOGGLE_STALE_LABEL: "Блокировать устаревший снимок",
    TOGGLE_STALE_DESC: "Снимок должен быть пересоздан после изменения связей распределения.",
    TOGGLE_WARN_LABEL: "Разрешить публикацию с предупреждениями",
    TOGGLE_WARN_DESC: "Предупреждения могут пройти только при подтверждении, когда это требуется.",
    TOGGLE_ACK_LABEL: "Требовать подтверждения предупреждений",
    TOGGLE_ACK_DESC: "Администратор должен подтвердить неблокирующие предупреждения перед публикацией.",
    BTN_SAVE_DRAFT: "Сохранить как черновик версии",
    BTN_SAVE_ACTIVATE: "Сохранить и активировать новую версию",
    BTN_UPDATE_ACTIVE: "Обновить активную политику",
    DEFAULT_HELP:
      "Безопасная политика по умолчанию задаётся в коде и не может редактироваться напрямую. Сохраните её как новую версию в базе данных перед изменением.",
    DEFAULT_POLICY_NAME: "Политика готовности v1",
    DEFAULT_POLICY: "Политика по умолчанию",
    INVALID_DATE: "Недопустимая дата",
    PREVIEW_EXPECT_ARRAY: "Ожидался JSON-массив.",
    PREVIEW_INVALID_CATEGORIES: "Недопустимые категории:",
    PREVIEW_CATEGORIES_CONFIGURED_SUFFIX: "категорий настроено.",
    PREVIEW_INVALID_JSON: "Недопустимый JSON.",
    ERR_LOAD_AUDIT: "Не удалось загрузить историю аудита политики.",
    ERR_REFRESH: "Не удалось обновить политики готовности.",
    ERR_SAVE: "Не удалось сохранить политику готовности.",
    NOTICE_SAVED_ACTIVATED: "Новая версия политики сохранена и активирована.",
    NOTICE_DRAFT_SAVED: "Новый черновик политики сохранён.",
    ERR_UPDATE: "Не удалось обновить активную политику.",
    NOTICE_UPDATED: "Активная политика готовности обновлена.",
    ERR_ACTIVATE: "Не удалось активировать политику готовности.",
    NOTICE_ACTIVATED: "Политика готовности активирована."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const DEFAULT_POLICY_ID = "default-readiness-policy";
const AUDIT_ACTIONS = [
  "CREATE_READINESS_POLICY",
  "CREATE_AND_ACTIVATE_READINESS_POLICY",
  "UPDATE_READINESS_POLICY",
  "ACTIVATE_READINESS_POLICY"
] as const;

type Policy = {
  id: string;
  name: string;
  isActive: boolean;
  requiredProofCategories: string[];
  warningProofCategories: string[];
  minimumProofCompletenessScore: number;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  source: "database" | "default";
};

type FormState = {
  name: string;
  requiredProofCategoriesJson: string;
  warningProofCategoriesJson: string;
  minimumProofCompletenessScore: string;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
};

type PolicyAuditEvent = {
  id: string;
  actor: string;
  action: string;
  entityId: string;
  policyId: string;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function formatDate(value: string | null, t: Strings, formatters: ReturnType<typeof createAdminFormatters>) {
  if (!value) return t.DEFAULT_POLICY;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? t.INVALID_DATE : formatters.dateTime(date);
}

function formFromPolicy(policy: Policy, t: Strings): FormState {
  return {
    name: policy.source === "default" ? t.DEFAULT_POLICY_NAME : policy.name,
    requiredProofCategoriesJson: JSON.stringify(policy.requiredProofCategories, null, 2),
    warningProofCategoriesJson: JSON.stringify(policy.warningProofCategories, null, 2),
    minimumProofCompletenessScore: String(policy.minimumProofCompletenessScore),
    blockOnUnreviewedCriticalArtifacts: policy.blockOnUnreviewedCriticalArtifacts,
    blockOnHiddenInvestorLeakRisk: policy.blockOnHiddenInvestorLeakRisk,
    blockOnStaleSnapshot: policy.blockOnStaleSnapshot,
    allowPublishWithWarnings: policy.allowPublishWithWarnings,
    requireWarningAcknowledgment: policy.requireWarningAcknowledgment
  };
}

function parseCategoryPreview(value: string, allowedCategories: string[], t: Strings) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return { ok: false, message: t.PREVIEW_EXPECT_ARRAY };
    const invalid = parsed.filter((item) => typeof item !== "string" || !allowedCategories.includes(item));
    if (invalid.length) return { ok: false, message: `${t.PREVIEW_INVALID_CATEGORIES} ${invalid.join(", ")}` };
    return { ok: true, message: `${new Set(parsed).size} ${t.PREVIEW_CATEGORIES_CONFIGURED_SUFFIX}` };
  } catch {
    return { ok: false, message: t.PREVIEW_INVALID_JSON };
  }
}

function formatMetadataPreview(metadata: Record<string, unknown>) {
  const value = JSON.stringify(metadata);
  return value.length > 260 ? `${value.slice(0, 260)}...` : value;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 accent-gold-300"
      />
    </label>
  );
}

export function AdminReadinessPolicyPage({ locale, activePolicy, policies: initialPolicies, proofCategories }: { locale: Locale; activePolicy: Policy; policies: Policy[]; proofCategories: string[] }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const [currentActivePolicy, setCurrentActivePolicy] = React.useState(activePolicy);
  const [policies, setPolicies] = React.useState(initialPolicies);
  const [form, setForm] = React.useState<FormState>(() => formFromPolicy(activePolicy, t));
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [auditEvents, setAuditEvents] = React.useState<PolicyAuditEvent[]>([]);
  const [auditActionFilter, setAuditActionFilter] = React.useState("ALL");
  const [auditPolicyFilter, setAuditPolicyFilter] = React.useState("ALL");
  const [auditLimit, setAuditLimit] = React.useState("20");
  const [isAuditLoading, setIsAuditLoading] = React.useState(false);
  const [auditError, setAuditError] = React.useState<string | null>(null);
  const requiredPreview = React.useMemo(() => parseCategoryPreview(form.requiredProofCategoriesJson, proofCategories, t), [form.requiredProofCategoriesJson, proofCategories, t]);
  const warningPreview = React.useMemo(() => parseCategoryPreview(form.warningProofCategoriesJson, proofCategories, t), [form.warningProofCategoriesJson, proofCategories, t]);
  const isDefaultActive = currentActivePolicy.id === DEFAULT_POLICY_ID;
  const policyFilterOptions = React.useMemo(() => {
    const byId = new Map<string, Policy>();
    for (const policy of policies) byId.set(policy.id, policy);
    if (currentActivePolicy.id !== DEFAULT_POLICY_ID) byId.set(currentActivePolicy.id, currentActivePolicy);
    return Array.from(byId.values());
  }, [currentActivePolicy, policies]);

  const fetchAuditEvents = React.useCallback(async () => {
    setIsAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", auditLimit);
      if (auditActionFilter !== "ALL") params.set("action", auditActionFilter);
      if (auditPolicyFilter !== "ALL") params.set("policyId", auditPolicyFilter);
      const response = await fetch(`/api/admin/readiness-policy/audit?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; data?: PolicyAuditEvent[]; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || t.ERR_LOAD_AUDIT);
      setAuditEvents(payload.data);
    } catch (caught) {
      setAuditEvents([]);
      setAuditError(caught instanceof Error ? caught.message : t.ERR_LOAD_AUDIT);
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditActionFilter, auditLimit, auditPolicyFilter, t]);

  React.useEffect(() => {
    void fetchAuditEvents();
  }, [fetchAuditEvents]);

  async function refreshPolicies() {
    const response = await fetch("/api/admin/readiness-policy", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; data?: { activePolicy: Policy; policies: Policy[] }; error?: string } | null;
    if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || t.ERR_REFRESH);
    setCurrentActivePolicy(payload.data.activePolicy);
    setPolicies(payload.data.policies);
    return payload.data;
  }

  function buildPayload(isActive: boolean) {
    return {
      ...form,
      minimumProofCompletenessScore: Number(form.minimumProofCompletenessScore),
      isActive
    };
  }

  async function saveNewPolicy(isActive: boolean) {
    setIsSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/readiness-policy", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(buildPayload(isActive))
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || t.ERR_SAVE);
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy, t));
      await fetchAuditEvents();
      setNotice(isActive ? t.NOTICE_SAVED_ACTIVATED : t.NOTICE_DRAFT_SAVED);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.ERR_SAVE);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateActivePolicy() {
    if (isDefaultActive) return;
    setIsSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/readiness-policy/${currentActivePolicy.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(buildPayload(true))
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || t.ERR_UPDATE);
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy, t));
      await fetchAuditEvents();
      setNotice(t.NOTICE_UPDATED);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.ERR_UPDATE);
    } finally {
      setIsSaving(false);
    }
  }

  async function activatePolicy(policy: Policy) {
    if (policy.id === DEFAULT_POLICY_ID) return;
    setIsSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/readiness-policy/${policy.id}/activate`, {
        method: "POST",
        headers: getAdminMutationHeaders()
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || t.ERR_ACTIVATE);
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy, t));
      await fetchAuditEvents();
      setNotice(t.NOTICE_ACTIVATED);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.ERR_ACTIVATE);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground micro-noise md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.ADMIN_SETTINGS}</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.H1_TITLE}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t.PAGE_DESCRIPTION}
            </p>
          </div>
          <AdminNavigation locale={locale} activeSection="readiness-policy" className="flex flex-wrap gap-3" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{t.ACTIVE_POLICY_TITLE}</CardTitle>
                    <CardDescription>{t.ACTIVE_POLICY_DESC}</CardDescription>
                  </div>
                  <Badge variant="secondary">{currentActivePolicy.source === "default" ? t.BADGE_SAFE_DEFAULT : t.BADGE_DATABASE}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{currentActivePolicy.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.UPDATED_LABEL} {formatDate(currentActivePolicy.updatedAt, t, formatters)}</p>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.REQUIRED_PROOFS}</p>
                    <p className="mt-2 text-sm text-foreground">{currentActivePolicy.requiredProofCategories.join(", ") || t.NONE}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.WARNING_PROOFS}</p>
                    <p className="mt-2 text-sm text-foreground">{currentActivePolicy.warningProofCategories.join(", ") || t.NONE}</p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.COMPLETENESS_THRESHOLD}</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{currentActivePolicy.minimumProofCompletenessScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.POLICY_VERSIONS_TITLE}</CardTitle>
                <CardDescription>{t.POLICY_VERSIONS_DESC}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {policies.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                    {t.NO_DB_POLICIES}
                  </div>
                ) : policies.map((policy) => (
                  <div key={policy.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{policy.requiredProofCategories.join(", ") || t.NO_REQUIRED_CATEGORIES} · {policy.minimumProofCompletenessScore}% {t.THRESHOLD_WORD}</p>
                      </div>
                      {policy.isActive ? <Badge variant="secondary">{t.BADGE_ACTIVE}</Badge> : <Button size="sm" variant="outline" disabled={isSaving} onClick={() => activatePolicy(policy)}>{t.BTN_ACTIVATE}</Button>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{t.HISTORY_TITLE}</CardTitle>
                    <CardDescription>{t.HISTORY_DESC}</CardDescription>
                  </div>
                  <History className="size-5 text-gold-100" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.FILTER_ACTION}</span>
                    <select value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="ALL">{t.ALL_ACTIONS}</option>
                      {AUDIT_ACTIONS.map((action) => <option key={action} value={action}>{enumLabel("auditAction", action, locale)}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.FILTER_POLICY}</span>
                    <select value={auditPolicyFilter} onChange={(event) => setAuditPolicyFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="ALL">{t.ALL_POLICIES}</option>
                      {policyFilterOptions.map((policy) => <option key={policy.id} value={policy.id}>{policy.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.FILTER_LIMIT}</span>
                    <select value={auditLimit} onChange={(event) => setAuditLimit(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </label>
                </div>

                {auditError ? <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{auditError}</div> : null}
                {isAuditLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-[1.35rem] border border-white/10 bg-white/[0.04]" />)}
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                    {t.NO_AUDIT_EVENTS}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditEvents.map((event) => (
                      <div key={event.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.createdAt, t, formatters)} · {event.actor}</p>
                          </div>
                          <Badge variant="secondary">{enumLabel("auditAction", event.action, locale)}</Badge>
                        </div>
                        <p className="mt-3 break-all font-mono text-[0.68rem] leading-5 text-muted-foreground">{formatMetadataPreview(event.metadata)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{t.EDITOR_TITLE}</CardTitle>
                  <CardDescription>{t.EDITOR_DESC_PREFIX} {proofCategories.join(", ")}.</CardDescription>
                </div>
                <ShieldCheck className="size-5 text-gold-100" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {notice ? <div className="rounded-[1.35rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</div> : null}
              {error ? <div className="rounded-[1.35rem] border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{error}</div> : null}

              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-foreground">{t.LABEL_POLICY_NAME}</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold-200/50" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span className="font-semibold text-foreground">{t.LABEL_REQUIRED_JSON}</span>
                  <textarea value={form.requiredProofCategoriesJson} onChange={(event) => setForm((current) => ({ ...current, requiredProofCategoriesJson: event.target.value }))} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs outline-none focus:border-gold-200/50" />
                  <span className={requiredPreview.ok ? "text-xs text-emerald-100" : "text-xs text-amber-100"}>{requiredPreview.message}</span>
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-semibold text-foreground">{t.LABEL_WARNING_JSON}</span>
                  <textarea value={form.warningProofCategoriesJson} onChange={(event) => setForm((current) => ({ ...current, warningProofCategoriesJson: event.target.value }))} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs outline-none focus:border-gold-200/50" />
                  <span className={warningPreview.ok ? "text-xs text-emerald-100" : "text-xs text-amber-100"}>{warningPreview.message}</span>
                </label>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-foreground">{t.LABEL_MIN_SCORE}</span>
                <input type="number" min={0} max={100} value={form.minimumProofCompletenessScore} onChange={(event) => setForm((current) => ({ ...current, minimumProofCompletenessScore: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold-200/50" />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label={t.TOGGLE_UNREVIEWED_LABEL} description={t.TOGGLE_UNREVIEWED_DESC} checked={form.blockOnUnreviewedCriticalArtifacts} onChange={(checked) => setForm((current) => ({ ...current, blockOnUnreviewedCriticalArtifacts: checked }))} />
                <ToggleRow label={t.TOGGLE_LEAK_LABEL} description={t.TOGGLE_LEAK_DESC} checked={form.blockOnHiddenInvestorLeakRisk} onChange={(checked) => setForm((current) => ({ ...current, blockOnHiddenInvestorLeakRisk: checked }))} />
                <ToggleRow label={t.TOGGLE_STALE_LABEL} description={t.TOGGLE_STALE_DESC} checked={form.blockOnStaleSnapshot} onChange={(checked) => setForm((current) => ({ ...current, blockOnStaleSnapshot: checked }))} />
                <ToggleRow label={t.TOGGLE_WARN_LABEL} description={t.TOGGLE_WARN_DESC} checked={form.allowPublishWithWarnings} onChange={(checked) => setForm((current) => ({ ...current, allowPublishWithWarnings: checked }))} />
                <ToggleRow label={t.TOGGLE_ACK_LABEL} description={t.TOGGLE_ACK_DESC} checked={form.requireWarningAcknowledgment} onChange={(checked) => setForm((current) => ({ ...current, requireWarningAcknowledgment: checked }))} />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button disabled={isSaving || !requiredPreview.ok || !warningPreview.ok} onClick={() => saveNewPolicy(false)} variant="outline">
                  <Save className="mr-2 size-4" /> {t.BTN_SAVE_DRAFT}
                </Button>
                <Button disabled={isSaving || !requiredPreview.ok || !warningPreview.ok} onClick={() => saveNewPolicy(true)}>
                  <CheckCircle2 className="mr-2 size-4" /> {t.BTN_SAVE_ACTIVATE}
                </Button>
                <Button disabled={isSaving || isDefaultActive || !requiredPreview.ok || !warningPreview.ok} onClick={updateActivePolicy} variant="secondary">
                  <RotateCcw className="mr-2 size-4" /> {t.BTN_UPDATE_ACTIVE}
                </Button>
              </div>
              {isDefaultActive ? (
                <p className="text-xs leading-5 text-muted-foreground">{t.DEFAULT_HELP}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
