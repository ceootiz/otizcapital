"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { commerceChartData } from "@otiz/lib";

// Recharts sets colors as SVG presentation attributes, which do NOT resolve CSS
// var(), so we detect the active theme (a `.dark` class on <html>) at runtime and
// pass explicit per-theme colors. Defaults to dark to match SSR / the app default.
function useIsDark() {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const GOLD = "#d4af5f";

export function CommerceChart({
  compact = false,
  months,
  capitalLabel = "Active capital",
  volumeLabel = "Commerce volume"
}: {
  compact?: boolean;
  months?: string[];
  capitalLabel?: string;
  volumeLabel?: string;
}) {
  const isDark = useIsDark();

  const data = months
    ? commerceChartData.map((point, index) => ({ ...point, month: months[index] ?? point.month }))
    : commerceChartData;

  // The "volume" series is neutral: white on dark, dark ink on light so it stays visible.
  const neutral = isDark ? "255,255,255" : "23,30,41";
  const grid = `rgba(${neutral},${isDark ? 0.06 : 0.09})`;
  const tick = isDark ? "rgba(244,232,205,0.52)" : "rgba(80,89,102,0.9)";
  const volumeStroke = `rgba(${neutral},${isDark ? 0.42 : 0.5})`;
  const tooltipStyle = isDark
    ? {
        border: "1px solid rgba(229,211,166,0.18)",
        background: "rgba(11,13,16,0.92)",
        color: "#f4e8cd",
        boxShadow: "0 24px 80px rgba(0,0,0,0.55)"
      }
    : {
        border: "1px solid rgba(23,30,41,0.14)",
        background: "rgba(253,252,248,0.98)",
        color: "#171e29",
        boxShadow: "0 24px 60px rgba(23,30,41,0.16)"
      };

  return (
    <div className={compact ? "h-44" : "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="capitalFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={GOLD} stopOpacity={0.36} />
              <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={`rgb(${neutral})`} stopOpacity={isDark ? 0.18 : 0.12} />
              <stop offset="95%" stopColor={`rgb(${neutral})`} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tick, fontSize: 11 }}
            dy={10}
          />
          <YAxis hide domain={[0, 18]} />
          <Tooltip
            cursor={{ stroke: "rgba(212,175,95,0.24)" }}
            contentStyle={{ ...tooltipStyle, borderRadius: 16 }}
            labelStyle={{ color: GOLD, fontWeight: 700 }}
            formatter={(value, name) => {
              const numericValue = Number(value);
              return ["$" + numericValue.toFixed(1) + "M", name === "capital" ? capitalLabel : volumeLabel];
            }}
          />
          <Area type="monotone" dataKey="volume" stroke={volumeStroke} strokeWidth={1.4} fill="url(#volumeFill)" />
          <Area type="monotone" dataKey="capital" stroke={GOLD} strokeWidth={2.2} fill="url(#capitalFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
