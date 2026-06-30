"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus, Save, ShieldCheck } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const INVESTOR_STATUSES = ["ACTIVE", "PAUSED", "CLOSED"] as const;
const ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
const REPORT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const ACTIVE_ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"];

type Allocation = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  estimatedResult: string | null;
  actualProfit: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type MonthlyReport = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummary: Record<string, number>;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvestorDetail = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  sourceApplicationId: string | null;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  allocations: Allocation[];
  monthlyReports: MonthlyReport[];
  sourceApplication: {
    id: string;
    fullName: string;
    email: string | null;
    status: string;
    plannedAllocationAmount: number;
    createdAt: string;
  } | null;
};

type InvestorDraft = {
  status: string;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: string;
  notes: string;
};

type AllocationDraft = {
  supplyCode: string;
  productName: string;
  marketplace: string;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: string;
  estimatedResult: string;
  notes: string;
};

type ReportDraft = {
  month: string;
  title: string;
  summary: string;
  performanceNote: string;
  payoutNote: string;
  status: string;
};

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return {
    "Content-Type": "application/json",
    [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE)
  };
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value || 0);
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function calculateKpis(allocations: Allocation[]) {
  return {
    activeCapital: allocations.filter((item) => ACTIVE_ALLOCATION_STATUSES.includes(item.status)).reduce((sum, item) => sum + Number(item.allocationAmount || 0), 0),
    totalProfit: allocations.filter((item) => item.status === "COMPLETED").reduce((sum, item) => sum + Number(item.actualProfit || 0), 0),
    activeAllocations: allocations.filter((item) => ACTIVE_ALLOCATION_STATUSES.includes(item.status)).length,
    completedAllocations: allocations.filter((item) => item.status === "COMPLETED").length
  };
}

