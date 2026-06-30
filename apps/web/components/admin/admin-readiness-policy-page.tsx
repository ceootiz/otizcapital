"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, History, RotateCcw, Save, ShieldCheck } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

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

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function formatDate(value: string | null) {
  if (!value) return "Default policy";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Invalid date" : dateFormatter.format(date);
}

function formFromPolicy(policy: Policy): FormState {
  return {
    name: policy.source === "default" ? "Readiness policy v1" : policy.name,
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

function parseCategoryPreview(value: string, allowedCategories: string[]) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return { ok: false, message: "Expected a JSON array." };
    const invalid = parsed.filter((item) => typeof item !== "string" || !allowedCategories.includes(item));
    if (invalid.length) return { ok: false, message: `Invalid categories: ${invalid.join(", ")}` };
    return { ok: true, message: `${new Set(parsed).size} categories configured.` };
  } catch {
    return { ok: false, message: "Invalid JSON." };
  }
}

function formatMetadataPreview(metadata: Record<string, unknown>) {
  const value = JSON.stringify(metadata);
  return value.length > 260 ? `${value.slice(0, 260)}...` : value;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 accent-[#d6b56d]"
      />
    </label>
  );
}

export function AdminReadinessPolicyPage({ locale, activePolicy, policies: initialPolicies, proofCategories }: { locale: Locale; activePolicy: Policy; policies: Policy[]; proofCategories: string[] }) {
  const [currentActivePolicy, setCurrentActivePolicy] = React.useState(activePolicy);
  const [policies, setPolicies] = React.useState(initialPolicies);
  const [form, setForm] = React.useState<FormState>(() => formFromPolicy(activePolicy));
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [auditEvents, setAuditEvents] = React.useState<PolicyAuditEvent[]>([]);
  const [auditActionFilter, setAuditActionFilter] = React.useState("ALL");
  const [auditPolicyFilter, setAuditPolicyFilter] = React.useState("ALL");
  const [auditLimit, setAuditLimit] = React.useState("20");
  const [isAuditLoading, setIsAuditLoading] = React.useState(false);
  const [auditError, setAuditError] = React.useState<string | null>(null);
  const requiredPreview = React.useMemo(() => parseCategoryPreview(form.requiredProofCategoriesJson, proofCategories), [form.requiredProofCategoriesJson, proofCategories]);
  const warningPreview = React.useMemo(() => parseCategoryPreview(form.warningProofCategoriesJson, proofCategories), [form.warningProofCategoriesJson, proofCategories]);
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
      if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || "Failed to load policy audit history.");
      setAuditEvents(payload.data);
    } catch (caught) {
      setAuditEvents([]);
      setAuditError(caught instanceof Error ? caught.message : "Failed to load policy audit history.");
    } finally {
      setIsAuditLoading(false);
    }
  }, [auditActionFilter, auditLimit, auditPolicyFilter]);

  React.useEffect(() => {
    void fetchAuditEvents();
  }, [fetchAuditEvents]);

  async function refreshPolicies() {
    const response = await fetch("/api/admin/readiness-policy", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; data?: { activePolicy: Policy; policies: Policy[] }; error?: string } | null;
    if (!response.ok || !payload?.ok || !payload.data) throw new Error(payload?.error || "Failed to refresh readiness policies.");
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
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Failed to save readiness policy.");
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy));
      await fetchAuditEvents();
      setNotice(isActive ? "New policy version saved and activated." : "New policy draft saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save readiness policy.");
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
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Failed to update active policy.");
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy));
      await fetchAuditEvents();
      setNotice("Active readiness policy updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update active policy.");
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
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Failed to activate readiness policy.");
      const data = await refreshPolicies();
      setForm(formFromPolicy(data.activePolicy));
      await fetchAuditEvents();
      setNotice("Readiness policy activated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to activate readiness policy.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(214,181,109,0.12),transparent_28%),linear-gradient(135deg,#050505,#151515_48%,#0d0d0d)] px-5 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Admin settings</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">Readiness policy</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configure proof categories, completeness threshold, and publish gate behavior without changing code.
              Published reports keep their frozen policy snapshot.
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
                    <CardTitle>Active policy</CardTitle>
                    <CardDescription>Used by draft readiness evaluation and publish gate.</CardDescription>
                  </div>
                  <Badge variant="secondary">{currentActivePolicy.source === "default" ? "Safe default" : "Database"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{currentActivePolicy.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Updated: {formatDate(currentActivePolicy.updatedAt)}</p>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Required proofs</p>
                    <p className="mt-2 text-sm text-foreground">{currentActivePolicy.requiredProofCategories.join(", ") || "None"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Warning proofs</p>
                    <p className="mt-2 text-sm text-foreground">{currentActivePolicy.warningProofCategories.join(", ") || "None"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Completeness threshold</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{currentActivePolicy.minimumProofCompletenessScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy versions</CardTitle>
                <CardDescription>Only one database policy can be active at a time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {policies.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                    No database policies yet. The safe default policy is currently active.
                  </div>
                ) : policies.map((policy) => (
                  <div key={policy.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{policy.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{policy.requiredProofCategories.join(", ") || "No required categories"} · {policy.minimumProofCompletenessScore}% threshold</p>
                      </div>
                      {policy.isActive ? <Badge variant="secondary">Active</Badge> : <Button size="sm" variant="outline" disabled={isSaving} onClick={() => activatePolicy(policy)}>Activate</Button>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Policy change history</CardTitle>
                    <CardDescription>Recent readiness policy audit events for ops review.</CardDescription>
                  </div>
                  <History className="size-5 text-gold-100" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Action</span>
                    <select value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="ALL">All actions</option>
                      {AUDIT_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Policy</span>
                    <select value={auditPolicyFilter} onChange={(event) => setAuditPolicyFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="ALL">All policies</option>
                      {policyFilterOptions.map((policy) => <option key={policy.id} value={policy.id}>{policy.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Limit</span>
                    <select value={auditLimit} onChange={(event) => setAuditLimit(event.target.value)} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-gold-200/50">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </label>
                </div>

                {auditError ? <div className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{auditError}</div> : null}
                {isAuditLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />)}
                  </div>
                ) : auditEvents.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-muted-foreground">
                    No readiness policy audit events match the current filters.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditEvents.map((event) => (
                      <div key={event.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.createdAt)} · {event.actor}</p>
                          </div>
                          <Badge variant="secondary">{event.action}</Badge>
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
                  <CardTitle>Policy editor</CardTitle>
                  <CardDescription>JSON arrays are validated before save. Allowed categories: {proofCategories.join(", ")}.</CardDescription>
                </div>
                <ShieldCheck className="size-5 text-gold-100" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {notice ? <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</div> : null}
              {error ? <div className="rounded-3xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">{error}</div> : null}

              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-foreground">Policy name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold-200/50" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span className="font-semibold text-foreground">Required proof categories JSON</span>
                  <textarea value={form.requiredProofCategoriesJson} onChange={(event) => setForm((current) => ({ ...current, requiredProofCategoriesJson: event.target.value }))} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs outline-none focus:border-gold-200/50" />
                  <span className={requiredPreview.ok ? "text-xs text-emerald-100" : "text-xs text-amber-100"}>{requiredPreview.message}</span>
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-semibold text-foreground">Warning proof categories JSON</span>
                  <textarea value={form.warningProofCategoriesJson} onChange={(event) => setForm((current) => ({ ...current, warningProofCategoriesJson: event.target.value }))} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs outline-none focus:border-gold-200/50" />
                  <span className={warningPreview.ok ? "text-xs text-emerald-100" : "text-xs text-amber-100"}>{warningPreview.message}</span>
                </label>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-foreground">Minimum proof completeness score</span>
                <input type="number" min={0} max={100} value={form.minimumProofCompletenessScore} onChange={(event) => setForm((current) => ({ ...current, minimumProofCompletenessScore: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold-200/50" />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <ToggleRow label="Block on unreviewed critical artifacts" description="Pending shipment, marketplace, or payout proof artifacts block publishing." checked={form.blockOnUnreviewedCriticalArtifacts} onChange={(checked) => setForm((current) => ({ ...current, blockOnUnreviewedCriticalArtifacts: checked }))} />
                <ToggleRow label="Block hidden leak risk" description="Snapshot cannot expose more visible proof counts than investor-visible artifacts." checked={form.blockOnHiddenInvestorLeakRisk} onChange={(checked) => setForm((current) => ({ ...current, blockOnHiddenInvestorLeakRisk: checked }))} />
                <ToggleRow label="Block stale snapshot" description="Snapshot must be regenerated after allocation linkage changes." checked={form.blockOnStaleSnapshot} onChange={(checked) => setForm((current) => ({ ...current, blockOnStaleSnapshot: checked }))} />
                <ToggleRow label="Allow publish with warnings" description="Warnings can pass only if acknowledged when required." checked={form.allowPublishWithWarnings} onChange={(checked) => setForm((current) => ({ ...current, allowPublishWithWarnings: checked }))} />
                <ToggleRow label="Require warning acknowledgment" description="Admin must acknowledge non-blocking warnings before publish." checked={form.requireWarningAcknowledgment} onChange={(checked) => setForm((current) => ({ ...current, requireWarningAcknowledgment: checked }))} />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button disabled={isSaving || !requiredPreview.ok || !warningPreview.ok} onClick={() => saveNewPolicy(false)} variant="outline">
                  <Save className="mr-2 size-4" /> Save as draft version
                </Button>
                <Button disabled={isSaving || !requiredPreview.ok || !warningPreview.ok} onClick={() => saveNewPolicy(true)}>
                  <CheckCircle2 className="mr-2 size-4" /> Save and activate new version
                </Button>
                <Button disabled={isSaving || isDefaultActive || !requiredPreview.ok || !warningPreview.ok} onClick={updateActivePolicy} variant="secondary">
                  <RotateCcw className="mr-2 size-4" /> Update active policy
                </Button>
              </div>
              {isDefaultActive ? (
                <p className="text-xs leading-5 text-muted-foreground">The safe default policy is code-owned and cannot be edited directly. Save it as a new database-backed version before changing it.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
