"use client";

import * as React from "react";
import { FileCheck2, Plus, ShieldCheck } from "lucide-react";
import { locales, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const JURISDICTIONS = ["EU", "US", "RU", "CN"] as const;

type Template = {
  id: string; jurisdiction: string; locale: string; regionalScope: string; version: number;
  title: string; status: string; approvedBy: string | null; approvedAt: string | null; createdAt: string;
};

const COPY = {
  en: { eyebrow: "Legal operations", title: "Jurisdictions and documents", description: "Create versioned drafts, attach official sources, and approve only reviewed legal copy.", newTemplate: "New agreement template", jurisdiction: "Jurisdiction", language: "Document language", region: "State / region", agreementTitle: "Document title", terms: "Terms, one paragraph per line", sources: "Official sources, one HTTPS URL per line", create: "Create draft", creating: "Creating...", templates: "Template history", approve: "Approve", archive: "Archive", empty: "No templates yet.", saved: "Draft created.", updated: "Template status updated.", confirm: "Approve this exact version for investor delivery?", labels: ["Agreement heading", "Date label", "Investor label", "Allocation label", "Terms heading", "Signature label", "Signature notice"] },
  ru: { eyebrow: "Юридические операции", title: "Юрисдикции и документы", description: "Создавайте версии, прикладывайте официальные источники и утверждайте только проверенный текст.", newTemplate: "Новый шаблон соглашения", jurisdiction: "Юрисдикция", language: "Язык документа", region: "Штат / регион", agreementTitle: "Название документа", terms: "Условия, один абзац на строку", sources: "Официальные источники, одна HTTPS-ссылка на строку", create: "Создать черновик", creating: "Создаём...", templates: "История шаблонов", approve: "Утвердить", archive: "Архивировать", empty: "Шаблонов пока нет.", saved: "Черновик создан.", updated: "Статус шаблона обновлён.", confirm: "Утвердить именно эту версию для выдачи инвесторам?", labels: ["Заголовок соглашения", "Подпись даты", "Подпись инвестора", "Подпись суммы", "Заголовок условий", "Подпись подписи", "Примечание об электронной подписи"] },
  de: { eyebrow: "Rechtliche Abläufe", title: "Rechtsräume und Dokumente", description: "Versionierte Entwürfe mit amtlichen Quellen erstellen und nur geprüfte Texte freigeben.", newTemplate: "Neue Vertragsvorlage", jurisdiction: "Rechtsraum", language: "Dokumentsprache", region: "Bundesstaat / Region", agreementTitle: "Dokumenttitel", terms: "Bedingungen, ein Absatz pro Zeile", sources: "Amtliche Quellen, eine HTTPS-URL pro Zeile", create: "Entwurf erstellen", creating: "Wird erstellt...", templates: "Vorlagenverlauf", approve: "Freigeben", archive: "Archivieren", empty: "Noch keine Vorlagen.", saved: "Entwurf erstellt.", updated: "Vorlagenstatus aktualisiert.", confirm: "Diese Version zur Ausgabe an Investoren freigeben?", labels: ["Vertragsüberschrift", "Datumsbezeichnung", "Investorenbezeichnung", "Betragsbezeichnung", "Überschrift Bedingungen", "Unterschriftsbezeichnung", "Hinweis zur elektronischen Signatur"] },
  es: { eyebrow: "Operaciones legales", title: "Jurisdicciones y documentos", description: "Cree borradores versionados con fuentes oficiales y apruebe solo textos revisados.", newTemplate: "Nueva plantilla de acuerdo", jurisdiction: "Jurisdicción", language: "Idioma del documento", region: "Estado / región", agreementTitle: "Título del documento", terms: "Condiciones, un párrafo por línea", sources: "Fuentes oficiales, una URL HTTPS por línea", create: "Crear borrador", creating: "Creando...", templates: "Historial de plantillas", approve: "Aprobar", archive: "Archivar", empty: "Todavía no hay plantillas.", saved: "Borrador creado.", updated: "Estado actualizado.", confirm: "¿Aprobar esta versión exacta para los inversores?", labels: ["Encabezado", "Etiqueta de fecha", "Etiqueta de inversor", "Etiqueta de importe", "Encabezado de condiciones", "Etiqueta de firma", "Aviso de firma electrónica"] },
  zh: { eyebrow: "法律运营", title: "司法辖区与文件", description: "创建带官方来源的版本化草稿，并仅批准已审核的文本。", newTemplate: "新协议模板", jurisdiction: "司法辖区", language: "文件语言", region: "州 / 地区", agreementTitle: "文件标题", terms: "条款，每行一段", sources: "官方来源，每行一个 HTTPS 链接", create: "创建草稿", creating: "正在创建…", templates: "模板历史", approve: "批准", archive: "归档", empty: "暂无模板。", saved: "草稿已创建。", updated: "模板状态已更新。", confirm: "确认批准此版本供投资者使用？", labels: ["协议标题", "日期标签", "投资者标签", "金额标签", "条款标题", "签名标签", "电子签名说明"] }
} as const;

function cookie(name: string) {
  return document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

export function AdminLegalPage({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.en;
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [jurisdiction, setJurisdiction] = React.useState<(typeof JURISDICTIONS)[number]>("EU");
  const [documentLocale, setDocumentLocale] = React.useState<Locale>(locale);
  const [regionalScope, setRegionalScope] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [labels, setLabels] = React.useState<string[]>(["", "", "", "", "", "", ""]);
  const [terms, setTerms] = React.useState("");
  const [sources, setSources] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const response = await fetch("/api/admin/legal-templates", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.ok) setTemplates(payload.data);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  function updateLabel(index: number, value: string) {
    setLabels((current) => current.map((item, position) => position === index ? value : item));
  }

  async function createDraft(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice(null);
    try {
      const bodyJson = JSON.stringify({ heading: labels[0], dateLabel: labels[1], investorLabel: labels[2], allocationLabel: labels[3], termsHeading: labels[4], terms: terms.split("\n").map((item) => item.trim()).filter(Boolean), signatureLabel: labels[5], signatureNotice: labels[6] });
      const response = await fetch("/api/admin/legal-templates", { method: "POST", headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: cookie(ADMIN_CSRF_COOKIE) }, body: JSON.stringify({ jurisdiction, locale: documentLocale, regionalScope, title, bodyJson, sourceReferences: sources.split("\n").map((item) => item.trim()).filter(Boolean) }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to create template.");
      setNotice(t.saved); setTitle(""); setTerms(""); setSources(""); setLabels(["", "", "", "", "", "", ""]); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Error"); } finally { setBusy(false); }
  }

  async function changeStatus(id: string, action: "approve" | "archive") {
    if (action === "approve" && !window.confirm(t.confirm)) return;
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/legal-templates", { method: "PATCH", headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: cookie(ADMIN_CSRF_COOKIE) }, body: JSON.stringify({ id, action }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to update template.");
      setNotice(t.updated); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Error"); } finally { setBusy(false); }
  }

  const inputClass = "h-11 rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground outline-none dark:border-white/10 dark:bg-black/20";
  return <main className="container py-10">
    <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p><h1 className="mt-2 text-3xl font-semibold text-foreground">{t.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.description}</p></header>
    {notice ? <p className="mb-5 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground dark:border-white/10">{notice}</p> : null}
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4" />{t.newTemplate}</CardTitle></CardHeader><CardContent><form className="grid gap-4" onSubmit={createDraft}>
        <div className="grid gap-3 sm:grid-cols-3"><select className={inputClass} value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as typeof jurisdiction)} aria-label={t.jurisdiction}>{JURISDICTIONS.map((item) => <option key={item}>{item}</option>)}</select><select className={inputClass} value={documentLocale} onChange={(event) => setDocumentLocale(event.target.value as Locale)} aria-label={t.language}>{locales.map((item) => <option key={item}>{item.toUpperCase()}</option>)}</select><input className={inputClass} value={regionalScope} onChange={(event) => setRegionalScope(event.target.value)} placeholder={t.region} /></div>
        <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.agreementTitle} required />
        <div className="grid gap-3 sm:grid-cols-2">{t.labels.map((label, index) => <input key={label} className={inputClass} value={labels[index]} onChange={(event) => updateLabel(index, event.target.value)} placeholder={label} required />)}</div>
        <textarea className={`${inputClass} min-h-40 py-3`} value={terms} onChange={(event) => setTerms(event.target.value)} placeholder={t.terms} required />
        <textarea className={`${inputClass} min-h-24 py-3`} value={sources} onChange={(event) => setSources(event.target.value)} placeholder={t.sources} required />
        <Button disabled={busy} type="submit"><FileCheck2 data-icon="inline-start" />{busy ? t.creating : t.create}</Button>
      </form></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" />{t.templates}</CardTitle><CardDescription>{templates.length} total</CardDescription></CardHeader><CardContent className="grid gap-3">{templates.length === 0 ? <p className="text-sm text-muted-foreground">{t.empty}</p> : templates.map((template) => <div key={template.id} className="rounded-2xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-black/20"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{template.title}</p><p className="mt-1 text-xs text-muted-foreground">{template.jurisdiction}{template.regionalScope ? ` / ${template.regionalScope}` : ""} · {template.locale.toUpperCase()} · v{template.version}</p></div><Badge>{template.status}</Badge></div><div className="mt-4 flex gap-2">{template.status === "DRAFT" ? <Button size="sm" disabled={busy} onClick={() => void changeStatus(template.id, "approve")}>{t.approve}</Button> : null}{template.status !== "ARCHIVED" ? <Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(template.id, "archive")}>{t.archive}</Button> : null}</div></div>)}</CardContent></Card>
    </div>
  </main>;
}
