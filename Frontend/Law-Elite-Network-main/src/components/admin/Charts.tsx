"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartsProps {
  data: {
    name: string;
    engagements: number;
  }[];
}

/**
 * @fileOverview High-Fidelity Network Engagement Chart.
 * Visualizes platform velocity with a premium executive aesthetic.
 */
export default function Charts({ data }: ChartsProps) {
  return (
    <div className="h-[400px] w-full mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "bold" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "rgba(24, 27, 46, 0.95)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "bold",
              color: "#fff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
            itemStyle={{ color: "hsl(var(--accent))" }}
            cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="engagements"
            stroke="hsl(var(--accent))"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorEngagements)"
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
