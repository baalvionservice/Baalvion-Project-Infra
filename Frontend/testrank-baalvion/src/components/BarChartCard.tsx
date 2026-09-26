"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";

interface Bar {
  label: string;
  widthPct: number;
  color: string;
  value: string;
  valueColor?: string;
}

interface MiniStat {
  value: string;
  valueColor: string;
  label: string;
  trend: string;
  trendUp: boolean;
}

interface BarChartCardProps {
  title: string;
  badge: string;
  bars: Bar[];
  miniStats: MiniStat[];
}

export default function BarChartCard({ title, badge, bars, miniStats }: BarChartCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className="bg-gray-50 border border-gray-200 rounded-2xl p-[22px] shadow-sm"
    >
      <div className="text-[11px] font-bold text-gray-900 mb-3.5 flex justify-between items-center">
        {title}
        <span className="text-[9px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-2.5">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2.5">
            <div className="text-[11px] text-gray-500 w-[110px] flex-shrink-0 font-medium">
              {bar.label}
            </div>
            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.34,1.2,0.64,1)]"
                style={{
                  width: `${bar.widthPct}%`,
                  background: bar.color,
                  transform: inView ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left",
                }}
              />
            </div>
            <div
              className="text-[11px] font-bold w-10 text-right"
              style={{ color: bar.valueColor || "#374151" }}
            >
              {bar.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-2.5 mt-3.5">
        {miniStats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div
              className="text-[21px] font-black tracking-[-0.5px]"
              style={{ color: s.valueColor }}
            >
              {s.value}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
            <div
              className={`text-[10px] font-semibold mt-0.5 ${s.trendUp ? "text-green-600" : "text-red-500"}`}
            >
              {s.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
