"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { QuoteChartPoint } from "@/lib/data/marketsLoader";

const CNBC_RED = "#E31937";

export function QuoteChart({ data }: { data: QuoteChartPoint[] }) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-[12px] text-white/40">No chart data available for this range.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} minTickGap={40} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} width={55} />
        <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
        <Line type="monotone" dataKey="close" stroke={CNBC_RED} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
