'use client';

import React, { useId, useMemo, useState } from 'react';

interface ChartPoint {
  year: number | string;
  balance: number;
}

const MARGIN = { top: 8, right: 12, bottom: 28, left: 56 };

/**
 * Hand-rolled replacement for recharts' AreaChart — see LightLineChart.tsx
 * for why: recharts is ~100KB gzipped, and even with every usage in this app
 * behind next/dynamic(), Next's default webpack chunk-splitting still hoisted
 * it into every page's initial bundle. A dependency-free SVG area makes that
 * whole class of problem impossible rather than fighting it.
 */
export function InvestmentGrowthChart({
  data,
  formatCurrency,
}: {
  data: ChartPoint[];
  formatCurrency: (val: number) => string;
}) {
  const width = 600;
  const height = 350;
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { linePath, areaPath, points, yTicks, xTickIndices, minY, maxY } = useMemo(() => {
    if (data.length === 0) {
      return {
        linePath: '',
        areaPath: '',
        points: [] as { x: number; y: number }[],
        yTicks: [] as number[],
        xTickIndices: [] as number[],
        minY: 0,
        maxY: 0,
      };
    }
    const values = data.map((d) => d.balance);
    const minY = 0;
    const maxY = Math.max(...values) * 1.08 || 1;

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const points = data.map((d, i) => {
      const x = MARGIN.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = MARGIN.top + innerH - ((d.balance - minY) / (maxY - minY)) * innerH;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const baseline = MARGIN.top + innerH;
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${baseline} L${points[0].x.toFixed(2)},${baseline} Z`;

    const yTickCount = 4;
    const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTickCount);

    const xTickCount = Math.min(6, data.length);
    const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
      Math.round((i / Math.max(1, xTickCount - 1)) * (data.length - 1)),
    );

    return { linePath, areaPath, points, yTicks, xTickIndices, minY, maxY };
  }, [data]);

  if (data.length === 0) return null;

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
    <div className="relative w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1d4fc4" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#1d4fc4" stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((val, i) => {
          const y = MARGIN.top + innerH - ((val - minY) / (maxY - minY || 1)) * innerH;
          return (
            <g key={i}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y} y2={y} stroke="#f3f4f6" strokeDasharray="3 3" />
              <text x={MARGIN.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#9ca3af">
                ${(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {xTickIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          return (
            <text key={idx} x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#9ca3af">
              {data[idx].year}
            </text>
          );
        })}
        <text x={width / 2} y={height - 2} textAnchor="middle" fontSize={9} fill="#9ca3af">
          Years
        </text>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="#1d4fc4" strokeWidth={2.5} />

        {hoveredPoint && (
          <>
            <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={MARGIN.top} y2={height - MARGIN.bottom} stroke="#e5e7eb" />
            <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={3.5} fill="#1d4fc4" />
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
          className="pointer-events-none absolute text-xs rounded-xl px-2.5 py-1.5 bg-white border border-gray-100 shadow-sm"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          <div className="text-gray-400">Capital Maturity</div>
          <div className="font-semibold text-gray-900">{formatCurrency(hovered.balance)}</div>
        </div>
      )}
    </div>
  );
}
