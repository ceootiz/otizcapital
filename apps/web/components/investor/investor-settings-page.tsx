"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createAdminFormatters, locales, localeNames, localeShortNames, type Locale } from "@otiz/lib";
import { InvestorReferralSection } from "./investor-referral-section";

// ---------------------------------------------------------------------------
// Localized strings (EN + RU) — identical keys
// ---------------------------------------------------------------------------

const STRINGS = {
  en: {
    security: {
      setTitle: "Set your password",
      setDesc: "Create a password to secure direct access to your investor cabinet.",
      changeTitle: "Change password",
      changeDesc: "Update the password used to sign in to your investor cabinet.",
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
      save: "Save",
      saving: "Saving...",
      success: "Your password has been updated.",
      errTooShort: "Password must be at least 8 characters.",
      errMismatch: "Passwords do not match.",
      errWrongCurrent: "Current password is incorrect.",
      errGeneric: "We could not update your password. Please try again."
    },
    preferences: {
      title: "Language",
      desc: "Choose the language used across your investor cabinet.",
      current: "Current language",
      themeNote: "Theme can be changed using the toggle in the header."
    },
    notifications: {
      title: "Email notifications",
      desc: "Control whether OTIZ sends operational updates to your email.",
      label: "Receive email notifications",
      saved: "Saved",
      error: "Could not save your preference. Please try again."
    },
    sessions: {
      title: "Session history",
      desc: "Recent sign-ins to your investor cabinet, with device and network details.",
      loading: "Loading session history...",
      empty: "No recorded sessions yet.",
      thisDevice: "This device",
      active: "Active",
      expired: "Expired",
      unknownDevice: "Unknown device",
      ipLabel: "IP"
    },
    terminate: {
      title: "Active devices",
      desc: "End every other signed-in session. You will remain signed in on this device.",
      button: "Log out of all other devices",
      confirm: "This will sign you out of all other devices. Continue?",
      working: "Signing out other devices..."
    },
    data: {
      title: "Account history",
      desc: "Download a PDF summary of your allocations, withdrawals, and published reports.",
      button: "Download account history (PDF)"
    }
  },
  ru: {
    security: {
      setTitle: "Установите пароль",
      setDesc: "Создайте пароль для защиты прямого доступа в кабинет инвестора.",
      changeTitle: "Смена пароля",
      changeDesc: "Обновите пароль, используемый для входа в кабинет инвестора.",
      current: "Текущий пароль",
      new: "Новый пароль",
      confirm: "Подтвердите новый пароль",
      save: "Сохранить",
      saving: "Сохранение...",
      success: "Ваш пароль обновлён.",
      errTooShort: "Пароль должен содержать не менее 8 символов.",
      errMismatch: "Пароли не совпадают.",
      errWrongCurrent: "Текущий пароль неверен.",
      errGeneric: "Не удалось обновить пароль. Попробуйте ещё раз."
    },
    preferences: {
      title: "Язык",
      desc: "Выберите язык интерфейса кабинета инвестора.",
      current: "Текущий язык",
      themeNote: "Тему можно изменить переключателем в шапке."
    },
    notifications: {
      title: "Уведомления на email",
      desc: "Управляйте отправкой операционных обновлений OTIZ на вашу почту.",
      label: "Получать уведомления на email",
      saved: "Сохранено",
      error: "Не удалось сохранить настройку. Попробуйте ещё раз."
    },
    sessions: {
      title: "История сессий",
      desc: "Недавние входы в кабинет инвестора с деталями устройства и сети.",
      loading: "Загрузка истории сессий...",
      empty: "Записей о сессиях пока нет.",
      thisDevice: "Это устройство",
      active: "Активна",
      expired: "Завершена",
      unknownDevice: "Неизвестное устройство",
      ipLabel: "IP"
    },
    terminate: {
      title: "Активные устройства",
      desc: "Завершите все остальные активные сессии. На этом устройстве вы останетесь в системе.",
      button: "Завершить все сессии на других устройствах",
      confirm: "Вы выйдете из системы на всех других устройствах. Продолжить?",
      working: "Завершение других сессий..."
    },
    data: {
      title: "История аккаунта",
      desc: "Скачайте PDF-сводку по вашим аллокациям, выводам и опубликованным отчётам.",
      button: "Скачать историю аккаунта (PDF)"
    }
  },
  es: {
    security: {
      setTitle: "Establezca su contraseña",
      setDesc: "Cree una contraseña para proteger el acceso directo a su gabinete de inversor.",
      changeTitle: "Cambiar contraseña",
      changeDesc: "Actualice la contraseña que utiliza para iniciar sesión en su gabinete de inversor.",
      current: "Contraseña actual",
      new: "Nueva contraseña",
      confirm: "Confirmar nueva contraseña",
      save: "Guardar",
      saving: "Guardando...",
      success: "Su contraseña se ha actualizado.",
      errTooShort: "La contraseña debe tener al menos 8 caracteres.",
      errMismatch: "Las contraseñas no coinciden.",
      errWrongCurrent: "La contraseña actual es incorrecta.",
      errGeneric: "No pudimos actualizar su contraseña. Vuelva a intentarlo."
    },
    preferences: {
      title: "Idioma",
      desc: "Elija el idioma utilizado en todo su gabinete de inversor.",
      current: "Idioma actual",
      themeNote: "El tema puede cambiarse con el conmutador del encabezado."
    },
    notifications: {
      title: "Notificaciones por correo",
      desc: "Controle si OTIZ envía actualizaciones operativas a su correo.",
      label: "Recibir notificaciones por correo",
      saved: "Guardado",
      error: "No se pudo guardar su preferencia. Vuelva a intentarlo."
    },
    sessions: {
      title: "Historial de sesiones",
      desc: "Inicios de sesión recientes en su gabinete de inversor, con detalles de dispositivo y red.",
      loading: "Cargando el historial de sesiones...",
      empty: "Aún no hay sesiones registradas.",
      thisDevice: "Este dispositivo",
      active: "Activa",
      expired: "Finalizada",
      unknownDevice: "Dispositivo desconocido",
      ipLabel: "IP"
    },
    terminate: {
      title: "Dispositivos activos",
      desc: "Finalice todas las demás sesiones iniciadas. Permanecerá conectado en este dispositivo.",
      button: "Cerrar sesión en todos los demás dispositivos",
      confirm: "Se cerrará su sesión en todos los demás dispositivos. ¿Continuar?",
      working: "Cerrando sesión en otros dispositivos..."
    },
    data: {
      title: "Historial de la cuenta",
      desc: "Descargue un resumen en PDF de sus asignaciones, retiros e informes publicados.",
      button: "Descargar historial de la cuenta (PDF)"
    }
  },
  de: {
    security: {
      setTitle: "Passwort festlegen",
      setDesc: "Erstellen Sie ein Passwort, um den direkten Zugang zu Ihrem Investor-Bereich zu schützen.",
      changeTitle: "Passwort ändern",
      changeDesc: "Aktualisieren Sie das Passwort für die Anmeldung in Ihrem Investor-Bereich.",
      current: "Aktuelles Passwort",
      new: "Neues Passwort",
      confirm: "Neues Passwort bestätigen",
      save: "Speichern",
      saving: "Wird gespeichert...",
      success: "Ihr Passwort wurde aktualisiert.",
      errTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      errMismatch: "Die Passwörter stimmen nicht überein.",
      errWrongCurrent: "Das aktuelle Passwort ist falsch.",
      errGeneric: "Ihr Passwort konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut."
    },
    preferences: {
      title: "Sprache",
      desc: "Wählen Sie die Sprache für Ihren gesamten Investor-Bereich.",
      current: "Aktuelle Sprache",
      themeNote: "Das Design kann über den Schalter in der Kopfzeile geändert werden."
    },
    notifications: {
      title: "E-Mail-Benachrichtigungen",
      desc: "Legen Sie fest, ob OTIZ betriebliche Updates an Ihre E-Mail sendet.",
      label: "E-Mail-Benachrichtigungen erhalten",
      saved: "Gespeichert",
      error: "Ihre Einstellung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
    },
    sessions: {
      title: "Sitzungsverlauf",
      desc: "Kürzliche Anmeldungen in Ihrem Investor-Bereich, mit Geräte- und Netzwerkdetails.",
      loading: "Sitzungsverlauf wird geladen...",
      empty: "Noch keine aufgezeichneten Sitzungen.",
      thisDevice: "Dieses Gerät",
      active: "Aktiv",
      expired: "Abgelaufen",
      unknownDevice: "Unbekanntes Gerät",
      ipLabel: "IP"
    },
    terminate: {
      title: "Aktive Geräte",
      desc: "Beenden Sie alle anderen angemeldeten Sitzungen. Auf diesem Gerät bleiben Sie angemeldet.",
      button: "Von allen anderen Geräten abmelden",
      confirm: "Dadurch werden Sie von allen anderen Geräten abgemeldet. Fortfahren?",
      working: "Andere Geräte werden abgemeldet..."
    },
    data: {
      title: "Kontoverlauf",
      desc: "Laden Sie eine PDF-Zusammenfassung Ihrer Allokationen, Auszahlungen und veröffentlichten Berichte herunter.",
      button: "Kontoverlauf herunterladen (PDF)"
    }
  },
  zh: {
    security: {
      setTitle: "设置您的密码",
      setDesc: "创建密码以保护直接访问您投资者专区的安全。",
      changeTitle: "更改密码",
      changeDesc: "更新用于登录您投资者专区的密码。",
      current: "当前密码",
      new: "新密码",
      confirm: "确认新密码",
      save: "保存",
      saving: "正在保存……",
      success: "您的密码已更新。",
      errTooShort: "密码长度至少为 8 个字符。",
      errMismatch: "两次输入的密码不一致。",
      errWrongCurrent: "当前密码不正确。",
      errGeneric: "无法更新您的密码。请重试。"
    },
    preferences: {
      title: "语言",
      desc: "选择您投资者专区所使用的语言。",
      current: "当前语言",
      themeNote: "可通过页眉中的切换开关更改主题。"
    },
    notifications: {
      title: "邮件通知",
      desc: "控制 OTIZ 是否向您的邮箱发送运营更新。",
      label: "接收邮件通知",
      saved: "已保存",
      error: "无法保存您的偏好设置。请重试。"
    },
    sessions: {
      title: "会话历史",
      desc: "近期登录您投资者专区的记录，含设备与网络详情。",
      loading: "正在加载会话历史……",
      empty: "尚无会话记录。",
      thisDevice: "本设备",
      active: "活动中",
      expired: "已过期",
      unknownDevice: "未知设备",
      ipLabel: "IP"
    },
    terminate: {
      title: "活动设备",
      desc: "结束所有其他已登录会话。您将继续在本设备保持登录。",
      button: "退出所有其他设备的登录",
      confirm: "此操作将使您从所有其他设备退出登录。是否继续？",
      working: "正在退出其他设备……"
    },
    data: {
      title: "账户历史",
      desc: "下载您的资金配置、提现和已发布报告的 PDF 摘要。",
      button: "下载账户历史（PDF）"
    }
  }
} as const;

