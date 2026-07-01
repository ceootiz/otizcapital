"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { createAdminFormatters, localeNames, localeShortNames, locales, type Locale } from "@otiz/lib";
import type { SerializedDepositAddress } from "@otiz/database";
import { Button } from "@otiz/ui";

const STRINGS = {
  en: {
    logout: "Logout",
    loggingOut: "Closing...",
    language: "Language",
    currentPreference: "Current preference",
    reinvestEnabled: "Reinvest enabled",
    reinvestDisabled: "Reinvest disabled",
    reinvestNote: "This MVP stores the preference locally in the interface only. A manager review step should confirm any permanent instruction.",
    enableReinvest: "Enable reinvest",
    disableReinvest: "Disable reinvest",
    requestTitle: "Request withdrawal",
    requestSubtitle: "Submit a manager-reviewed withdrawal request. Requests are reviewed before any payout is scheduled.",
    available: "Available for withdrawal",
    amountLabel: "Amount (USD)",
    networkLabel: "Network",
    addressLabel: "Destination address",
    addressPlaceholder: "Wallet address",
    noteLabel: "Note (optional)",
    submit: "Submit request",
    submitting: "Submitting...",
    successTitle: "Request submitted, pending admin review",
    successBody: "You can track its status in your withdrawal history below.",
    another: "Submit another request",
    errAmount: "Enter a valid amount greater than 0.",
    errExceeds: "Amount exceeds your available balance.",
    errAddress: "Destination address is required.",
    errGeneric: "Unable to submit withdrawal request.",
    lockTitle: "Withdrawals locked (90-day period)",
    lockBodyWithDate: "Funds can be withdrawn after a 90-day holding period from your first allocation. Withdrawals unlock on {date}.",
    lockBodyNoDate: "Withdrawals unlock 90 days after your first capital allocation begins."
  },
  ru: {
    logout: "Выйти",
    loggingOut: "Выход...",
    language: "Язык",
    currentPreference: "Текущее предпочтение",
    reinvestEnabled: "Реинвест включён",
    reinvestDisabled: "Реинвест выключен",
    reinvestNote: "В этой MVP-версии предпочтение сохраняется только локально в интерфейсе. Постоянное изменение инструкции должно подтверждаться менеджером.",
    enableReinvest: "Включить реинвест",
    disableReinvest: "Выключить реинвест",
    requestTitle: "Запросить вывод",
    requestSubtitle: "Отправьте запрос на вывод для проверки менеджером. Запросы рассматриваются до планирования выплаты.",
    available: "Доступно для вывода",
    amountLabel: "Сумма (USD)",
    networkLabel: "Сеть",
    addressLabel: "Адрес назначения",
    addressPlaceholder: "Адрес кошелька",
    noteLabel: "Примечание (необязательно)",
    submit: "Отправить запрос",
    submitting: "Отправка...",
    successTitle: "Запрос отправлен, ожидает проверки администратором",
    successBody: "Вы можете отслеживать статус в истории выводов ниже.",
    another: "Отправить ещё один запрос",
    errAmount: "Введите корректную сумму больше 0.",
    errExceeds: "Сумма превышает доступный баланс.",
    errAddress: "Укажите адрес назначения.",
    errGeneric: "Не удалось отправить запрос на вывод.",
    lockTitle: "Выводы заблокированы (90-дневный период)",
    lockBodyWithDate: "Средства можно вывести после 90-дневного периода удержания с момента первой аллокации. Вывод станет доступен {date}.",
    lockBodyNoDate: "Выводы станут доступны через 90 дней после начала первой аллокации капитала."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const CRYPTO_NETWORKS = ["USDT (TRC20)", "USDT (ERC20)", "USDT (BEP20)", "BTC", "ETH (ERC20)"] as const;

export function InvestorLogoutButton({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/investor/logout", { method: "POST" }).catch(() => undefined);
    router.push(`/${locale}/investor/login`);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isLoggingOut} onClick={logout}>
      {isLoggingOut ? t.loggingOut : t.logout}
    </Button>
  );
}

// Locale switcher that preserves the current path (/ru/investor/dashboard → /en/investor/dashboard).
export function InvestorLocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;

  function localeHref(next: Locale) {
    const segments = pathname.split("/");
    if (segments.length > 1 && segments[1]) {
      segments[1] = next;
      return segments.join("/") || `/${next}`;
    }
    return `/${next}`;
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1" aria-label={getStrings(locale).language}>
      {locales.map((next) => (
        <Link
          key={next}
          href={localeHref(next)}
          title={localeNames[next]}
          className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ${
            locale === next ? "bg-gold-200 text-graphite-950" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {localeShortNames[next]}
        </Link>
      ))}
    </div>
  );
}

export function ReinvestPreferenceControl({ locale, initialEnabled }: { locale: Locale; initialEnabled: boolean }) {
  const t = getStrings(locale);
  const [enabled, setEnabled] = React.useState(initialEnabled);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.currentPreference}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{enabled ? t.reinvestEnabled : t.reinvestDisabled}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.reinvestNote}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" size="sm" disabled={enabled} onClick={() => setEnabled(true)}>
          {t.enableReinvest}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!enabled} onClick={() => setEnabled(false)}>
          {t.disableReinvest}
        </Button>
      </div>
    </div>
  );
}

