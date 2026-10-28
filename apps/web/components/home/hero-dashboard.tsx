"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  FileText,
  PackageCheck,
  Search,
  Smartphone,
  Store,
  Truck
} from "lucide-react";
import type { HomeDictionary, Locale } from "@otiz/lib";

const COPY: Record<Locale, { model: string; categories: string; goods: string; channel: string; channelDetail: string; report: string; route: string; notice: string; tags: string[]; logistics: string; logisticsDetail: string; materials: string; materialsDetail: string; labels: string[] }> = {
  en: { model: "Commerce cycle · model", categories: "Product categories", goods: "Electronics for trade", channel: "Sales channels", channelDetail: "Marketplaces · direct channels", report: "Operational reporting", route: "Procurement to sale", notice: "Illustrative process", tags: ["Phones", "Accessories"], logistics: "Goods in transit", logisticsDetail: "Logistics within a trade cycle", materials: "Cycle materials", materialsDetail: "Availability depends on the project", labels: ["Procurement", "Quality check", "Logistics", "Marketplace sale"] },
  ru: { model: "Торговый цикл · модель", categories: "Категории товаров", goods: "Электроника для торговли", channel: "Каналы продаж", channelDetail: "Маркетплейсы · прямые каналы", report: "Операционная отчётность", route: "От закупки до продажи", notice: "Схема процесса", tags: ["Смартфоны", "Аксессуары"], logistics: "Движение товара", logisticsDetail: "Логистика в рамках цикла", materials: "Материалы цикла", materialsDetail: "Состав зависит от проекта", labels: ["Закупка", "Проверка", "Логистика", "Продажа"] },
  es: { model: "Ciclo comercial · modelo", categories: "Categorías de producto", goods: "Electrónica para comercio", channel: "Canales de venta", channelDetail: "Marketplaces · canales directos", report: "Informes operativos", route: "De compra a venta", notice: "Proceso ilustrativo", tags: ["Móviles", "Accesorios"], logistics: "Movimiento de productos", logisticsDetail: "Logística dentro del ciclo", materials: "Materiales del ciclo", materialsDetail: "Disponibilidad según el proyecto", labels: ["Compra", "Control de calidad", "Logística", "Venta en marketplace"] },
  de: { model: "Handelszyklus · Modell", categories: "Produktkategorien", goods: "Elektronik für den Handel", channel: "Vertriebskanäle", channelDetail: "Marktplätze · Direktvertrieb", report: "Operatives Reporting", route: "Von Beschaffung bis Verkauf", notice: "Beispielprozess", tags: ["Smartphones", "Zubehör"], logistics: "Warenbewegung", logisticsDetail: "Logistik innerhalb des Zyklus", materials: "Zyklusmaterialien", materialsDetail: "Je nach Projekt verfügbar", labels: ["Beschaffung", "Qualitätsprüfung", "Logistik", "Marktplatzverkauf"] },
  zh: { model: "贸易周期 · 模型", categories: "商品类别", goods: "用于贸易的电子产品", channel: "销售渠道", channelDetail: "电商平台 · 直接渠道", report: "运营报告", route: "从采购到销售", notice: "流程示意", tags: ["智能手机", "配件"], logistics: "商品流转", logisticsDetail: "周期内的物流", materials: "周期材料", materialsDetail: "视具体项目而定", labels: ["采购", "质量检查", "物流", "平台销售"] }
};

export function HeroDashboard({ dictionary, locale }: { dictionary: HomeDictionary; locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const copy = COPY[locale] ?? COPY.en;
  const icons = [Boxes, ClipboardCheck, Truck, Store];

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="home-dashboard"
      aria-label={copy.notice}
    >
      <div className="home-dashboard-grid">
        <article className="home-widget home-widget-cycle">
          <div className="home-widget-kicker"><span className="home-live-dot" />{copy.model}</div>
          <h2>{copy.route}</h2>
          <div className="home-cycle-steps">
            {copy.labels.map((label, index) => {
              const Icon = icons[index];
              return <div className="home-cycle-step" key={label}><span className="home-cycle-icon"><Icon aria-hidden="true" /></span><span>{label}</span></div>;
            })}
          </div>
        </article>

        <article className="home-widget home-widget-search">
          <span className="home-widget-icon"><Search aria-hidden="true" /></span>
          <div><p>{copy.categories}</p><small>{copy.notice}</small></div>
          <ArrowUpRight className="home-widget-arrow" aria-hidden="true" />
          <div className="home-category-chips">{copy.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </article>

        <article className="home-widget home-widget-featured">
          <div className="home-featured-orbit" aria-hidden="true" />
          <div className="home-featured-icon"><Smartphone aria-hidden="true" /></div>
          <span className="home-featured-label">OTIZ · COMMERCE</span>
          <h3>{copy.goods}</h3>
          <p>{dictionary.hero.dashboardSubtitle}</p>
        </article>

        <article className="home-widget home-widget-channel">
          <div className="home-widget-icon"><Store aria-hidden="true" /></div>
          <div><p>{copy.channel}</p><small>{copy.channelDetail}</small></div>
          <span className="home-channel-lines"><i /><i /><i /></span>
        </article>

        <article className="home-widget home-widget-report">
          <div className="home-report-top"><span className="home-widget-icon"><FileText aria-hidden="true" /></span><ArrowUpRight className="home-widget-arrow" aria-hidden="true" /></div>
          <p>{copy.report}</p>
          <small>{dictionary.transparency.subtitle}</small>
          <a href="#transparency">{dictionary.hero.secondary}</a>
        </article>

        <article className="home-widget home-widget-logistics">
          <div className="home-logistics-mark"><PackageCheck aria-hidden="true" /></div>
          <div><p>{copy.logistics}</p><small>{copy.logisticsDetail}</small></div>
        </article>

        <article className="home-widget home-widget-materials">
          <div className="home-materials-cover">{copy.notice}</div>
          <div><p>{copy.materials}</p><small>{copy.materialsDetail}</small></div>
          <ul><li><FileText aria-hidden="true" />{copy.report}</li><li><PackageCheck aria-hidden="true" />{copy.logistics}</li></ul>
        </article>
      </div>
    </motion.div>
  );
}