type Strings = typeof STRINGS.en;

const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionRow = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeDevice(userAgent: string | null, fallback: string): string {
  if (!userAgent) return fallback;

  let browser: string | null = null;
  if (/\bEdg(?:e|A|iOS)?\//i.test(userAgent)) browser = "Edge";
  else if (/\bFirefox\//i.test(userAgent) || /\bFxiOS\//i.test(userAgent)) browser = "Firefox";
  else if (/\bChrome\//i.test(userAgent) || /\bCriOS\//i.test(userAgent)) browser = "Chrome";
  else if (/\bSafari\//i.test(userAgent) || /\bVersion\//i.test(userAgent)) browser = "Safari";

  let os: string | null = null;
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iPhone";
  else if (/Mac OS X|Macintosh/i.test(userAgent)) os = "macOS";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/Linux/i.test(userAgent)) os = "Linux";

  if (browser && os) return `${browser} · ${os}`;
  if (browser) return browser;
  if (os) return os;
  return fallback;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvestorSettingsPage({
  locale,
  hasPassword,
  emailNotificationsEnabled
}: {
  locale: Locale;
  hasPassword: boolean;
  emailNotificationsEnabled: boolean;
}) {
  const t = getStrings(locale);
  const router = useRouter();
  const pathname = usePathname();
  const formatters = createAdminFormatters(locale);

  // --- Password state ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // --- Notifications state ---
  const [emailEnabled, setEmailEnabled] = useState(emailNotificationsEnabled);
  const [notificationsSaved, setNotificationsSaved] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // --- Sessions state ---
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [terminating, setTerminating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setSessionsLoading(true);
      try {
        const res = await fetch("/api/investor/settings/sessions", { method: "GET" });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; sessions?: SessionRow[] } | null;
        if (!cancelled && res.ok && body?.ok && Array.isArray(body.sessions)) {
          setSessions(body.sessions);
        } else if (!cancelled) {
          setSessions([]);
        }
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Password submit ---
  const handlePasswordSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPasswordError(null);
      setPasswordSuccess(false);

      if (newPassword.length < 8) {
        setPasswordError(t.security.errTooShort);
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError(t.security.errMismatch);
        return;
      }

      setPasswordBusy(true);
      try {
        const payload: Record<string, string> = { newPassword, confirmPassword };
        if (hasPassword) payload.currentPassword = currentPassword;

        const res = await fetch("/api/investor/settings/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

        if (res.ok && body?.ok) {
          setPasswordSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          return;
        }

        switch (body?.error) {
          case "WRONG_CURRENT_PASSWORD":
            setPasswordError(t.security.errWrongCurrent);
            break;
          case "PASSWORD_MISMATCH":
            setPasswordError(t.security.errMismatch);
            break;
          case "PASSWORD_TOO_SHORT":
            setPasswordError(t.security.errTooShort);
            break;
          default:
            setPasswordError(t.security.errGeneric);
        }
      } catch {
        setPasswordError(t.security.errGeneric);
      } finally {
        setPasswordBusy(false);
      }
    },
    [confirmPassword, currentPassword, hasPassword, newPassword, t.security]
  );

  // --- Notifications toggle ---
  const handleToggleNotifications = useCallback(async () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    setNotificationsSaved(false);
    setNotificationsError(null);

    try {
      const res = await fetch("/api/investor/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotificationsEnabled: next })
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && body?.ok) {
        setNotificationsSaved(true);
      } else {
        setEmailEnabled(!next);
        setNotificationsError(t.notifications.error);
      }
    } catch {
      setEmailEnabled(!next);
      setNotificationsError(t.notifications.error);
    }
  }, [emailEnabled, t.notifications.error]);

  // --- Terminate other sessions ---
  const handleTerminate = useCallback(async () => {
    if (typeof window !== "undefined" && !window.confirm(t.terminate.confirm)) return;

    setTerminating(true);
    try {
      const res = await fetch("/api/investor/settings/sessions/terminate", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && body?.ok) {
        router.push(`/${locale}/investor/login`);
        router.refresh();
        return;
      }
    } catch {
      // fall through to reset busy state
    }
    setTerminating(false);
  }, [locale, router, t.terminate.confirm]);

  // --- Export PDF ---
  const handleExport = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = `/api/investor/settings/export-pdf?locale=${locale}`;
    }
  }, [locale]);

  const localeSwitchHref = useCallback(
    (target: Locale) => {
      const segments = (pathname ?? `/${locale}/investor/settings`).split("/");
      // segments[0] is empty (leading slash); segments[1] is the locale.
      if (segments.length > 1) segments[1] = target;
      return segments.join("/") || `/${target}/investor/settings`;
    },
    [locale, pathname]
  );

  const cardClass = "rounded-[1.35rem] border border-border dark:border-white/10 bg-card dark:bg-graphite-900/[0.72] p-6";
  const inputClass =
    "h-[3rem] rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 text-sm text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15";
  const labelClass = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

  const visibleSessions = sessions.slice(0, 10);

  return (
    <div className="grid gap-6">
      {/* Referral program (self-contained: loads its own data) */}
      <InvestorReferralSection locale={locale} />

      {/* 1) SECURITY — Password */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
            {hasPassword ? t.security.changeTitle : t.security.setTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {hasPassword ? t.security.changeDesc : t.security.setDesc}
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handlePasswordSubmit} noValidate>
          {hasPassword ? (
            <label className="grid gap-2">
              <span className={labelClass}>{t.security.current}</span>
              <input
                type="password"
                autoComplete="current-password"
                className={inputClass}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className={labelClass}>{t.security.new}</span>
            <input
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass}>{t.security.confirm}</span>
            <input
              type="password"
              autoComplete="new-password"
              className={inputClass}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {passwordError ? <p className="text-sm text-red-400">{passwordError}</p> : null}
          {passwordSuccess ? <p className="text-sm text-amber-700 dark:text-gold-100">{t.security.success}</p> : null}

          <div>
            <button
              type="submit"
              disabled={passwordBusy}
              className="inline-flex h-[3rem] items-center justify-center rounded-2xl bg-gold-200 px-6 text-sm font-semibold text-graphite-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordBusy ? t.security.saving : t.security.save}
            </button>
          </div>
        </form>
      </section>

      {/* 2) PREFERENCES — Language */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.preferences.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.preferences.desc}</p>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t.preferences.current}: <span className="font-semibold text-foreground">{localeNames[locale]}</span>
            </p>
            <div className="flex flex-wrap gap-1 rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] p-1">
              {locales.map((code) => {
                const isActive = code === locale;
                return (
                  <Link
                    key={code}
                    href={localeSwitchHref(code)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      isActive ? "bg-gold-200 text-graphite-950" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {localeShortNames[code]}
                  </Link>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t.preferences.themeNote}</p>
        </div>
      </section>

      {/* 3) NOTIFICATIONS — Email preference */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.notifications.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.notifications.desc}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">{t.notifications.label}</span>
            {notificationsSaved ? <span className="text-xs text-amber-700 dark:text-gold-100">{t.notifications.saved}</span> : null}
            {notificationsError ? <span className="text-xs text-red-400">{notificationsError}</span> : null}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailEnabled}
            aria-label={t.notifications.label}
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
              emailEnabled ? "border-gold-200/50 bg-gold-200" : "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.06]"
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-background dark:bg-graphite-950 transition-transform ${
                emailEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* 4) SECURITY — Session history */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.sessions.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.sessions.desc}</p>
        </div>

        {sessionsLoading ? (
          <p className="text-sm text-muted-foreground">{t.sessions.loading}</p>
        ) : visibleSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.sessions.empty}</p>
        ) : (
          <ul className="grid">
            {visibleSessions.map((session, index) => {
              const now = Date.now();
              const expires = new Date(session.expiresAt).getTime();
              const isLive = session.isActive && Number.isFinite(expires) && expires > now;

              let badgeText: string = t.sessions.expired;
              let badgeClass = "text-muted-foreground";
              if (session.isCurrent) {
                badgeText = t.sessions.thisDevice;
                badgeClass = "text-amber-700 dark:text-gold-100";
              } else if (isLive) {
                badgeText = t.sessions.active;
                badgeClass = "text-foreground";
              }

              return (
                <li
                  key={session.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-3.5 ${
                    index === 0 ? "" : "border-t border-border dark:border-white/[0.06]"
                  }`}
                >
                  <div className="grid gap-1">
                    <p className="text-sm font-medium text-foreground">
                      {describeDevice(session.userAgent, t.sessions.unknownDevice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatters.dateTime(session.createdAt)}
                      {session.ip ? ` · ${t.sessions.ipLabel} ${session.ip}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${badgeClass}`}>{badgeText}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 5) SECURITY — Terminate all sessions */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.terminate.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.terminate.desc}</p>
        </div>

        <button
          type="button"
          onClick={handleTerminate}
          disabled={terminating}
          className="inline-flex h-[3rem] items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-6 text-sm font-semibold text-foreground transition-colors hover:border-gold-200/45 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {terminating ? t.terminate.working : t.terminate.button}
        </button>
      </section>

      {/* 6) DATA — Download account history (PDF) */}
      <section className={cardClass}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">{t.data.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.data.desc}</p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex h-[3rem] items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-6 text-sm font-semibold text-foreground transition-colors hover:border-gold-200/45"
        >
          {t.data.button}
        </button>
      </section>
    </div>
  );
}
