import type { Locale } from "@otiz/lib";

type HealthCopy = {
  proof: {
    verified: (score: number) => string;
    partial: (score: number) => string;
    review: (score: number) => string;
  };
  risk: Record<string, string>;
  payout: Record<string, string>;
  inventory: (received: string, sold: string, remaining: string) => string;
  reconciliation: {
    broken: string;
    warning: string;
    review: string;
  };
};

const COPY: Record<Locale, HealthCopy> = {
  en: {
    proof: {
      verified: (score) => `All required documents are available (${score}%).`,
      partial: (score) => `Some documents are available; the rest are being reviewed (${score}%).`,
      review: (score) => `The documents are still being reviewed (${score}%).`
    },
    risk: {
      LOW: "No current issues require attention.",
      MODERATE: "The deal is being monitored as it progresses.",
      ELEVATED: "Some issues require the manager's attention.",
      HIGH: "The deal requires manager review before the next report.",
      CRITICAL: "The identified issues must be resolved before the next report."
    },
    payout: { "Paid or partially paid": "Paid or partially paid", Approved: "Approved", "Not ready": "Not ready" },
    inventory: (received, sold, remaining) => `${received} received, ${sold} sold, ${remaining} remaining`,
    reconciliation: {
      broken: "A significant difference is being checked by the manager.",
      warning: "Some figures are still being checked.",
      review: "The figures are being checked."
    }
  },
  ru: {
    proof: {
      verified: (score) => `Все необходимые документы доступны (${score}%).`,
      partial: (score) => `Часть документов доступна, остальные проверяются (${score}%).`,
      review: (score) => `Документы ещё проверяются (${score}%).`
    },
    risk: {
      LOW: "Сейчас нет вопросов, требующих внимания.",
      MODERATE: "Сделка находится под обычным наблюдением.",
      ELEVATED: "Некоторые вопросы требуют внимания менеджера.",
      HIGH: "Перед следующим отчётом сделку должен проверить менеджер.",
      CRITICAL: "Перед следующим отчётом необходимо решить выявленные вопросы."
    },
    payout: { "Paid or partially paid": "Выплачено полностью или частично", Approved: "Одобрено", "Not ready": "Не готово" },
    inventory: (received, sold, remaining) => `Получено: ${received}, продано: ${sold}, осталось: ${remaining}`,
    reconciliation: {
      broken: "Менеджер проверяет существенное расхождение.",
      warning: "Некоторые показатели ещё проверяются.",
      review: "Показатели находятся на проверке."
    }
  },
  es: {
    proof: {
      verified: (score) => `Todos los documentos necesarios están disponibles (${score} %).`,
      partial: (score) => `Algunos documentos están disponibles; el resto se está revisando (${score} %).`,
      review: (score) => `Los documentos aún se están revisando (${score} %).`
    },
    risk: {
      LOW: "Actualmente no hay asuntos que requieran atención.",
      MODERATE: "La operación se supervisa mientras avanza.",
      ELEVATED: "Algunos asuntos requieren la atención del gestor.",
      HIGH: "La operación requiere la revisión del gestor antes del próximo informe.",
      CRITICAL: "Los asuntos detectados deben resolverse antes del próximo informe."
    },
    payout: { "Paid or partially paid": "Pagado total o parcialmente", Approved: "Aprobado", "Not ready": "No preparado" },
    inventory: (received, sold, remaining) => `Recibido: ${received}, vendido: ${sold}, restante: ${remaining}`,
    reconciliation: {
      broken: "El gestor está revisando una diferencia significativa.",
      warning: "Algunas cifras aún se están revisando.",
      review: "Las cifras se están revisando."
    }
  },
  de: {
    proof: {
      verified: (score) => `Alle erforderlichen Dokumente sind verfügbar (${score} %).`,
      partial: (score) => `Ein Teil der Dokumente ist verfügbar; der Rest wird geprüft (${score} %).`,
      review: (score) => `Die Dokumente werden noch geprüft (${score} %).`
    },
    risk: {
      LOW: "Derzeit gibt es keine Punkte, die Aufmerksamkeit erfordern.",
      MODERATE: "Das Geschäft wird während des Ablaufs beobachtet.",
      ELEVATED: "Einige Punkte erfordern die Aufmerksamkeit des Managers.",
      HIGH: "Das Geschäft muss vor dem nächsten Bericht vom Manager geprüft werden.",
      CRITICAL: "Die festgestellten Punkte müssen vor dem nächsten Bericht geklärt werden."
    },
    payout: { "Paid or partially paid": "Vollständig oder teilweise ausgezahlt", Approved: "Genehmigt", "Not ready": "Nicht bereit" },
    inventory: (received, sold, remaining) => `Erhalten: ${received}, verkauft: ${sold}, verbleibend: ${remaining}`,
    reconciliation: {
      broken: "Der Manager prüft eine wesentliche Abweichung.",
      warning: "Einige Zahlen werden noch geprüft.",
      review: "Die Zahlen werden geprüft."
    }
  },
  zh: {
    proof: {
      verified: (score) => `所需文件均已提供（${score}%）。`,
      partial: (score) => `部分文件已提供，其余文件正在审核（${score}%）。`,
      review: (score) => `文件仍在审核中（${score}%）。`
    },
    risk: {
      LOW: "目前没有需要关注的问题。",
      MODERATE: "项目正在按进度持续跟进。",
      ELEVATED: "部分问题需要经理关注。",
      HIGH: "下次报告前需要经理审核该项目。",
      CRITICAL: "下次报告前必须解决已发现的问题。"
    },
    payout: { "Paid or partially paid": "已全部或部分支付", Approved: "已批准", "Not ready": "尚未就绪" },
    inventory: (received, sold, remaining) => `已收货：${received}，已售出：${sold}，剩余：${remaining}`,
    reconciliation: {
      broken: "经理正在核查一项重大差异。",
      warning: "部分数据仍在核查中。",
      review: "数据正在核查中。"
    }
  }
};

function getCopy(locale: Locale) {
  return COPY[locale] ?? COPY.en;
}

export function localizeProofSummary(locale: Locale, state: string, score: number) {
  const copy = getCopy(locale).proof;
  if (state === "VERIFIED") return copy.verified(score);
  if (state === "PARTIAL") return copy.partial(score);
  return copy.review(score);
}

export function localizeRiskSummary(locale: Locale, level: string) {
  const copy = getCopy(locale);
  return copy.risk[level] ?? copy.risk.MODERATE;
}

export function localizePayoutStatus(locale: Locale, status: string) {
  const copy = getCopy(locale);
  return copy.payout[status] ?? copy.payout["Not ready"];
}

export function localizeInventoryProgress(locale: Locale, value: string) {
  const match = value.match(/^(.+?) received, (.+?) sold, (.+?) remaining$/u);
  const copy = getCopy(locale);
  return match ? copy.inventory(match[1], match[2], match[3]) : copy.reconciliation.review;
}

export function localizeReconciliationNotice(locale: Locale, status: string) {
  const copy = getCopy(locale).reconciliation;
  if (status === "BROKEN") return copy.broken;
  if (status === "WARNING") return copy.warning;
  return null;
}
