"use client";

import * as React from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { InvestorReferralData } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";

const STRINGS = {
  en: {
    title: "Referral program",
    desc: "Share your link and earn a bonus when a referred investor's deposit is confirmed.",
    link: "Your referral link",
    copy: "Copy",
    copied: "Copied",
    qrTitle: "Share your link",
    qrDesc: "Show this QR code or send the link directly.",
    share: "Share",
    download: "Download QR",
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
    qrTitle: "Поделиться ссылкой",
    qrDesc: "Покажите QR-код или отправьте ссылку напрямую.",
    share: "Отправить",
    download: "Скачать QR",
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
  },
  es: {
    title: "Programa de referidos",
    desc: "Comparta su enlace y gane una bonificación cuando se confirme el depósito de un inversor referido.",
    link: "Su enlace de referido",
    copy: "Copiar",
    copied: "Copiado",
    qrTitle: "Comparta su enlace",
    qrDesc: "Muestre este código QR o envíe el enlace directamente.",
    share: "Compartir",
    download: "Descargar QR",
    referred: "Inversores referidos",
    totalBonus: "Bonificación total",
    pendingBonus: "Por pagar",
    historyTitle: "Historial de bonificaciones",
    empty: "Aún no hay bonificaciones por referidos.",
    colDate: "Fecha",
    colReferral: "Referido",
    colBonus: "Bonificación",
    colStatus: "Estado",
    statusPending: "Pendiente",
    statusPaid: "Pagada"
  },
  de: {
    title: "Empfehlungsprogramm",
    desc: "Teilen Sie Ihren Link und erhalten Sie einen Bonus, sobald die Einzahlung eines geworbenen Investors bestätigt wird.",
    link: "Ihr Empfehlungslink",
    copy: "Kopieren",
    copied: "Kopiert",
    qrTitle: "Link teilen",
    qrDesc: "Zeigen Sie diesen QR-Code oder senden Sie den Link direkt.",
    share: "Teilen",
    download: "QR herunterladen",
    referred: "Geworbene Investoren",
    totalBonus: "Bonus gesamt",
    pendingBonus: "Noch auszuzahlen",
    historyTitle: "Bonusverlauf",
    empty: "Noch keine Empfehlungsboni.",
    colDate: "Datum",
    colReferral: "Empfehlung",
    colBonus: "Bonus",
    colStatus: "Status",
    statusPending: "Ausstehend",
    statusPaid: "Ausgezahlt"
  },
  zh: {
    title: "推荐计划",
    desc: "分享您的链接，当受推荐投资者的充值获得确认时即可赚取奖励。",
    link: "您的推荐链接",
    copy: "复制",
    copied: "已复制",
    qrTitle: "分享您的链接",
    qrDesc: "出示此二维码或直接发送链接。",
    share: "分享",
    download: "下载二维码",
    referred: "已推荐投资者",
    totalBonus: "奖励总额",
    pendingBonus: "待支付",
    historyTitle: "奖励历史",
    empty: "尚无推荐奖励。",
    colDate: "日期",
    colReferral: "推荐",
    colBonus: "奖励",
    colStatus: "状态",
    statusPending: "待处理",
    statusPaid: "已支付"
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
  const [data, setData] = React.useState<(InvestorReferralData & { shareEnabled?: boolean }) | null>(null);
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/investor/referrals", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { ok: boolean; data?: InvestorReferralData & { shareEnabled?: boolean } }) => {
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

  async function shareLink() {
    if (!referralLink) return;
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title: t.title, text: t.desc, url: referralLink });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg || !data?.referralCode) return;

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `otiz-referral-${data.referralCode}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
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

      {data.shareEnabled ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div ref={qrRef} className="w-fit rounded-2xl border border-border bg-white p-3 dark:border-white/10">
            <QRCodeSVG value={referralLink} size={148} bgColor="#ffffff" fgColor="#15130f" level="M" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t.qrTitle}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.qrDesc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={shareLink}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
              >
                <Share2 className="size-4" />
                {t.share}
              </button>
              <button
                type="button"
                onClick={downloadQr}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 dark:border-white/15"
              >
                <Download className="size-4" />
                {t.download}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
