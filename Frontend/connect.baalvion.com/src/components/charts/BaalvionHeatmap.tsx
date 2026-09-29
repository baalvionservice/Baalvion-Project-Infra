'use client';

import React from 'react';
import { ChartCard } from './ChartCard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BaalvionHeatmapProps {
  title: string;
  description?: string;
  loading?: boolean;
  rows: string[];
  cols: string[];
  data: number[][]; // 2D array where each value is 0-1
}

export function BaalvionHeatmap({
  title,
  description,
  loading,
  rows,
  cols,
  data
}: BaalvionHeatmapProps) {
  return (
    <ChartCard title={title} description={description} loading={loading}>
      <div className="overflow-x-auto">
        <div className="min-w-[600px] space-y-4">
          {/* Header */}
          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div />
            <div className="grid grid-cols-7 gap-2">
              {cols.map(col => (
                <div key={col} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{col}</div>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="space-y-2">
            {rows.map((row, rIdx) => (
              <div key={row} className="grid grid-cols-[100px_1fr] gap-4 items-center">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-2">{row}</div>
                <div className="grid grid-cols-7 gap-2">
                  {data[rIdx].map((val, cIdx) => (
                    <motion.div
                      key={`${rIdx}-${cIdx}`}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      className="h-10 rounded-lg bg-primary transition-colors cursor-pointer relative"
                      style={{ opacity: 0.1 + (val * 0.9) }}
                      title={`${row} ${cols[cIdx]}: ${Math.round(val * 100)}% activity`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center gap-4 pt-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Activity</span>
            <div className="flex gap-1">
              {[0.1, 0.3, 0.6, 0.9, 1].map((op) => (
                <div key={op} className="h-3 w-3 rounded-sm bg-primary" style={{ opacity: op }} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Activity</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
