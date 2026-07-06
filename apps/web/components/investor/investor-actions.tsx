"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
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
    walletLabel: "Withdrawal wallet",
    noWallets: "You have no saved withdrawal wallets. Add one in Settings before requesting a withdrawal.",
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
    walletLabel: "Кошелёк для вывода",
    noWallets: "У вас нет сохранённых кошельков для вывода. Добавьте один в Настройках, прежде чем запрашивать вывод.",
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
  },
  es: {
    logout: "Cerrar sesión",
    loggingOut: "Cerrando...",
    language: "Idioma",
    currentPreference: "Preferencia actual",
    reinvestEnabled: "Reinversión activada",
    reinvestDisabled: "Reinversión desactivada",
    reinvestNote: "Esta versión MVP almacena la preferencia únicamente de forma local en la interfaz. Una revisión por parte de un gestor debe confirmar cualquier instrucción permanente.",
    enableReinvest: "Activar reinversión",
    disableReinvest: "Desactivar reinversión",
    requestTitle: "Solicitar retiro",
    requestSubtitle: "Envíe una solicitud de retiro revisada por un gestor. Las solicitudes se revisan antes de programar cualquier pago.",
    available: "Disponible para retiro",
    amountLabel: "Importe (USD)",
    networkLabel: "Red",
    addressLabel: "Dirección de destino",
    addressPlaceholder: "Dirección de la cartera",
    walletLabel: "Cartera de retiro",
    noWallets: "No tiene carteras de retiro guardadas. Agregue una en Ajustes antes de solicitar un retiro.",
    noteLabel: "Nota (opcional)",
    submit: "Enviar solicitud",
    submitting: "Enviando...",
    successTitle: "Solicitud enviada, pendiente de revisión por el administrador",
    successBody: "Puede seguir su estado en su historial de retiros a continuación.",
    another: "Enviar otra solicitud",
    errAmount: "Introduzca un importe válido mayor que 0.",
    errExceeds: "El importe supera su saldo disponible.",
    errAddress: "La dirección de destino es obligatoria.",
    errGeneric: "No se pudo enviar la solicitud de retiro.",
    lockTitle: "Retiros bloqueados (periodo de 90 días)",
    lockBodyWithDate: "Los fondos pueden retirarse tras un periodo de retención de 90 días desde su primera asignación. Los retiros se desbloquean el {date}.",
    lockBodyNoDate: "Los retiros se desbloquean 90 días después del inicio de su primera asignación de capital."
  },
  de: {
    logout: "Abmelden",
    loggingOut: "Wird geschlossen...",
    language: "Sprache",
    currentPreference: "Aktuelle Einstellung",
    reinvestEnabled: "Wiederanlage aktiviert",
    reinvestDisabled: "Wiederanlage deaktiviert",
    reinvestNote: "Diese MVP-Version speichert die Einstellung nur lokal in der Oberfläche. Eine Prüfung durch einen Manager sollte jede dauerhafte Anweisung bestätigen.",
    enableReinvest: "Wiederanlage aktivieren",
    disableReinvest: "Wiederanlage deaktivieren",
    requestTitle: "Auszahlung anfordern",
    requestSubtitle: "Reichen Sie einen von einem Manager geprüften Auszahlungsantrag ein. Anträge werden vor jeder geplanten Auszahlung geprüft.",
    available: "Verfügbar zur Auszahlung",
    amountLabel: "Betrag (USD)",
    networkLabel: "Netzwerk",
    addressLabel: "Zieladresse",
    addressPlaceholder: "Wallet-Adresse",
    walletLabel: "Auszahlungs-Wallet",
    noWallets: "Sie haben keine gespeicherten Auszahlungs-Wallets. Fügen Sie in den Einstellungen eine hinzu, bevor Sie eine Auszahlung anfordern.",
    noteLabel: "Notiz (optional)",
    submit: "Antrag einreichen",
    submitting: "Wird eingereicht...",
    successTitle: "Antrag eingereicht, wartet auf Prüfung durch den Administrator",
    successBody: "Sie können den Status unten in Ihrem Auszahlungsverlauf verfolgen.",
    another: "Weiteren Antrag einreichen",
    errAmount: "Geben Sie einen gültigen Betrag größer als 0 ein.",
    errExceeds: "Der Betrag übersteigt Ihr verfügbares Guthaben.",
    errAddress: "Die Zieladresse ist erforderlich.",
    errGeneric: "Der Auszahlungsantrag konnte nicht eingereicht werden.",
    lockTitle: "Auszahlungen gesperrt (90-Tage-Frist)",
    lockBodyWithDate: "Guthaben kann nach einer Haltefrist von 90 Tagen ab Ihrer ersten Allokation ausgezahlt werden. Auszahlungen werden am {date} freigegeben.",
    lockBodyNoDate: "Auszahlungen werden 90 Tage nach Beginn Ihrer ersten Kapitalallokation freigegeben."
  },
  zh: {
    logout: "退出登录",
    loggingOut: "正在关闭……",
    language: "语言",
    currentPreference: "当前偏好",
    reinvestEnabled: "已启用复投",
    reinvestDisabled: "已停用复投",
    reinvestNote: "此 MVP 版本仅在界面本地保存该偏好。任何永久性指令均应经由经理审核确认。",
    enableReinvest: "启用复投",
    disableReinvest: "停用复投",
    requestTitle: "申请提现",
    requestSubtitle: "提交由经理审核的提现申请。所有申请在安排付款前均会经过审核。",
    available: "可提现金额",
    amountLabel: "金额（USD）",
    networkLabel: "网络",
    addressLabel: "目标地址",
    addressPlaceholder: "钱包地址",
    walletLabel: "提现钱包",
    noWallets: "您没有已保存的提现钱包。请先在设置中添加一个，然后再申请提现。",
    noteLabel: "备注（可选）",
    submit: "提交申请",
    submitting: "正在提交……",
    successTitle: "申请已提交，等待管理员审核",
    successBody: "您可在下方的提现历史中查看其状态。",
    another: "提交另一份申请",
    errAmount: "请输入大于 0 的有效金额。",
    errExceeds: "金额超出您的可用余额。",
    errAddress: "目标地址为必填项。",
    errGeneric: "无法提交提现申请。",
    lockTitle: "提现已锁定（90 天期限）",
    lockBodyWithDate: "资金可在自首次资金配置起 90 天持有期后提现。提现将于 {date} 解锁。",
    lockBodyNoDate: "提现将在您首次资金配置开始 90 天后解锁。"
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

type WithdrawalWallet = {
  id: string;
  label: string;
  network: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
};

const shortAddress = (address: string): string => (address.length > 6 ? `…${address.slice(-6)}` : address);

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
    <div className="flex items-center gap-1 rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] p-1" aria-label={getStrings(locale).language}>
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
    <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5">
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
  const [wallets, setWallets] = React.useState<WithdrawalWallet[]>([]);
  const [walletId, setWalletId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadWallets() {
      try {
        const res = await fetch("/api/investor/wallets", { method: "GET" });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; data?: WithdrawalWallet[] } | null;
        if (!cancelled && res.ok && body?.ok && Array.isArray(body.data)) {
          setWallets(body.data);
          const preferred = body.data.find((w) => w.isDefault) ?? body.data[0];
          if (preferred) setWalletId(preferred.id);
        }
      } catch {
        // Leave wallet list empty; the form shows the "add a wallet" guidance.
      }
    }

    void loadWallets();
    return () => {
      cancelled = true;
    };
  }, []);

  if (locked) {
    return (
      <div className="rounded-[1.35rem] border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-5">
        <p className="font-semibold text-amber-700 dark:text-gold-100">{t.lockTitle}</p>
        <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-gold-100/90">
          {unlockDate ? t.lockBodyWithDate.replace("{date}", fmt.date(unlockDate)) : t.lockBodyNoDate}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-[1.35rem] border border-emerald-400/25 bg-emerald-400/10 p-5">
        <p className="font-semibold text-emerald-200">{t.successTitle}</p>
        <p className="mt-2 text-sm leading-6 text-emerald-100/90">{t.successBody}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => { setSubmitted(false); setAmount(""); setNote(""); }}>
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
    if (!walletId) {
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
          walletId,
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
    "h-[3rem] rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15";

  return (
    <form className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5" onSubmit={onSubmit} noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.requestTitle}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.requestSubtitle}</p>
      <p className="mt-3 text-sm text-foreground">
        {t.available}: <span className="font-semibold text-amber-700 dark:text-gold-100">{fmt.currency(availableAmount)}</span>
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.amountLabel}</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.walletLabel}</span>
          {wallets.length > 0 ? (
            <select value={walletId} onChange={(event) => setWalletId(event.target.value)} className={inputClass}>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id} className="bg-card dark:bg-graphite-900 text-foreground">
                  {`${wallet.label} · ${wallet.network} · ${shortAddress(wallet.address)}`}
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-2xl border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-3 text-sm leading-6 text-amber-700 dark:text-gold-100">
              {t.noWallets}
            </p>
          )}
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.noteLabel}</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="resize-none rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15" />
      </label>

      {error ? <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}

      <Button type="submit" className="mt-5 w-full sm:w-auto" disabled={isSubmitting || wallets.length === 0}>
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
  ru: { network: "Сеть", copy: "Копировать", copied: "Скопировано" },
  es: { network: "Red", copy: "Copiar", copied: "Copiado" },
  de: { network: "Netzwerk", copy: "Kopieren", copied: "Kopiert" },
  zh: { network: "网络", copy: "复制", copied: "已复制" }
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-gold-100">{currency}</p>
          <div className="grid gap-4">
            {groupAddresses.map((address) => (
              <div key={address.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5">
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
                  <div className="flex shrink-0 items-center justify-center rounded-[1rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-3">
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

// ---------------------------------------------------------------------------
// Notification bell + dropdown (investor cabinet header)
// ---------------------------------------------------------------------------

type InvestorNotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  linkHref: string | null;
  createdAt: string;
};

const NOTIFICATION_TITLES: Record<Locale, Record<string, string>> = {
  en: {
    ALLOCATION_UPDATED: "Allocation updated",
    ALLOCATION_COMPLETED: "Allocation completed",
    REPORT_PUBLISHED: "New report available",
    WITHDRAWAL_APPROVED: "Withdrawal request approved",
    WITHDRAWAL_SCHEDULED: "Payout scheduled",
    WITHDRAWAL_PAID: "Payout completed",
    WITHDRAWAL_REJECTED: "Withdrawal request declined"
  },
  ru: {
    ALLOCATION_UPDATED: "Ваша аллокация обновлена",
    ALLOCATION_COMPLETED: "Аллокация завершена",
    REPORT_PUBLISHED: "Новый отчёт доступен",
    WITHDRAWAL_APPROVED: "Запрос на вывод одобрен",
    WITHDRAWAL_SCHEDULED: "Выплата запланирована",
    WITHDRAWAL_PAID: "Выплата произведена",
    WITHDRAWAL_REJECTED: "Запрос на вывод отклонён"
  },
  es: {
    ALLOCATION_UPDATED: "Asignación actualizada",
    ALLOCATION_COMPLETED: "Asignación completada",
    REPORT_PUBLISHED: "Nuevo informe disponible",
    WITHDRAWAL_APPROVED: "Solicitud de retiro aprobada",
    WITHDRAWAL_SCHEDULED: "Pago programado",
    WITHDRAWAL_PAID: "Pago completado",
    WITHDRAWAL_REJECTED: "Solicitud de retiro rechazada"
  },
  de: {
    ALLOCATION_UPDATED: "Allokation aktualisiert",
    ALLOCATION_COMPLETED: "Allokation abgeschlossen",
    REPORT_PUBLISHED: "Neuer Bericht verfügbar",
    WITHDRAWAL_APPROVED: "Auszahlungsantrag genehmigt",
    WITHDRAWAL_SCHEDULED: "Auszahlung geplant",
    WITHDRAWAL_PAID: "Auszahlung abgeschlossen",
    WITHDRAWAL_REJECTED: "Auszahlungsantrag abgelehnt"
  },
  zh: {
    ALLOCATION_UPDATED: "资金配置已更新",
    ALLOCATION_COMPLETED: "资金配置已完成",
    REPORT_PUBLISHED: "新报告已发布",
    WITHDRAWAL_APPROVED: "提现申请已批准",
    WITHDRAWAL_SCHEDULED: "付款已安排",
    WITHDRAWAL_PAID: "付款已完成",
    WITHDRAWAL_REJECTED: "提现申请已拒绝"
  }
};

const BELL_STRINGS = {
  en: { title: "Notifications", empty: "No notifications yet.", ariaOpen: "Open notifications" },
  ru: { title: "Уведомления", empty: "Пока нет уведомлений.", ariaOpen: "Открыть уведомления" },
  es: { title: "Notificaciones", empty: "Aún no hay notificaciones.", ariaOpen: "Abrir notificaciones" },
  de: { title: "Benachrichtigungen", empty: "Noch keine Benachrichtigungen.", ariaOpen: "Benachrichtigungen öffnen" },
  zh: { title: "通知", empty: "暂无通知。", ariaOpen: "打开通知" }
} as const;

export function InvestorNotificationBell({ locale }: { locale: Locale }) {
  const s = (BELL_STRINGS as unknown as Record<string, (typeof BELL_STRINGS)["en"]>)[locale] ?? BELL_STRINGS.en;
  const titles = NOTIFICATION_TITLES[locale] ?? NOTIFICATION_TITLES.en;
  const fmt = React.useMemo(() => createAdminFormatters(locale), [locale]);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<InvestorNotificationItem[]>([]);
  const [unread, setUnread] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/investor/notifications", { cache: "no-store" });
      const body = await res.json();
      if (res.ok && body.ok) {
        setItems(body.notifications as InvestorNotificationItem[]);
        setUnread(Number(body.unreadCount) || 0);
      }
    } catch {
      // Silent: the bell degrades gracefully when the feed is unavailable.
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      await fetch("/api/investor/notifications/mark-read", { method: "POST" }).catch(() => undefined);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={s.ariaOpen}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4"
      >
        <Bell />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-gold-200 px-1 text-[0.6rem] font-semibold text-graphite-950">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.98] shadow-premium backdrop-blur-2xl">
          <div className="border-b border-border dark:border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{s.title}</p>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{s.empty}</p>
            ) : (
              items.map((item) => {
                const title = titles[item.type] ?? item.title;
                const inner = (
                  <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30 dark:hover:bg-white/[0.04] ${item.isRead ? "" : "bg-muted/30 dark:bg-white/[0.05]"}`}>
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-gold-200"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{fmt.dateTime(item.createdAt)}</p>
                    </div>
                  </div>
                );
                return item.linkHref ? (
                  <Link key={item.id} href={`/${locale}${item.linkHref}`} onClick={() => setOpen(false)} className="block border-b border-border dark:border-white/[0.06] last:border-b-0">
                    {inner}
                  </Link>
                ) : (
                  <div key={item.id} className="border-b border-border dark:border-white/[0.06] last:border-b-0">
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
