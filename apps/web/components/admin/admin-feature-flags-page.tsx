"use client";

import * as React from "react";
import type { Locale } from "@otiz/lib";
import type { ProductFeatureFlag, ProductFeatureKey } from "@otiz/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

const STRINGS = {
  en: { eyebrow: "Product controls", title: "Feature switches", description: "Keep new capabilities off until they are complete and reviewed. Changes apply globally and are recorded in the audit log.", enabled: "Enabled", disabled: "Disabled", saving: "Saving...", saved: "Setting saved.", error: "Could not update this feature.", groups: ["Investor experience", "Team operations", "Support and communication", "Money and reporting", "Public content"] },
  ru: { eyebrow: "Управление продуктом", title: "Переключатели функций", description: "Новые возможности остаются выключенными, пока не готовы и не проверены. Изменения действуют для всех и записываются в журнал.", enabled: "Включено", disabled: "Выключено", saving: "Сохраняем...", saved: "Настройка сохранена.", error: "Не удалось изменить функцию.", groups: ["Кабинет инвестора", "Работа команды", "Поддержка и сообщения", "Деньги и отчёты", "Публичный сайт"] },
  de: { eyebrow: "Produktsteuerung", title: "Funktionsschalter", description: "Neue Funktionen bleiben deaktiviert, bis sie fertig und geprüft sind. Änderungen gelten global und werden protokolliert.", enabled: "Aktiv", disabled: "Inaktiv", saving: "Speichern...", saved: "Einstellung gespeichert.", error: "Funktion konnte nicht geändert werden.", groups: ["Investorenbereich", "Teamarbeit", "Support und Nachrichten", "Geld und Berichte", "Öffentliche Inhalte"] },
  es: { eyebrow: "Control del producto", title: "Interruptores de funciones", description: "Las funciones nuevas permanecen desactivadas hasta que estén terminadas y revisadas. Los cambios son globales y quedan registrados.", enabled: "Activada", disabled: "Desactivada", saving: "Guardando...", saved: "Configuración guardada.", error: "No se pudo cambiar la función.", groups: ["Área del inversor", "Trabajo del equipo", "Soporte y mensajes", "Dinero e informes", "Contenido público"] },
  zh: { eyebrow: "产品控制", title: "功能开关", description: "新功能在完成并审核前保持关闭。更改全局生效并记录在审计日志中。", enabled: "已开启", disabled: "已关闭", saving: "保存中...", saved: "设置已保存。", error: "无法更新此功能。", groups: ["投资者体验", "团队运营", "支持与沟通", "资金与报告", "公开内容"] }
} as const;

