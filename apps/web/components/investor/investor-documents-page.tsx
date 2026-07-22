"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, FileArchive, FileText, Loader2, PenLine, Wallet } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { createAdminFormatters } from "@otiz/lib";
import type { SerializedInvestorDocument } from "@otiz/database";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    title: "Documents",
    desc: "Review and sign documents prepared by your manager.",
    empty: "No documents yet. Your onboarding agreement will appear here after approval.",
    statusPending: "Awaiting signature",
    statusSigned: "Signed",
    created: "Created",
    signedOn: "Signed",
    viewAndSign: "View & sign",
    download: "Download",
    downloadAll: "Download all documents",
    generating: "Preparing ZIP...",
    noDocuments: "No documents to download.",
    reviewTitle: "Review and sign",
    openDocument: "Open document (PDF)",
    ack: "I have read the document and accept the terms",
    sign: "Sign",
    signing: "Signing...",
    cancel: "Cancel",
    errorFallback: "Could not sign the document. Please try again.",
    typeAgreement: "Investment agreement",
    signedTitle: "Document signed",
    signedBody: "Thank you — your agreement is signed and stored in your documents.",
    nextStepTitle: "Next step: send your deposit",
    nextStepBody: "Fund your account at one of the deposit addresses, then confirm the transfer so your manager can verify it.",
    nextStepCta: "Go to deposit"
  },
  ru: {
    title: "Документы",
    desc: "Ознакомьтесь и подпишите документы, подготовленные менеджером.",
    empty: "Пока нет документов. Инвестиционное соглашение появится здесь после одобрения.",
    statusPending: "Ожидает подписания",
    statusSigned: "Подписано",
    created: "Создано",
    signedOn: "Подписано",
    viewAndSign: "Просмотреть и подписать",
    download: "Скачать",
    downloadAll: "Скачать все документы",
    generating: "Готовим ZIP...",
    noDocuments: "Нет документов для скачивания.",
    reviewTitle: "Просмотр и подписание",
    openDocument: "Открыть документ (PDF)",
    ack: "Я ознакомился с документом и принимаю условия",
    sign: "Подписать",
    signing: "Подписываем...",
    cancel: "Отмена",
    errorFallback: "Не удалось подписать документ. Попробуйте ещё раз.",
    typeAgreement: "Инвестиционное соглашение",
    signedTitle: "Документ подписан",
    signedBody: "Спасибо — соглашение подписано и сохранено в ваших документах.",
    nextStepTitle: "Следующий шаг: отправьте депозит",
    nextStepBody: "Пополните аккаунт на один из адресов для депозита, затем подтвердите отправку, чтобы менеджер проверил поступление.",
    nextStepCta: "Перейти к пополнению"
  },
  es: {
    title: "Documentos",
    desc: "Revise y firme los documentos preparados por su gestor.",
    empty: "Aún no hay documentos. Su acuerdo de incorporación aparecerá aquí tras la aprobación.",
    statusPending: "A la espera de firma",
    statusSigned: "Firmado",
    created: "Creado",
    signedOn: "Firmado",
    viewAndSign: "Ver y firmar",
    download: "Descargar",
    downloadAll: "Descargar todos los documentos",
    generating: "Preparando ZIP...",
    noDocuments: "No hay documentos para descargar.",
    reviewTitle: "Revisar y firmar",
    openDocument: "Abrir documento (PDF)",
    ack: "He leído el documento y acepto las condiciones",
    sign: "Firmar",
    signing: "Firmando...",
    cancel: "Cancelar",
    errorFallback: "No se pudo firmar el documento. Inténtelo de nuevo.",
    typeAgreement: "Acuerdo de inversión",
    signedTitle: "Documento firmado",
    signedBody: "Gracias — su acuerdo está firmado y almacenado en sus documentos.",
    nextStepTitle: "Siguiente paso: envíe su depósito",
    nextStepBody: "Financie su cuenta en una de las direcciones de depósito y, a continuación, confirme la transferencia para que su gestor pueda verificarla.",
    nextStepCta: "Ir al depósito"
  },
  de: {
    title: "Dokumente",
    desc: "Prüfen und unterzeichnen Sie die von Ihrem Manager vorbereiteten Dokumente.",
    empty: "Noch keine Dokumente. Ihre Onboarding-Vereinbarung erscheint hier nach der Genehmigung.",
    statusPending: "Unterschrift ausstehend",
    statusSigned: "Unterzeichnet",
    created: "Erstellt",
    signedOn: "Unterzeichnet",
    viewAndSign: "Ansehen und unterzeichnen",
    download: "Herunterladen",
    downloadAll: "Alle Dokumente herunterladen",
    generating: "ZIP wird vorbereitet...",
    noDocuments: "Keine Dokumente zum Herunterladen.",
    reviewTitle: "Prüfen und unterzeichnen",
    openDocument: "Dokument öffnen (PDF)",
    ack: "Ich habe das Dokument gelesen und akzeptiere die Bedingungen",
    sign: "Unterzeichnen",
    signing: "Wird unterzeichnet...",
    cancel: "Abbrechen",
    errorFallback: "Das Dokument konnte nicht unterzeichnet werden. Bitte versuchen Sie es erneut.",
    typeAgreement: "Investitionsvereinbarung",
    signedTitle: "Dokument unterzeichnet",
    signedBody: "Vielen Dank — Ihre Vereinbarung ist unterzeichnet und in Ihren Dokumenten gespeichert.",
    nextStepTitle: "Nächster Schritt: Senden Sie Ihre Einzahlung",
    nextStepBody: "Zahlen Sie auf eine der Einzahlungsadressen ein und bestätigen Sie anschließend die Überweisung, damit Ihr Manager sie verifizieren kann.",
    nextStepCta: "Zur Einzahlung"
  },
  zh: {
    title: "文件",
    desc: "查阅并签署由您的经理准备的文件。",
    empty: "暂无文件。您的开户协议将在获批后显示在此处。",
    statusPending: "等待签名",
    statusSigned: "已签署",
    created: "创建于",
    signedOn: "签署于",
    viewAndSign: "查看并签署",
    download: "下载",
    downloadAll: "下载全部文件",
    generating: "正在生成 ZIP...",
    noDocuments: "没有可下载的文件。",
    reviewTitle: "查看并签署",
    openDocument: "打开文件（PDF）",
    ack: "我已阅读该文件并接受相关条款",
    sign: "签署",
    signing: "正在签署...",
    cancel: "取消",
    errorFallback: "无法签署该文件。请重试。",
    typeAgreement: "投资协议",
    signedTitle: "文件已签署",
    signedBody: "感谢您 — 您的协议已签署并保存在您的文件中。",
    nextStepTitle: "下一步：发送您的存款",
    nextStepBody: "请通过其中一个存款地址为您的账户充值，然后确认转账，以便您的经理进行核实。",
    nextStepCta: "前往存款"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;
const SUPPORT_LABELS: Record<Locale, string> = {
  en: "Ask support",
  ru: "Задать вопрос поддержке",
  es: "Preguntar a soporte",
  de: "Support fragen",
  zh: "联系支持"
};

const PENDING = "PENDING_SIGNATURE";
const SIGNED = "SIGNED";

export function InvestorDocumentsPage({ locale, documents: initial }: { locale: Locale; documents: SerializedInvestorDocument[] }) {
  const t = getStrings(locale);
  const fmt = createAdminFormatters(locale);
  const [documents, setDocuments] = React.useState(initial);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [accepted, setAccepted] = React.useState(false);
  const [signingId, setSigningId] = React.useState<string | null>(null);
  const [justSigned, setJustSigned] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  async function downloadAll() {
    setDownloadingAll(true);
    setDownloadError(null);
    try {
      const response = await fetch("/api/investor/documents/download-all");
      if (!response.ok) {
        setDownloadError(t.noDocuments);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "otiz-documents.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(t.noDocuments);
    } finally {
      setDownloadingAll(false);
    }
  }

  const downloadAllControl = (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button size="sm" variant="outline" onClick={downloadAll} disabled={downloadingAll} className="gap-2">
        {downloadingAll ? <Loader2 className="size-4 animate-spin" /> : <FileArchive className="size-4" />}
        {downloadingAll ? t.generating : t.downloadAll}
      </Button>
      {downloadError ? <p className="text-sm text-red-600 dark:text-red-400">{downloadError}</p> : null}
    </div>
  );

  function typeLabel(type: string) {
    return type === "AGREEMENT" ? t.typeAgreement : type;
  }

  function openSigning(id: string) {
    setOpenId(id);
    setAccepted(false);
    setError(null);
  }

  async function sign(id: string) {
    setSigningId(id);
    setError(null);
    try {
      const response = await fetch(`/api/investor/documents/${id}/sign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept: true })
      });
      const payload = (await response.json()) as { ok: boolean; data?: SerializedInvestorDocument; error?: string };
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || t.errorFallback);
      }
      const updated = payload.data;
      setDocuments((current) => current.map((doc) => (doc.id === updated.id ? updated : doc)));
      setOpenId(null);
      setJustSigned(true); // show the success + next-step banner (F1)
    } catch (signError) {
      setError(signError instanceof Error ? signError.message : t.errorFallback);
    } finally {
      setSigningId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="grid gap-4">
        <Card className="rounded-[1.35rem] bg-muted/30 dark:bg-white/[0.035]">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto size-9 text-amber-700 dark:text-gold-100" />
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">{t.empty}</p>
            <Link href={`/${locale}/investor/support`} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground dark:border-white/10">
              {SUPPORT_LABELS[locale]}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">{downloadAllControl}</div>
      {justSigned ? (
        <Card className="overflow-hidden rounded-[1.35rem] border-gold-200/35 bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
          <CardContent className="p-6">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <CheckCircle2 className="size-5 text-amber-700 dark:text-gold-100" />
              {t.signedTitle}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t.signedBody}</p>
            <div className="mt-5 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Wallet className="size-4 text-amber-700 dark:text-gold-100" />
                {t.nextStepTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.nextStepBody}</p>
              <Link
                href={`/${locale}/investor/deposit`}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gold-200 px-5 text-sm font-semibold text-graphite-950 shadow-gold transition-all hover:bg-gold-300"
              >
                {t.nextStepCta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {documents.map((doc) => {
        const isPending = doc.status === PENDING;
        const isOpen = openId === doc.id;

        return (
          <Card key={doc.id} className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-4 text-amber-700 dark:text-gold-100" />
                    {typeLabel(doc.type)}
                  </CardTitle>
                  <CardDescription>
                    {t.created} {fmt.date(new Date(doc.createdAt))}
                    {doc.status === SIGNED && doc.signedAt ? ` · ${t.signedOn} ${fmt.date(new Date(doc.signedAt))}` : ""}
                  </CardDescription>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    isPending
                      ? "border border-gold-200/40 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100"
                      : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  }`}
                >
                  {isPending ? <PenLine className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                  {isPending ? t.statusPending : t.statusSigned}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {!isPending ? (
                <a
                  href={`/api/investor/documents/${doc.id}/download`}
                  className="inline-flex items-center gap-2 rounded-full border border-border dark:border-white/15 bg-muted/30 dark:bg-white/[0.04] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.08]"
                >
                  <Download className="size-4" />
                  {t.download}
                </a>
              ) : !isOpen ? (
                <Button size="sm" onClick={() => openSigning(doc.id)} className="gap-2">
                  <PenLine className="size-4" />
                  {t.viewAndSign}
                </Button>
              ) : (
                <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5">
                  <p className="text-sm font-semibold text-foreground">{t.reviewTitle}</p>
                  <a
                    href={`/api/investor/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-gold-100 hover:underline"
                  >
                    <Download className="size-4" />
                    {t.openDocument}
                  </a>
                  <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(event) => setAccepted(event.target.checked)}
                      className="mt-0.5 size-4 accent-gold-300"
                    />
                    <span>{t.ack}</span>
                  </label>
                  {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                  <div className="mt-4 flex gap-3">
                    <Button size="sm" disabled={!accepted || signingId === doc.id} onClick={() => sign(doc.id)}>
                      {signingId === doc.id ? t.signing : t.sign}
                    </Button>
                    <Button size="sm" variant="outline" disabled={signingId === doc.id} onClick={() => setOpenId(null)}>
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
