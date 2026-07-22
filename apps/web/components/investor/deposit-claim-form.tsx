"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const NETWORKS = ["BTC", "ETH", "USDT TRC20", "USDT ERC20", "USDT BEP20"] as const;

const STRINGS = {
  en: {
    title: "Confirm your transfer",
    desc: "Sent a deposit? Let your manager know so the incoming transfer can be verified faster.",
    open: "I sent a deposit",
    amount: "Amount (USD)",
    amountPlaceholder: "1000",
    network: "Network",
    txHash: "Transaction hash",
    txHashPlaceholder: "e.g. 0x… or a TxID",
    txHashHelper: "Provide the transaction hash for automatic verification. It speeds up deposit confirmation.",
    howToFind: "How to find the transaction hash?",
    howToFindBody: "In your wallet or exchange, open the transfer history, find this payment, and copy its “Transaction ID / TxID / Hash”. USDT TRC20 → TronScan, ERC20 / ETH → Etherscan, BEP20 → BscScan, BTC → your wallet or Blockstream.",
    note: "Note",
    notePlaceholder: "Anything the manager should know (optional)",
    submit: "Send notification",
    submitting: "Sending...",
    cancel: "Cancel",
    successTitle: "Notification sent",
    successBody: "Your manager will verify the incoming transfer and get back to you.",
    track: "Track status",
    another: "Report another transfer",
    errAmount: "Enter a valid amount.",
    errFallback: "Could not send the notification. Please try again."
  },
  ru: {
    title: "Подтвердить отправку",
    desc: "Отправили депозит? Сообщите менеджеру — так поступление проверят быстрее.",
    open: "Я отправил депозит",
    amount: "Сумма (USD)",
    amountPlaceholder: "1000",
    network: "Сеть",
    txHash: "Хэш транзакции",
    txHashPlaceholder: "например, 0x… или TxID",
    txHashHelper: "Укажите хэш транзакции для автоматической проверки. Это ускорит подтверждение депозита.",
    howToFind: "Как найти хэш транзакции?",
    howToFindBody: "В кошельке или на бирже откройте историю переводов, найдите этот платёж и скопируйте «Transaction ID / TxID / Hash». USDT TRC20 → TronScan, ERC20 / ETH → Etherscan, BEP20 → BscScan, BTC → кошелёк или Blockstream.",
    note: "Примечание",
    notePlaceholder: "Что менеджеру стоит знать (необязательно)",
    submit: "Отправить уведомление",
    submitting: "Отправляем...",
    cancel: "Отмена",
    successTitle: "Уведомление отправлено",
    successBody: "Менеджер проверит поступление и свяжется с вами.",
    track: "Следить за статусом",
    another: "Сообщить о ещё одном переводе",
    errAmount: "Введите корректную сумму.",
    errFallback: "Не удалось отправить уведомление. Попробуйте ещё раз."
  },
  es: {
    title: "Confirme su transferencia",
    desc: "¿Ha enviado un depósito? Comuníqueselo a su gestor para verificar la transferencia entrante más rápido.",
    open: "He enviado un depósito",
    amount: "Importe (USD)",
    amountPlaceholder: "1000",
    network: "Red",
    txHash: "Hash de la transacción",
    txHashPlaceholder: "p. ej. 0x… o un TxID",
    txHashHelper: "Indique el hash de la transacción para la verificación automática. Agiliza la confirmación del depósito.",
    howToFind: "¿Cómo encontrar el hash de la transacción?",
    howToFindBody: "En su monedero o exchange, abra el historial de transferencias, localice este pago y copie su «Transaction ID / TxID / Hash». USDT TRC20 → TronScan, ERC20 / ETH → Etherscan, BEP20 → BscScan, BTC → su monedero o Blockstream.",
    note: "Nota",
    notePlaceholder: "Cualquier cosa que el gestor deba saber (opcional)",
    submit: "Enviar notificación",
    submitting: "Enviando...",
    cancel: "Cancelar",
    successTitle: "Notificación enviada",
    successBody: "Su gestor verificará la transferencia entrante y se pondrá en contacto con usted.",
    track: "Seguir el estado",
    another: "Informar de otra transferencia",
    errAmount: "Introduzca un importe válido.",
    errFallback: "No se pudo enviar la notificación. Vuelva a intentarlo."
  },
  de: {
    title: "Bestätigen Sie Ihre Überweisung",
    desc: "Eine Einzahlung getätigt? Informieren Sie Ihren Manager, damit die eingehende Überweisung schneller geprüft werden kann.",
    open: "Ich habe eine Einzahlung getätigt",
    amount: "Betrag (USD)",
    amountPlaceholder: "1000",
    network: "Netzwerk",
    txHash: "Transaktions-Hash",
    txHashPlaceholder: "z. B. 0x… oder eine TxID",
    txHashHelper: "Geben Sie den Transaktions-Hash für die automatische Prüfung an. Das beschleunigt die Bestätigung der Einzahlung.",
    howToFind: "Wie finde ich den Transaktions-Hash?",
    howToFindBody: "Öffnen Sie in Ihrer Wallet oder Börse den Transaktionsverlauf, suchen Sie diese Zahlung und kopieren Sie deren „Transaction ID / TxID / Hash“. USDT TRC20 → TronScan, ERC20 / ETH → Etherscan, BEP20 → BscScan, BTC → Ihre Wallet oder Blockstream.",
    note: "Notiz",
    notePlaceholder: "Alles, was der Manager wissen sollte (optional)",
    submit: "Benachrichtigung senden",
    submitting: "Wird gesendet...",
    cancel: "Abbrechen",
    successTitle: "Benachrichtigung gesendet",
    successBody: "Ihr Manager prüft die eingehende Überweisung und meldet sich bei Ihnen.",
    track: "Status verfolgen",
    another: "Weitere Überweisung melden",
    errAmount: "Geben Sie einen gültigen Betrag ein.",
    errFallback: "Die Benachrichtigung konnte nicht gesendet werden. Bitte versuchen Sie es erneut."
  },
  zh: {
    title: "确认您的转账",
    desc: "已发送充值？请告知您的经理，以便更快核实到账的转账。",
    open: "我已发送充值",
    amount: "金额（USD）",
    amountPlaceholder: "1000",
    network: "网络",
    txHash: "交易哈希",
    txHashPlaceholder: "例如 0x… 或 TxID",
    txHashHelper: "请提供交易哈希以便自动核实。这将加快充值确认。",
    howToFind: "如何找到交易哈希？",
    howToFindBody: "在您的钱包或交易所中打开转账记录，找到这笔付款并复制其“Transaction ID / TxID / Hash”。USDT TRC20 → TronScan，ERC20 / ETH → Etherscan，BEP20 → BscScan，BTC → 您的钱包或 Blockstream。",
    note: "备注",
    notePlaceholder: "任何经理需要了解的信息（可选）",
    submit: "发送通知",
    submitting: "正在发送……",
    cancel: "取消",
    successTitle: "通知已发送",
    successBody: "您的经理将核实到账的转账并与您联系。",
    track: "查看状态",
    another: "报告另一笔转账",
    errAmount: "请输入有效的金额。",
    errFallback: "无法发送通知。请重试。"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45";
const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export function DepositClaimForm({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [network, setNetwork] = React.useState<string>(NETWORKS[2]);
  const [txHash, setTxHash] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t.errAmount);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investor/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, network, txHash: txHash.trim(), note: note.trim() })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error === "AMOUNT_INVALID" ? t.errAmount : t.errFallback);
      }
      setSubmitted(true);
      setIsOpen(false);
      setAmount("");
      setTxHash("");
      setNote("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.errFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        {submitted && !isOpen ? (
          <div className="rounded-[1.35rem] border border-gold-200/30 bg-gold-300/15 dark:bg-gold-200/10 p-5">
            <p className="flex items-center gap-2 font-semibold text-amber-700 dark:text-gold-100">
              <CheckCircle2 className="size-5" />
              {t.successTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.successBody}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${locale}/investor/history`} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">{t.track}</Link>
              <button type="button" onClick={() => { setSubmitted(false); setIsOpen(true); }} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground dark:border-white/10">{t.another}</button>
            </div>
          </div>
        ) : !isOpen ? (
          <Button type="button" onClick={() => setIsOpen(true)} className="gap-2">
            <Send className="size-4" />
            {t.open}
          </Button>
        ) : (
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t.amount}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={t.amountPlaceholder}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t.network}</span>
                <select value={network} onChange={(event) => setNetwork(event.target.value)} className={inputClass}>
                  {NETWORKS.map((option) => (
                    <option key={option} value={option} className="bg-background text-foreground">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="rounded-2xl border border-gold-200/30 bg-gold-300/10 dark:bg-gold-200/[0.06] p-4">
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t.txHash}</span>
                <input value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder={t.txHashPlaceholder} className={inputClass} />
              </label>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.txHashHelper}</p>
              <button
                type="button"
                onClick={() => setShowHelp((value) => !value)}
                aria-expanded={showHelp}
                className="mt-2 text-xs font-semibold text-amber-700 transition-colors hover:underline dark:text-gold-100"
              >
                {t.howToFind}
              </button>
              {showHelp ? (
                <p className="mt-2 rounded-xl border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground dark:border-white/10">{t.howToFindBody}</p>
              ) : null}
            </div>
            <label className="flex flex-col gap-2">
              <span className={labelClass}>{t.note}</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t.notePlaceholder}
                rows={3}
                className="w-full rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45"
              />
            </label>
            {error ? (
              <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.submitting : t.submit}</Button>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsOpen(false)}>{t.cancel}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