const FEATURES: Array<{ key: ProductFeatureKey; group: number; labels: Record<Locale, string> }> = [
  { key: "onboarding-status", group: 0, labels: { en: "Onboarding status", ru: "Статус онбординга", de: "Onboarding-Status", es: "Estado de incorporación", zh: "入驻状态" } },
  { key: "notification-center", group: 0, labels: { en: "Notification center", ru: "Центр уведомлений", de: "Benachrichtigungen", es: "Centro de notificaciones", zh: "通知中心" } },
  { key: "investor-live-refresh", group: 0, labels: { en: "Live investor updates", ru: "Автообновление кабинета", de: "Live-Aktualisierung", es: "Actualización automática", zh: "投资者页面自动更新" } },
  { key: "investor-deposit-tracker", group: 0, labels: { en: "Deposit review and tracking", ru: "Проверка и статусы пополнений", de: "Einzahlungsprüfung und Status", es: "Revisión y seguimiento de depósitos", zh: "入金确认与跟踪" } },
  { key: "display-currency", group: 0, labels: { en: "Display currency", ru: "Валюта отображения", de: "Anzeigewährung", es: "Moneda de visualización", zh: "显示货币" } },
  { key: "referral-share", group: 0, labels: { en: "Referral QR and sharing", ru: "Реферальный QR и отправка", de: "Empfehlungs-QR und Teilen", es: "QR y compartir referidos", zh: "推荐二维码与分享" } },
  { key: "reinvest-preference", group: 0, labels: { en: "Reinvestment preference", ru: "Настройка реинвестирования", de: "Reinvestitionspräferenz", es: "Preferencia de reinversión", zh: "再投资偏好" } },
  { key: "manager-assignment", group: 1, labels: { en: "Manager assignment", ru: "Назначение менеджера", de: "Manager-Zuweisung", es: "Asignación de gestor", zh: "经理分配" } },
  { key: "investor-segments", group: 1, labels: { en: "Tags and segments", ru: "Теги и сегменты", de: "Tags und Segmente", es: "Etiquetas y segmentos", zh: "标签与分组" } },
  { key: "tasks", group: 1, labels: { en: "Tasks and reminders", ru: "Задачи и напоминания", de: "Aufgaben und Erinnerungen", es: "Tareas y recordatorios", zh: "任务与提醒" } },
  { key: "manager-workload", group: 1, labels: { en: "Manager workload", ru: "Нагрузка менеджеров", de: "Manager-Auslastung", es: "Carga de gestores", zh: "经理工作量" } },
  { key: "bulk-actions", group: 1, labels: { en: "Bulk actions", ru: "Массовые действия", de: "Sammelaktionen", es: "Acciones masivas", zh: "批量操作" } },
  { key: "audit-log", group: 1, labels: { en: "Global audit log", ru: "Общий журнал действий", de: "Globales Audit-Protokoll", es: "Registro global de auditoría", zh: "全局审计日志" } },
  { key: "support-requests", group: 2, labels: { en: "Investor support requests", ru: "Обращения инвесторов", de: "Investorenanfragen", es: "Solicitudes de inversores", zh: "投资者支持请求" } },
  { key: "support-queue", group: 2, labels: { en: "Support queue", ru: "Очередь поддержки", de: "Support-Warteschlange", es: "Cola de soporte", zh: "支持队列" } },
  { key: "document-requests", group: 2, labels: { en: "Document requests", ru: "Запросы документов", de: "Dokumentenanfragen", es: "Solicitudes de documentos", zh: "文件请求" } },
  { key: "investor-document-upload", group: 2, labels: { en: "Investor document upload", ru: "Загрузка документов инвестором", de: "Dokumentenupload durch Investoren", es: "Carga de documentos del inversor", zh: "投资者文件上传" } },
  { key: "message-templates", group: 2, labels: { en: "Message templates", ru: "Шаблоны сообщений", de: "Nachrichtenvorlagen", es: "Plantillas de mensajes", zh: "消息模板" } },
  { key: "investor-updates", group: 2, labels: { en: "Targeted investor updates", ru: "Адресные обновления", de: "Gezielte Investoren-Updates", es: "Actualizaciones dirigidas", zh: "定向投资者更新" } },
  { key: "operations-calendar", group: 2, labels: { en: "Operations calendar", ru: "Операционный календарь", de: "Betriebskalender", es: "Calendario operativo", zh: "运营日历" } },
  { key: "money-movement", group: 3, labels: { en: "Money movement", ru: "Движение денег", de: "Geldbewegungen", es: "Movimiento de dinero", zh: "资金流动" } },
  { key: "profit-attribution", group: 3, labels: { en: "Profit source", ru: "Источник прибыли", de: "Gewinnquelle", es: "Origen del beneficio", zh: "利润来源" } },
  { key: "account-statements", group: 3, labels: { en: "Account statements", ru: "Выписки по счёту", de: "Kontoauszüge", es: "Extractos de cuenta", zh: "账户对账单" } },
  { key: "performance-charts", group: 3, labels: { en: "Capital and profit charts", ru: "Графики капитала и прибыли", de: "Kapital- und Gewinndiagramme", es: "Gráficos de capital y beneficio", zh: "资本与利润图表" } },
  { key: "deal-comparison", group: 3, labels: { en: "Deal comparison", ru: "Сравнение сделок", de: "Geschäftsvergleich", es: "Comparación de operaciones", zh: "交易对比" } },
  { key: "content-studio-v2", group: 4, labels: { en: "Content Studio for all pages", ru: "Content Studio для всех страниц", de: "Content Studio für alle Seiten", es: "Content Studio para todas las páginas", zh: "全站内容工作室" } }
];

function getCsrf() {
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${ADMIN_CSRF_COOKIE}=`))?.split("=").slice(1).join("=") || "";
}

export function AdminFeatureFlagsPage({ locale, initialFlags }: { locale: Locale; initialFlags: ProductFeatureFlag[] }) {
  const t = STRINGS[locale];
  const [flags, setFlags] = React.useState(initialFlags);
  const [pending, setPending] = React.useState<ProductFeatureKey | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function toggle(key: ProductFeatureKey, enabled: boolean) {
    setPending(key);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCsrf() },
        body: JSON.stringify({ key, enabled })
      });
      const payload = (await response.json()) as { ok: boolean; data?: ProductFeatureFlag[]; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.error);
      setFlags(payload.data);
      setNotice(t.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.error);
    } finally {
      setPending(null);
    }
  }

  const state = Object.fromEntries(flags.map((flag) => [flag.key, flag.enabled])) as Record<ProductFeatureKey, boolean>;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background py-8 text-foreground micro-noise sm:py-10">
      <div className="container relative z-10 grid gap-6">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t.description}</p>
        </header>
        {notice ? <p className="rounded-2xl border border-gold-200/25 bg-gold-300/15 p-4 text-sm text-amber-700 dark:text-gold-100">{notice}</p> : null}
        {error ? <p className="rounded-2xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">{error}</p> : null}
        <div className="grid gap-5 xl:grid-cols-2">
          {t.groups.map((group, groupIndex) => (
            <Card key={group} className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
              <CardHeader><CardTitle>{group}</CardTitle><CardDescription>{FEATURES.filter((feature) => feature.group === groupIndex).length} / {FEATURES.length}</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {FEATURES.filter((feature) => feature.group === groupIndex).map((feature) => {
                  const enabled = state[feature.key] ?? false;
                  const isSaving = pending === feature.key;
                  return (
                    <div key={feature.key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                      <div className="min-w-0"><p className="font-medium">{feature.labels[locale]}</p><p className="mt-1 truncate font-mono text-[0.65rem] text-muted-foreground">{feature.key}</p></div>
                      <button type="button" role="switch" aria-checked={enabled} disabled={pending !== null} onClick={() => toggle(feature.key, !enabled)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-emerald-600" : "bg-muted"}`}>
                        <span className={`absolute top-1 size-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-1" : "-translate-x-6"}`} />
                        <span className="sr-only">{isSaving ? t.saving : enabled ? t.enabled : t.disabled}</span>
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