// Investor-facing withdrawal request form (wired to POST /api/investor/withdrawals).
// The 90-day lock is a UI gate: when `locked`, the form is replaced by a notice.
export function InvestorWithdrawalForm({
  locale,
  availableAmount,
  locked,
  unlockDate
}: {
  locale: Locale;
  availableAmount: number;
  locked: boolean;
  unlockDate: string | null;
}) {
  const t = getStrings(locale);
  const fmt = createAdminFormatters(locale);
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [network, setNetwork] = React.useState<string>(CRYPTO_NETWORKS[0]);
  const [address, setAddress] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (locked) {
    return (
      <div className="rounded-[1.5rem] border border-gold-200/25 bg-gold-200/10 p-5">
        <p className="font-semibold text-gold-100">{t.lockTitle}</p>
        <p className="mt-2 text-sm leading-6 text-gold-100/90">
          {unlockDate ? t.lockBodyWithDate.replace("{date}", fmt.date(unlockDate)) : t.lockBodyNoDate}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-[1.5rem] border border-emerald-400/25 bg-emerald-400/10 p-5">
        <p className="font-semibold text-emerald-200">{t.successTitle}</p>
        <p className="mt-2 text-sm leading-6 text-emerald-100/90">{t.successBody}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => { setSubmitted(false); setAmount(""); setAddress(""); setNote(""); }}>
          {t.another}
        </Button>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t.errAmount);
      return;
    }
    if (numericAmount > availableAmount) {
      setError(t.errExceeds);
      return;
    }
    if (!address.trim()) {
      setError(t.errAddress);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investor/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: String(numericAmount),
          currency: "USD",
          method: network,
          destinationMasked: address.trim(),
          investorNote: note.trim() || undefined
        })
      });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error || t.errGeneric);
      setSubmitted(true);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error && submitError.message ? submitError.message : t.errGeneric);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-[3rem] rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15";

  return (
    <form className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5" onSubmit={onSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.requestTitle}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.requestSubtitle}</p>
      <p className="mt-3 text-sm text-foreground">
        {t.available}: <span className="font-semibold text-gold-100">{fmt.currency(availableAmount)}</span>
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.amountLabel}</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.networkLabel}</span>
          <select value={network} onChange={(event) => setNetwork(event.target.value)} className={inputClass}>
            {CRYPTO_NETWORKS.map((value) => (
              <option key={value} value={value} className="bg-graphite-900 text-foreground">
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.addressLabel}</span>
        <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t.addressPlaceholder} className={inputClass} />
      </label>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.noteLabel}</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15" />
      </label>

      {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}

      <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? t.submitting : t.submit}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Deposit addresses (grouped by currency, with copy button + QR code)
// ---------------------------------------------------------------------------

const DEPOSIT_STRINGS = {
  en: { network: "Network", copy: "Copy", copied: "Copied" },
  ru: { network: "Сеть", copy: "Копировать", copied: "Скопировано" }
} as const;

type DepositStrings = typeof DEPOSIT_STRINGS.en;
const getDepositStrings = (locale: Locale): DepositStrings =>
  (DEPOSIT_STRINGS as unknown as Record<string, DepositStrings>)[locale] ?? DEPOSIT_STRINGS.en;

export function InvestorDepositAddresses({ locale, addresses }: { locale: Locale; addresses: SerializedDepositAddress[] }) {
  const t = getDepositStrings(locale);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  async function copyAddress(id: string, address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2000);
    } catch {
      // Clipboard access can fail (e.g. insecure context); silently ignore.
    }
  }

  const groups = React.useMemo(() => {
    const map = new Map<string, SerializedDepositAddress[]>();
    for (const address of addresses) {
      const list = map.get(address.currency) ?? [];
      list.push(address);
      map.set(address.currency, list);
    }
    return Array.from(map.entries());
  }, [addresses]);

  return (
    <div className="grid gap-6">
      {groups.map(([currency, groupAddresses]) => (
        <div key={currency} className="grid gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">{currency}</p>
          <div className="grid gap-4">
            {groupAddresses.map((address) => (
              <div key={address.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.network}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{address.network}</p>
                    <p className="mt-4 break-all font-mono text-sm leading-6 text-foreground">{address.address}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => copyAddress(address.id, address.address)}
                    >
                      {copiedId === address.id ? t.copied : t.copy}
                    </Button>
                  </div>
                  <div className="flex shrink-0 items-center justify-center rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    <QRCodeSVG value={address.address} size={140} bgColor="#00000000" fgColor="#f4e8cd" level="M" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
