"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { commerceChartData } from "@otiz/lib";

export function CommerceChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "h-44" : "h-72"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={commerceChartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="capitalFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#d4af5f" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#d4af5f" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="volumeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(244,232,205,0.52)", fontSize: 11 }}
            dy={10}
          />
          <YAxis hide domain={[0, 18]} />
          <Tooltip
            cursor={{ stroke: "rgba(212,175,95,0.24)" }}
            contentStyle={{
              border: "1px solid rgba(229,211,166,0.18)",
              background: "rgba(11,13,16,0.92)",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
              color: "#f4e8cd"
            }}
            labelStyle={{ color: "#d4af5f", fontWeight: 700 }}
            formatter={(value, name) => {
              const numericValue = Number(value);
              return ["$" + numericValue.toFixed(1) + "M", name === "capital" ? "Active capital" : "Commerce volume"];
            }}
          />
          <Area type="monotone" dataKey="volume" stroke="rgba(255,255,255,0.42)" strokeWidth={1.4} fill="url(#volumeFill)" />
          <Area type="monotone" dataKey="capital" stroke="#d4af5f" strokeWidth={2.2} fill="url(#capitalFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
