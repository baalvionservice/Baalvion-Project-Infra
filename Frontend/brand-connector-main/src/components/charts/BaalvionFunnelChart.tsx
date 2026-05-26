'use client';

import React from 'react';
import { 
  FunnelChart, 
  Funnel, 
  LabelList, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ChartCard } from './ChartCard';

interface BaalvionFunnelChartProps {
  data: { value: number; name: string; fill?: string }[];
  title: string;
  description?: string;
  loading?: boolean;
  height?: number;
}

const COLORS = ['#6C3AE8', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export function BaalvionFunnelChart({
  data,
  title,
  description,
  loading,
  height = 350
}: BaalvionFunnelChartProps) {
  return (
    <ChartCard title={title} description={description} loading={loading}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <FunnelChart>
            <Tooltip 
              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
            />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
            >
              <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
