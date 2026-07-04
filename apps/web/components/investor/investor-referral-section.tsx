"use client";

import * as React from "react";
import { Copy } from "lucide-react";
import type { InvestorReferralData } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";

const STRINGS = {
  en: {
    title: "Referral program",
    desc: "Share your link and earn a bonus when a referred investor's deposit is confirmed.",
    link: "Your referral link",
    copy: "Copy",
    copied: "Copied",
    referred: "Investors referred",
    totalBonus: "Total bonus",
    pendingBonus: "To be paid",
    historyTitle: "Bonus history",
    empty: "No referral bonuses yet.",
    colDate: "Date",
    colReferral: "Referral",
    colBonus: "Bonus",
    colStatus: "Status",
    statusPending: "Pending",
    statusPaid: "Paid"
  },
  ru: {
    title: "Реферальная программа",
    desc: "Делитесь ссылкой и получайте бонус, когда депозит приведённого инвестора подтверждён.",
    link: "Ваша реферальная ссылка",
    copy: "Копировать",
    copied: "Скопировано",
    referred: "Приведено инвесторов",
    totalBonus: "Всего бонусов",
    pendingBonus: "К выплате",
    historyTitle: "История бонусов",
    empty: "Пока нет реферальных бонусов.",
    colDate: "Дата",
    colReferral: "Реферал",
    colBonus: "Бонус",
    colStatus: "Статус",
    statusPending: "Ожидает",
    statusPaid: "Выплачено"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const cardClass = "rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.72] p-6";
const insetClass = "rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4";
const labelClass = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

export function InvestorReferralSection({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const fmt = React.useMemo(() => createAdminFormatters(locale), [locale]);
  const [data, setData] = React.useState<InvestorReferralData | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/investor/referrals", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { ok: boolean; data?: InvestorReferralData }) => {
        if (active && payload.ok && payload.data) setData(payload.data);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      active = false;
    };
  }, []);

  const referralLink = React.useMemo(() => {
    if (!data?.referralCode) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${locale}?ref=${data.referralCode}`;
  }, [data?.referralCode, locale]);

  async function copyLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can fail in insecure contexts; ignore */
    }
  }

  if (!data) return null;

  return (
    <section className={cardClass}>
      <div className="mb-5">
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.desc}</p>
      </div>

      <div className={insetClass}>
        <p className={labelClass}>{t.link}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all font-mono text-sm text-foreground">{referralLink}</code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-gold-200/40 bg-gold-300/20 dark:bg-gold-200/10 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30"
          >
            <Copy className="size-4" />
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className={insetClass}>
          <p className={labelClass}>{t.referred}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{fmt.number(data.referredCount)}</p>
        </div>
        <div className={insetClass}>
          <p className={labelClass}>{t.totalBonus}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{fmt.currency(data.totalBonus)}</p>
        </div>
        <div className={insetClass}>
          <p className={labelClass}>{t.pendingBonus}</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-amber-700 dark:text-gold-100">{fmt.currency(data.pendingBonus)}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-foreground">{t.historyTitle}</p>
        {data.history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="pb-3 pr-4">{t.colDate}</th>
                  <th className="pb-3 pr-4">{t.colReferral}</th>
                  <th className="pb-3 pr-4">{t.colBonus}</th>
                  <th className="pb-3">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((row) => (
                  <tr key={row.id} className="border-t border-border dark:border-white/10">
                    <td className="py-3 pr-4 text-muted-foreground">{fmt.date(new Date(row.createdAt))}</td>
                    <td className="py-3 pr-4 text-foreground">{row.referredInvestorMasked}</td>
                    <td className="py-3 pr-4 font-semibold text-foreground">{fmt.currency(row.commissionAmount)}</td>
                    <td className="py-3 text-muted-foreground">{row.status === "PAID" ? t.statusPaid : t.statusPending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
