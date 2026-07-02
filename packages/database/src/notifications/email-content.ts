import type { NotificationEvent } from "@prisma/client";

// Investor-facing (Russian) email content, keyed by event type. Kept separate
// from the internal admin templates so those stay untouched. Returns null when
// an event type has no investor email (the provider then skips it).

export type InvestorEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://otiz-capital-web.vercel.app").replace(/\/$/, "");
}

function parsePayload(payloadJson: string): Record<string, unknown> {
  try {
    const value = JSON.parse(payloadJson) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const GOLD = "#c8b97a";
const BG = "#0a0a0c";
const PANEL = "#121216";
const INK = "#ececec";
const MUTED = "#9a9a9f";

// Dark, minimal, brand-consistent email shell (email-safe inline styles).
function shell(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PANEL};border:1px solid #23232a;border-radius:16px;overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td></tr>
        <tr><td style="padding:36px 40px 8px 40px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:4px;color:${GOLD};">OTIZ CAPITAL</div>
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:26px;line-height:1.25;color:${INK};margin:18px 0 0 0;">${escapeHtml(heading)}</h1>
        </td></tr>
        <tr><td style="padding:12px 40px 36px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #23232a;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
          OTIZ CAPITAL · Частные предложения могут зависеть от пригодности, юрисдикции и условий соглашения. Доходность не гарантируется.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function paragraphs(items: string[]): string {
  return items.map((p) => `<p style="margin:0 0 14px 0;">${p}</p>`).join("");
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 4px 0;"><a href="${href}" style="display:inline-block;background:${GOLD};color:#141414;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:14px;padding:12px 24px;border-radius:999px;">${escapeHtml(label)}</a></p>`;
}

function toText(heading: string, lines: string[]): string {
  return `OTIZ CAPITAL\n\n${heading}\n\n${lines.join("\n\n")}`;
}

export function buildInvestorEmail(event: NotificationEvent): InvestorEmailContent | null {
  const payload = parsePayload(event.payloadJson);
  const name = str(payload, "fullName");
  const greeting = name ? `Здравствуйте, ${escapeHtml(name)}!` : "Здравствуйте!";
  const base = siteBaseUrl();

  switch (event.type) {
    case "INVESTOR_APPLICATION_CREATED": {
      const heading = "Заявка получена";
      const lines = [
        `${greeting} Мы получили вашу заявку в OTIZ Capital.`,
        "Каждая заявка проходит ручную проверку нашей команды — мы свяжемся с вами лично, чтобы обсудить детали.",
        "Обратите внимание: подача заявки не гарантирует одобрение, решение принимается индивидуально.",
        "Спасибо за интерес к OTIZ Capital."
      ];
      return { subject: "Ваша заявка получена — OTIZ Capital", html: shell(heading, paragraphs(lines)), text: toText(heading, lines) };
    }

    case "INVESTOR_CREATED": {
      const heading = "Заявка одобрена";
      const loginUrl = `${base}/ru/investor/login`;
      const accessCode = process.env.INVESTOR_ACCESS_CODE || "";
      const accessLine = accessCode
        ? `Войдите по адресу ${loginUrl}, используя ваш email и код доступа: <strong style="color:${GOLD};">${escapeHtml(accessCode)}</strong>.`
        : `Войдите по адресу ${loginUrl}, используя ваш email. Код доступа предоставит ваш менеджер.`;
      const lines = [
        `${greeting} Поздравляем — ваша заявка одобрена, и для вас создан кабинет инвестора.`,
        accessLine,
        "В кабинете вы увидите аллокации, отчёты и запросы на вывод. Мы свяжемся с вами по следующим шагам."
      ];
      const html = shell(heading, paragraphs(lines) + button(loginUrl, "Войти в кабинет"));
      const accessText = accessCode ? `Код доступа: ${accessCode}` : "Код доступа предоставит ваш менеджер.";
      return {
        subject: "Ваша заявка одобрена — OTIZ Capital",
        html,
        text: toText(heading, [`${name ? name + ", в" : "В"}аша заявка одобрена.`, `Вход: ${loginUrl}`, accessText])
      };
    }

    case "APPLICATION_STATUS_CHANGED": {
      // Only rejection emails are created with the EMAIL channel.
      if (str(payload, "status") !== "REJECTED") return null;
      const heading = "О вашей заявке";
      const lines = [
        `${greeting} Благодарим за интерес к OTIZ Capital и за уделённое время.`,
        "К сожалению, сейчас мы не можем продолжить работу по вашей заявке.",
        "Это решение не окончательно — если ваши обстоятельства изменятся, будем рады рассмотреть новую заявку в будущем."
      ];
      return { subject: "О вашей заявке в OTIZ Capital", html: shell(heading, paragraphs(lines)), text: toText(heading, lines) };
    }

    case "MONTHLY_REPORT_PUBLISHED": {
      const heading = "Новый отчёт";
      const reportsUrl = `${base}/ru/investor/reports`;
      const title = str(payload, "title");
      const month = str(payload, "month");
      const detail = title ? `«${escapeHtml(title)}»${month ? ` за ${escapeHtml(month)}` : ""}` : month ? `за ${escapeHtml(month)}` : "";
      const lines = [
        `Здравствуйте! Опубликован новый ежемесячный отчёт${detail ? ` ${detail}` : ""}.`,
        "Он уже доступен в вашем кабинете инвестора."
      ];
      const html = shell(heading, paragraphs(lines) + button(reportsUrl, "Открыть отчёты"));
      return { subject: "Новый отчёт доступен — OTIZ Capital", html, text: toText(heading, [...lines, `Отчёты: ${reportsUrl}`]) };
    }

    default:
      return null;
  }
}
