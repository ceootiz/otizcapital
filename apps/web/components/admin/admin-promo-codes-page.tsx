"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SerializedPromoCode } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}
function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

const ERROR_LABELS: Record<string, { en: string; ru: string }> = {
  CODE_REQUIRED: { en: "A code is required.", ru: "Укажите код." },
  RATE_INVALID: { en: "The yield rate is invalid.", ru: "Некорректная ставка доходности." },
  CODE_EXISTS: { en: "This code already exists.", ru: "Такой код уже существует." }
};

const STRINGS = {
  en: {
    title: "Promo codes",
    desc: "Codes granting a custom annual yield rate, applied on the apply form.",
    createTitle: "Create promo code",
    createDesc: "Yield rate is an annual percent (e.g. 60 = 60%/yr).",
    listTitle: "All promo codes",
    listEmpty: "No promo codes yet.",
    colCode: "Code",
    colRate: "Rate",
    colUses: "Used / Max",
    colExpires: "Expires",
    colActive: "Active",
    colCreated: "Created",
    labelCode: "Code",
    labelRate: "Yield rate (% / yr)",
    labelMaxUses: "Max uses (optional)",
    labelExpires: "Expires (optional)",
    labelActive: "Active",
    codePlaceholder: "SUMMER60",
    maxUsesPlaceholder: "unlimited",
    unlimited: "∞",
    noExpiry: "—",
    create: "Create",
    creating: "Creating...",
    save: "Save",
    saving: "Saving...",
    activate: "Activate",
    deactivate: "Deactivate",
    delete: "Delete",
    edit: "Edit",
    cancel: "Cancel",
    confirmDeleteTitle: "Delete promo code?",
    confirmDeleteDesc: (code: string) => `The code "${code}" will be permanently removed.`,
    active: "Active",
    inactive: "Inactive",
    errFallback: "Something went wrong. Please try again."
  },
  ru: {
    title: "Промокоды",
    desc: "Коды с индивидуальной годовой доходностью, применяются в форме заявки.",
    createTitle: "Создать промокод",
    createDesc: "Ставка доходности — годовой процент (например, 60 = 60%/год).",
    listTitle: "Все промокоды",
    listEmpty: "Пока нет промокодов.",
    colCode: "Код",
    colRate: "Ставка",
    colUses: "Использ. / Макс.",
    colExpires: "Истекает",
    colActive: "Активен",
    colCreated: "Создан",
    labelCode: "Код",
    labelRate: "Ставка доходности (% / год)",
    labelMaxUses: "Макс. использований (необязательно)",
    labelExpires: "Дата истечения (необязательно)",
    labelActive: "Активен",
    codePlaceholder: "SUMMER60",
    maxUsesPlaceholder: "без лимита",
    unlimited: "∞",
    noExpiry: "—",
    create: "Создать",
    creating: "Создаём...",
    save: "Сохранить",
    saving: "Сохраняем...",
    activate: "Включить",
    deactivate: "Отключить",
    delete: "Удалить",
    edit: "Изменить",
    cancel: "Отмена",
    confirmDeleteTitle: "Удалить промокод?",
    confirmDeleteDesc: (code: string) => `Код «${code}» будет удалён безвозвратно.`,
    active: "Активен",
    inactive: "Отключён",
    errFallback: "Что-то пошло не так. Попробуйте ещё раз."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

function localizeError(error: string, locale: Locale, fallback: string): string {
  const mapped = ERROR_LABELS[error];
  if (!mapped) return error || fallback;
  return locale === "ru" ? mapped.ru : mapped.en;
}

const cardClass = "rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]";
const inputClass =
  "h-11 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 text-sm text-foreground outline-none focus:border-gold-200/45";
const labelClass = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

// Converts an ISO string into the yyyy-MM-dd value a <input type="date"> expects.
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function AdminPromoCodesPage({ locale, promoCodes }: { locale: Locale; promoCodes: SerializedPromoCode[] }) {
  const t = getStrings(locale);
  const router = useRouter();
  const fmt = React.useMemo(() => createAdminFormatters(locale), [locale]);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<SerializedPromoCode | null>(null);

  // Create form state.
  const [code, setCode] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  // Edit-row drafts.
  const [editRate, setEditRate] = React.useState("");
  const [editMaxUses, setEditMaxUses] = React.useState("");
  const [editExpires, setEditExpires] = React.useState("");

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: getAdminMutationHeaders(),
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(localizeError(payload.error || "", locale, t.errFallback));
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errFallback);
      return false;
    }
  }

  async function create() {
    setCreating(true);
    const ok = await call("/api/admin/promo-codes", "POST", {
      code,
      yieldRateOverride: Number(rate),
      maxUses: maxUses.trim() === "" ? null : Number(maxUses),
      expiresAt: expiresAt.trim() === "" ? null : new Date(expiresAt).toISOString(),
      isActive
    });
    if (ok) {
      setCode("");
      setRate("");
      setMaxUses("");
      setExpiresAt("");
      setIsActive(true);
      router.refresh();
    }
    setCreating(false);
  }

  async function toggleActive(promo: SerializedPromoCode) {
    setBusyId(promo.id);
    if (await call(`/api/admin/promo-codes/${promo.id}`, "PATCH", { isActive: !promo.isActive })) router.refresh();
    setBusyId(null);
  }

  function startEdit(promo: SerializedPromoCode) {
    setEditingId(promo.id);
    setEditRate(String(promo.yieldRateOverride));
    setEditMaxUses(promo.maxUses != null ? String(promo.maxUses) : "");
    setEditExpires(toDateInput(promo.expiresAt));
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    const ok = await call(`/api/admin/promo-codes/${id}`, "PATCH", {
      yieldRateOverride: Number(editRate),
      maxUses: editMaxUses.trim() === "" ? null : Number(editMaxUses),
      expiresAt: editExpires.trim() === "" ? null : new Date(editExpires).toISOString()
    });
    if (ok) {
      setEditingId(null);
      router.refresh();
    }
    setBusyId(null);
  }

  async function remove(promo: SerializedPromoCode) {
    setBusyId(promo.id);
    if (await call(`/api/admin/promo-codes/${promo.id}`, "DELETE")) router.refresh();
    setBusyId(null);
    setConfirmDelete(null);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-[-0.03em] text-foreground">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="grid gap-6">
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>{t.createTitle}</CardTitle>
            <CardDescription>{t.createDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className={labelClass}>{t.labelCode}</span>
                <input className={inputClass} value={code} placeholder={t.codePlaceholder} onChange={(event) => setCode(event.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>{t.labelRate}</span>
                <input className={inputClass} inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>{t.labelMaxUses}</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  value={maxUses}
                  placeholder={t.maxUsesPlaceholder}
                  onChange={(event) => setMaxUses(event.target.value)}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>{t.labelExpires}</span>
                <input className={inputClass} type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </label>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-gold-200"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              {t.labelActive}
            </label>
            <div className="mt-5">
              <Button type="button" disabled={creating} onClick={create}>
                {creating ? t.creating : t.create}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>{t.listTitle}</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {promoCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.listEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem] text-sm">
                  <thead>
                    <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="pb-3 pr-4">{t.colCode}</th>
                      <th className="pb-3 pr-4">{t.colRate}</th>
                      <th className="pb-3 pr-4">{t.colUses}</th>
                      <th className="pb-3 pr-4">{t.colExpires}</th>
                      <th className="pb-3 pr-4">{t.colActive}</th>
                      <th className="pb-3 pr-4">{t.colCreated}</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo) => {
                      const isEditing = editingId === promo.id;
                      return (
                        <tr key={promo.id} className="border-t border-border dark:border-white/10 align-top">
                          <td className="py-3 pr-4 font-mono text-xs font-semibold text-foreground">{promo.code}</td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <input
                                className={`${inputClass} w-24`}
                                inputMode="decimal"
                                value={editRate}
                                onChange={(event) => setEditRate(event.target.value)}
                              />
                            ) : (
                              <span className="text-foreground">{fmt.number(promo.yieldRateOverride)}%</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <input
                                className={`${inputClass} w-24`}
                                inputMode="numeric"
                                value={editMaxUses}
                                placeholder={t.maxUsesPlaceholder}
                                onChange={(event) => setEditMaxUses(event.target.value)}
                              />
                            ) : (
                              <span className="text-foreground">
                                {fmt.number(promo.usedCount)} / {promo.maxUses != null ? fmt.number(promo.maxUses) : t.unlimited}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <input
                                className={`${inputClass} w-40`}
                                type="date"
                                value={editExpires}
                                onChange={(event) => setEditExpires(event.target.value)}
                              />
                            ) : (
                              <span className="text-muted-foreground">{promo.expiresAt ? fmt.date(new Date(promo.expiresAt)) : t.noExpiry}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={promo.isActive ? "default" : "outline"}>{promo.isActive ? t.active : t.inactive}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">{fmt.date(new Date(promo.createdAt))}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button type="button" size="sm" disabled={busyId === promo.id} onClick={() => saveEdit(promo.id)}>
                                    {busyId === promo.id ? t.saving : t.save}
                                  </Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                    {t.cancel}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(promo)}>
                                    {t.edit}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={busyId === promo.id}
                                    onClick={() => toggleActive(promo)}
                                  >
                                    {promo.isActive ? t.deactivate : t.activate}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    disabled={busyId === promo.id}
                                    onClick={() => setConfirmDelete(promo)}
                                  >
                                    {t.delete}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t.confirmDeleteTitle}
        description={confirmDelete ? t.confirmDeleteDesc(confirmDelete.code) : undefined}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        tone="destructive"
        loading={confirmDelete ? busyId === confirmDelete.id : false}
        onConfirm={() => confirmDelete && remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </main>
  );
}
