"use client";

import React, { useId, useMemo, useState } from "react";

interface LinePoint {
  date: string;
  close: number;
}

interface LightLineChartProps {
  data: LinePoint[];
  height?: number;
  stroke?: string;
  gridStroke?: string;
  axisColor?: string;
  tooltipBg?: string;
  tooltipBorder?: string;
  tooltipText?: string;
}

const MARGIN = { top: 8, right: 12, bottom: 24, left: 52 };

/**
 * Dependency-free replacement for recharts' LineChart (QuoteChart /
 * ArticleInlineChartClient only ever needed a single price line with a grid,
 * two axes, and a hover tooltip — recharts itself is ~100KB gzipped and,
 * despite every usage in this app already being behind next/dynamic(), Next's
 * default webpack chunk-splitting still hoisted it into every page's initial
 * bundle (see next.config.ts history / commit 2026-09-18). A hand-rolled SVG
 * line makes that whole class of problem impossible rather than fighting it.
 */
export function LightLineChart({
  data,
  height = 320,
  stroke = "#E31937",
  gridStroke = "rgba(255,255,255,0.1)",
  axisColor = "rgba(255,255,255,0.5)",
  tooltipBg = "#111",
  tooltipBorder = "rgba(255,255,255,0.15)",
  tooltipText = "#fff",
}: LightLineChartProps) {
  const width = 600; // viewBox units; scales via CSS width:100%
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, points, yTicks, xTickIndices, minY, maxY } = useMemo(() => {
    if (data.length === 0) {
      return { path: "", points: [] as { x: number; y: number }[], yTicks: [] as number[], xTickIndices: [] as number[], minY: 0, maxY: 0 };
    }
    const values = data.map((d) => d.close);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin) * 0.08 || rawMax * 0.05 || 1;
    const minY = rawMin - pad;
    const maxY = rawMax + pad;

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const points = data.map((d, i) => {
      const x = MARGIN.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = MARGIN.top + innerH - ((d.close - minY) / (maxY - minY)) * innerH;
      return { x, y };
    });

    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => minY + ((maxY - minY) * i) / tickCount);

    const xTickCount = Math.min(6, data.length);
    const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
      Math.round((i / Math.max(1, xTickCount - 1)) * (data.length - 1)),
    );

    return { path, points, yTicks, xTickIndices, minY, maxY };
  }, [data, height]);

  if (data.length === 0) {
    return <p className="py-16 text-center text-[12px] text-white/40">No chart data available for this range.</p>;
  }

  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - MARGIN.left) / innerW) * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const hoveredPoint = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {yTicks.map((val, i) => {
          const y = MARGIN.top + innerH - ((val - minY) / (maxY - minY || 1)) * innerH;
          return (
            <g key={i}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y} y2={y} stroke={gridStroke} strokeDasharray="3 3" />
              <text x={MARGIN.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={axisColor}>
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {xTickIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          return (
            <text key={idx} x={p.x} y={height - 6} textAnchor="middle" fontSize={10} fill={axisColor}>
              {data[idx].date}
            </text>
          );
        })}

        <path d={path} fill="none" stroke={stroke} strokeWidth={2} />

        {hoveredPoint && (
          <>
            <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={MARGIN.top} y2={height - MARGIN.bottom} stroke={gridStroke} />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={3.5} fill={stroke} />
          </>
        )}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {hovered && hoveredPoint && (
        <div
          className="pointer-events-none absolute text-xs rounded px-2 py-1.5"
          style={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            color: tooltipText,
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <div className="opacity-70">{hovered.date}</div>
          <div className="font-semibold">{hovered.close.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
