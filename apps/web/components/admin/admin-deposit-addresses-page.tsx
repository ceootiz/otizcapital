"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@otiz/ui";
import type { Locale } from "@otiz/lib";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

type DepositAddress = {
  id: string;
  currency: string;
  network: string;
  address: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const STRINGS = {
  en: {
    eyebrow: "Crypto deposits",
    title: "Deposit addresses",
    description: "Manage the crypto deposit addresses shown to investors. Only active addresses are visible on the site.",
    backHome: "Back to homepage",
    createTitle: "Add a deposit address",
    currency: "Currency",
    network: "Network",
    address: "Address",
    order: "Order",
    active: "Active",
    add: "Add",
    adding: "Adding...",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting...",
    activate: "Activate",
    deactivate: "Deactivate",
    updating: "Updating...",
    deleteConfirm: "Delete this deposit address? This cannot be undone.",
    empty: "No deposit addresses yet. Add the first one above.",
    statusActive: "Active",
    statusInactive: "Inactive",
    created: "Deposit address added.",
    updated: "Deposit address updated.",
    deleted: "Deposit address deleted.",
    createError: "Unable to add deposit address.",
    updateError: "Unable to update deposit address.",
    deleteError: "Unable to delete deposit address.",
    requiredError: "Currency, network and address are required."
  },
  ru: {
    eyebrow: "Крипто-пополнения",
    title: "Пополнение",
    description: "Управляйте крипто-адресами для пополнения, которые видят инвесторы. На сайте отображаются только активные адреса.",
    backHome: "На главную",
    createTitle: "Добавить адрес пополнения",
    currency: "Валюта",
    network: "Сеть",
    address: "Адрес",
    order: "Порядок",
    active: "Активен",
    add: "Добавить",
    adding: "Добавление...",
    save: "Сохранить",
    saving: "Сохранение...",
    cancel: "Отмена",
    edit: "Редактировать",
    delete: "Удалить",
    deleting: "Удаление...",
    activate: "Активировать",
    deactivate: "Деактивировать",
    updating: "Обновление...",
    deleteConfirm: "Удалить этот адрес пополнения? Это действие необратимо.",
    empty: "Адресов пополнения пока нет. Добавьте первый выше.",
    statusActive: "Активен",
    statusInactive: "Неактивен",
    created: "Адрес пополнения добавлен.",
    updated: "Адрес пополнения обновлён.",
    deleted: "Адрес пополнения удалён.",
    createError: "Не удалось добавить адрес пополнения.",
    updateError: "Не удалось обновить адрес пополнения.",
    deleteError: "Не удалось удалить адрес пополнения.",
    requiredError: "Валюта, сеть и адрес обязательны."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

const inputClass = "rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground";
const labelClass = "flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export function AdminDepositAddressesPage({
  locale,
  addresses
}: {
  locale: Locale;
  addresses: DepositAddress[];
}) {
  const t = getStrings(locale);

  const [items, setItems] = useState<DepositAddress[]>(addresses);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  // Create form state.
  const [form, setForm] = useState({ currency: "", network: "", address: "", sortOrder: "0", isActive: true });
  const [creating, setCreating] = useState(false);

  // Per-row busy state.
  const [busyId, setBusyId] = useState<string | null>(null);
  // Inline edit drafts keyed by id.
  const [editing, setEditing] = useState<Record<string, { currency: string; network: string; address: string; sortOrder: string }>>({});

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.currency.localeCompare(b.currency) || a.createdAt.localeCompare(b.createdAt)
      ),
    [items]
  );

  const csrfHeaders = useCallback(
    (json = true): Record<string, string> => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE)
    }),
    []
  );

  const create = useCallback(async () => {
    const currency = form.currency.trim();
    const network = form.network.trim();
    const address = form.address.trim();
    if (!currency || !network || !address) {
      setNotice({ tone: "error", message: t.requiredError });
      return;
    }
    setCreating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/deposit-addresses", {
        method: "POST",
        headers: csrfHeaders(),
        body: JSON.stringify({
          currency,
          network,
          address,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0
        })
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.createError);
      setItems((current) => [...current, body.address as DepositAddress]);
      setForm({ currency: "", network: "", address: "", sortOrder: "0", isActive: true });
      setNotice({ tone: "ok", message: t.created });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.createError });
    } finally {
      setCreating(false);
    }
  }, [form, csrfHeaders, t.created, t.createError, t.requiredError]);

  const patch = useCallback(
    async (id: string, changes: Partial<Pick<DepositAddress, "currency" | "network" | "address" | "isActive" | "sortOrder">>) => {
      setBusyId(id);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/deposit-addresses/${id}`, {
          method: "PATCH",
          headers: csrfHeaders(),
          body: JSON.stringify(changes)
        });
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error || t.updateError);
        setItems((current) => current.map((item) => (item.id === id ? (body.address as DepositAddress) : item)));
        setNotice({ tone: "ok", message: t.updated });
        return true;
      } catch (error) {
        setNotice({ tone: "error", message: error instanceof Error ? error.message : t.updateError });
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [csrfHeaders, t.updated, t.updateError]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!window.confirm(t.deleteConfirm)) return;
      setBusyId(id);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/deposit-addresses/${id}`, {
          method: "DELETE",
          headers: csrfHeaders(false)
        });
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error || t.deleteError);
        setItems((current) => current.filter((item) => item.id !== id));
        setNotice({ tone: "ok", message: t.deleted });
      } catch (error) {
        setNotice({ tone: "error", message: error instanceof Error ? error.message : t.deleteError });
      } finally {
        setBusyId(null);
      }
    },
    [csrfHeaders, t.deleteConfirm, t.deleted, t.deleteError]
  );

  const startEdit = useCallback((item: DepositAddress) => {
    setEditing((current) => ({
      ...current,
      [item.id]: {
        currency: item.currency,
        network: item.network,
        address: item.address,
        sortOrder: String(item.sortOrder)
      }
    }));
  }, []);

  const cancelEdit = useCallback((id: string) => {
    setEditing((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const saveEdit = useCallback(
    async (id: string) => {
      const draft = editing[id];
      if (!draft) return;
      const ok = await patch(id, {
        currency: draft.currency.trim(),
        network: draft.network.trim(),
        address: draft.address.trim(),
        sortOrder: Number(draft.sortOrder) || 0
      });
      if (ok) cancelEdit(id);
    },
    [editing, patch, cancelEdit]
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <Link href={`/${locale}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← {t.backHome}
        </Link>


        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-200/70">{t.eyebrow}</span>
          <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t.description}</p>
        </header>

        {notice && (
          <p
            className={`rounded-lg border px-4 py-2 text-sm ${
              notice.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-red-400/30 bg-red-400/10 text-red-200"
            }`}
          >
            {notice.message}
          </p>
        )}

        {/* Create form */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-foreground">{t.createTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>
              {t.currency}
              <input
                type="text"
                value={form.currency}
                onChange={(event) => setForm((f) => ({ ...f, currency: event.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              {t.network}
              <input
                type="text"
                value={form.network}
                onChange={(event) => setForm((f) => ({ ...f, network: event.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              {t.address}
              <input
                type="text"
                value={form.address}
                onChange={(event) => setForm((f) => ({ ...f, address: event.target.value }))}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              {t.order}
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm((f) => ({ ...f, sortOrder: event.target.value }))}
                className={`${inputClass} w-32`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground sm:self-end">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((f) => ({ ...f, isActive: event.target.checked }))}
              />
              {t.active}
            </label>
          </div>
          <div>
            <Button type="button" onClick={() => void create()} disabled={creating}>
              {creating ? t.adding : t.add}
            </Button>
          </div>
        </section>

        {/* Existing addresses */}
        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.02] p-6 text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((item) => {
              const draft = editing[item.id];
              const busy = busyId === item.id;
              return (
                <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-5">
                  {draft ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <label className={labelClass}>
                        {t.currency}
                        <input
                          type="text"
                          value={draft.currency}
                          onChange={(event) =>
                            setEditing((c) => ({ ...c, [item.id]: { ...draft, currency: event.target.value } }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className={labelClass}>
                        {t.network}
                        <input
                          type="text"
                          value={draft.network}
                          onChange={(event) =>
                            setEditing((c) => ({ ...c, [item.id]: { ...draft, network: event.target.value } }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className={`${labelClass} sm:col-span-2`}>
                        {t.address}
                        <input
                          type="text"
                          value={draft.address}
                          onChange={(event) =>
                            setEditing((c) => ({ ...c, [item.id]: { ...draft, address: event.target.value } }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className={labelClass}>
                        {t.order}
                        <input
                          type="number"
                          value={draft.sortOrder}
                          onChange={(event) =>
                            setEditing((c) => ({ ...c, [item.id]: { ...draft, sortOrder: event.target.value } }))
                          }
                          className={`${inputClass} w-32`}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-foreground">{item.currency}</span>
                        <span className="rounded-full border border-border dark:border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {item.network}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.isActive
                              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                              : "border border-border dark:border-white/10 text-muted-foreground"
                          }`}
                        >
                          {item.isActive ? t.statusActive : t.statusInactive}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.order}: {item.sortOrder}
                        </span>
                      </div>
                      <code className="break-all rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-xs text-foreground">
                        {item.address}
                      </code>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {draft ? (
                      <>
                        <Button type="button" onClick={() => void saveEdit(item.id)} disabled={busy}>
                          {busy ? t.saving : t.save}
                        </Button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(item.id)}
                          disabled={busy}
                          className="rounded-full border border-border dark:border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                        >
                          {t.cancel}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={busy}
                        className="rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                      >
                        {t.edit}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void patch(item.id, { isActive: !item.isActive })}
                      disabled={busy}
                      className="rounded-full border border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30 dark:hover:bg-gold-200/20 disabled:opacity-40"
                    >
                      {busy ? t.updating : item.isActive ? t.deactivate : t.activate}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      disabled={busy}
                      className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-400/10 disabled:opacity-40"
                    >
                      {busy ? t.deleting : t.delete}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