export function AdminInvestorDetailPage({ locale, investor: initialInvestor }: { locale: Locale; investor: InvestorDetail }) {
  const [investor, setInvestor] = React.useState(initialInvestor);
  const [investorDraft, setInvestorDraft] = React.useState<InvestorDraft>(() => ({
    status: initialInvestor.status,
    totalCapital: initialInvestor.totalCapital,
    reinvestEnabled: initialInvestor.reinvestEnabled,
    lastReportAt: toDateInputValue(initialInvestor.lastReportAt),
    notes: initialInvestor.notes || ""
  }));
  const [allocationDraft, setAllocationDraft] = React.useState<AllocationDraft>({
    supplyCode: "",
    productName: "",
    marketplace: "",
    allocationAmount: "",
    currency: "USD",
    status: "DRAFT",
    expectedCycleDays: "45",
    estimatedResult: "",
    notes: ""
  });
  const [reportDraft, setReportDraft] = React.useState<ReportDraft>({ month: "", title: "", summary: "", performanceNote: "", payoutNote: "", status: "DRAFT" });
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSavingInvestor, setIsSavingInvestor] = React.useState(false);
  const [isCreatingAllocation, setIsCreatingAllocation] = React.useState(false);
  const [isCreatingReport, setIsCreatingReport] = React.useState(false);
  const [updatingReportId, setUpdatingReportId] = React.useState<string | null>(null);
  const [updatingAllocationId, setUpdatingAllocationId] = React.useState<string | null>(null);
  const kpis = calculateKpis(investor.allocations);

  async function saveInvestor() {
    setIsSavingInvestor(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          status: investorDraft.status,
          totalCapital: investorDraft.totalCapital,
          reinvestEnabled: investorDraft.reinvestEnabled,
          lastReportAt: investorDraft.lastReportAt || null,
          notes: investorDraft.notes
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Partial<InvestorDetail>; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to update investor.");
      setInvestor((current) => ({ ...current, ...payload.data }));
      setNotice("Investor profile updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update investor.");
    } finally {
      setIsSavingInvestor(false);
    }
  }

  async function createAllocation() {
    setIsCreatingAllocation(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}/allocations`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          ...allocationDraft,
          expectedCycleDays: allocationDraft.expectedCycleDays ? Number(allocationDraft.expectedCycleDays) : null
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Allocation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to create allocation.");
      setInvestor((current) => ({ ...current, allocations: [payload.data as Allocation, ...current.allocations] }));
      setAllocationDraft({ supplyCode: "", productName: "", marketplace: "", allocationAmount: "", currency: "USD", status: "DRAFT", expectedCycleDays: "45", estimatedResult: "", notes: "" });
      setNotice("Allocation created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create allocation.");
    } finally {
      setIsCreatingAllocation(false);
    }
  }

  async function updateAllocation(allocation: Allocation, payload: Partial<Allocation>) {
    setUpdatingAllocationId(allocation.id);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: Allocation; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to update allocation.");
      setInvestor((current) => ({
        ...current,
        allocations: current.allocations.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item))
      }));
      setNotice("Allocation updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update allocation.");
    } finally {
      setUpdatingAllocationId(null);
    }
  }

  async function createReport() {
    setIsCreatingReport(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}/reports`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(reportDraft)
      });
      const payload = (await response.json()) as { ok: boolean; data?: MonthlyReport; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to create report.");
      setInvestor((current) => ({ ...current, monthlyReports: [payload.data as MonthlyReport, ...current.monthlyReports] }));
      setReportDraft({ month: "", title: "", summary: "", performanceNote: "", payoutNote: "", status: "DRAFT" });
      setNotice("Monthly report created.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create report.");
    } finally {
      setIsCreatingReport(false);
    }
  }

  async function updateReport(report: MonthlyReport, payload: Partial<MonthlyReport>) {
    setUpdatingReportId(report.id);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${report.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: MonthlyReport; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to update report.");
      setInvestor((current) => ({
        ...current,
        monthlyReports: current.monthlyReports.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item))
      }));
      setNotice("Monthly report updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update report.");
    } finally {
      setUpdatingReportId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/investors`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to investors
            </Link>
            <AdminNavigation locale={locale} activeSection="investors" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Managed investor profile</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{investor.fullName}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{investor.email} {investor.telegram ? `· ${investor.telegram}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{investor.status}</Badge>
                <Badge variant="secondary">Reinvest {investor.reinvestEnabled ? "enabled" : "disabled"}</Badge>
              </div>
            </CardContent>
          </Card>

          {notice ? <AdminNotice tone="success" message={notice} /> : null}
          {error ? <AdminNotice tone="error" message={error} /> : null}

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Active capital" value={formatMoney(kpis.activeCapital)} />
            <KpiCard label="Total profit" value={formatMoney(kpis.totalProfit)} />
            <KpiCard label="Active allocations" value={String(kpis.activeAllocations)} />
            <KpiCard label="Completed allocations" value={String(kpis.completedAllocations)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="grid gap-6">
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Edit investor</CardTitle>
                  <CardDescription>Admin-managed profile fields only. No money movement is performed here.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                    <select value={investorDraft.status} onChange={(event) => setInvestorDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                      {INVESTOR_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{status}</option>)}
                    </select>
                  </label>
                  <CrmInput label="Total capital" value={investorDraft.totalCapital} onChange={(value) => setInvestorDraft((current) => ({ ...current, totalCapital: value }))} placeholder="25000" />
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
                    <input type="checkbox" checked={investorDraft.reinvestEnabled} onChange={(event) => setInvestorDraft((current) => ({ ...current, reinvestEnabled: event.target.checked }))} />
                    Reinvest enabled
                  </label>
                  <CrmInput label="Last report date" type="date" value={investorDraft.lastReportAt} onChange={(value) => setInvestorDraft((current) => ({ ...current, lastReportAt: value }))} placeholder="" />
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notes</span>
                    <textarea value={investorDraft.notes} onChange={(event) => setInvestorDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                  </label>
                  <Button type="button" disabled={isSavingInvestor} onClick={saveInvestor}>
                    <Save data-icon="inline-start" />
                    {isSavingInvestor ? "Saving..." : "Save investor"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Source application</CardTitle>
                  <CardDescription>Original approved lead context.</CardDescription>
                </CardHeader>
                <CardContent>
                  {investor.sourceApplication ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <p className="font-semibold text-foreground">{investor.sourceApplication.fullName}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{investor.sourceApplication.email || "No email"} · {investor.sourceApplication.status}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Planned allocation: {formatMoney(investor.sourceApplication.plannedAllocationAmount)}</p>
                      <Link href={`/${locale}/admin/applications?search=${investor.sourceApplication.id}`} className="mt-3 inline-flex text-sm font-semibold text-gold-100">Open source application</Link>
                    </div>
                  ) : (
                    <p className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">No source application linked.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Create managed allocation</CardTitle>
                  <CardDescription>One supply allocation assigned to this investor. No investor self-service creation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <CrmInput label="Supply code" value={allocationDraft.supplyCode} onChange={(value) => setAllocationDraft((current) => ({ ...current, supplyCode: value }))} placeholder="SUP-APL-0526-102" />
                  <CrmInput label="Product" value={allocationDraft.productName} onChange={(value) => setAllocationDraft((current) => ({ ...current, productName: value }))} placeholder="iPhone 15 Pro batch" />
                  <CrmInput label="Marketplace" value={allocationDraft.marketplace} onChange={(value) => setAllocationDraft((current) => ({ ...current, marketplace: value }))} placeholder="Amazon / eBay / local" />
                  <CrmInput label="Allocation amount" value={allocationDraft.allocationAmount} onChange={(value) => setAllocationDraft((current) => ({ ...current, allocationAmount: value }))} placeholder="10000" />
                  <CrmInput label="Currency" value={allocationDraft.currency} onChange={(value) => setAllocationDraft((current) => ({ ...current, currency: value }))} placeholder="USD" />
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                    <select value={allocationDraft.status} onChange={(event) => setAllocationDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                      {ALLOCATION_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{status}</option>)}
                    </select>
                  </label>
                  <CrmInput label="Expected cycle days" value={allocationDraft.expectedCycleDays} onChange={(value) => setAllocationDraft((current) => ({ ...current, expectedCycleDays: value }))} placeholder="45" />
                  <CrmInput label="Estimated result" value={allocationDraft.estimatedResult} onChange={(value) => setAllocationDraft((current) => ({ ...current, estimatedResult: value }))} placeholder="Operational estimate" />
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notes</span>
                    <textarea value={allocationDraft.notes} onChange={(event) => setAllocationDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                  </label>
                  <div className="md:col-span-2">
                    <Button type="button" disabled={isCreatingAllocation} onClick={createAllocation}>
                      <PackagePlus data-icon="inline-start" />
                      {isCreatingAllocation ? "Creating..." : "Create allocation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Allocations</CardTitle>
                  <CardDescription>Managed electronics commerce allocations for this investor.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {investor.allocations.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                      <ShieldCheck className="mx-auto size-8 text-gold-100" />
                      <p className="mt-4 font-semibold text-foreground">No allocations yet</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Create the first managed allocation when capital is assigned to a real supply cycle.</p>
                    </div>
                  ) : (
                    investor.allocations.map((allocation) => (
                      <div key={allocation.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                        <Link href={`/${locale}/admin/allocations/${allocation.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                            <h3 className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{allocation.marketplace || "Marketplace not set"}</p>
                          </div>
                          <Badge>{allocation.status}</Badge>
                        </Link>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <Metric label="Amount" value={formatMoney(allocation.allocationAmount)} />
                          <Metric label="Expected cycle" value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} days` : "-"} />
                          <Metric label="Estimated" value={allocation.estimatedResult || "-"} />
                          <Metric label="Actual profit" value={allocation.actualProfit ? formatMoney(allocation.actualProfit) : "-"} />
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                          <label className="grid gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Update status</span>
                            <select defaultValue={allocation.status} onChange={(event) => updateAllocation(allocation, { status: event.target.value })} disabled={updatingAllocationId === allocation.id} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                              {ALLOCATION_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{status}</option>)}
                            </select>
                          </label>
                          <CrmInput label="Actual profit" value={allocation.actualProfit || ""} onChange={(value) => updateAllocation(allocation, { actualProfit: value || null })} placeholder="0" />
                          <span className="text-xs leading-5 text-muted-foreground">Updated {formatDate(allocation.updatedAt)}<br />Completed {formatDate(allocation.completedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Monthly reports</CardTitle>
                  <CardDescription>Admin-managed reporting. Proof summary includes only available or verified proof categories.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <CrmInput label="Month" value={reportDraft.month} onChange={(value) => setReportDraft((current) => ({ ...current, month: value }))} placeholder="May 2026" />
                    <CrmInput label="Title" value={reportDraft.title} onChange={(value) => setReportDraft((current) => ({ ...current, title: value }))} placeholder="May operational report" />
                    <label className="grid gap-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Summary</span>
                      <textarea value={reportDraft.summary} onChange={(event) => setReportDraft((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                    </label>
                    <CrmInput label="Performance note" value={reportDraft.performanceNote} onChange={(value) => setReportDraft((current) => ({ ...current, performanceNote: value }))} placeholder="Operational performance note" />
                    <CrmInput label="Payout note" value={reportDraft.payoutNote} onChange={(value) => setReportDraft((current) => ({ ...current, payoutNote: value }))} placeholder="Payout or reinvest note" />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</span>
                      <select value={reportDraft.status} onChange={(event) => setReportDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                        {REPORT_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{status}</option>)}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <Button type="button" disabled={isCreatingReport} onClick={createReport}>{isCreatingReport ? "Creating..." : "Create report"}</Button>
                    </div>
                  </div>
                  <Separator />
                  {investor.monthlyReports.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
                      <p className="font-semibold text-foreground">No reports yet</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Create a draft report when monthly operations are ready for manager review.</p>
                    </div>
                  ) : (
                    investor.monthlyReports.map((report) => (
                      <div key={report.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{report.month}</p>
                            <Link href={`/${locale}/admin/reports/${report.id}`} className="mt-2 block text-lg font-semibold text-foreground transition-colors hover:text-gold-100">{report.title}</Link>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.summary}</p>
                          </div>
                          <Badge>{report.status}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <Metric label="Published" value={formatDate(report.publishedAt)} />
                          <Metric label="Proof categories" value={Object.keys(report.proofSummary).length ? Object.entries(report.proofSummary).map(([type, count]) => `${type}: ${count}`).join(", ") : "No available proofs"} />
                          <Metric label="Updated" value={formatDate(report.updatedAt)} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {REPORT_STATUSES.map((status) => (
                            <Button key={status} type="button" variant="outline" size="sm" disabled={updatingReportId === report.id || report.status === status} onClick={() => updateReport(report, { status })}>{status}</Button>
                          ))}
                          <Button type="button" size="sm" disabled={updatingReportId === report.id || report.status === "PUBLISHED"} onClick={() => updateReport(report, { status: "PUBLISHED" })}>Publish</Button>
                          <Link href={`/${locale}/admin/reports/${report.id}`} className="inline-flex h-9 items-center rounded-full border border-white/10 px-4 text-sm font-semibold text-gold-100 transition-colors hover:bg-white/[0.06]">Open report</Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.5rem] bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function CrmInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
    </label>
  );
}

function AdminNotice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>
      {message}
    </div>
  );
}
