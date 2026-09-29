'use client';

import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartCard } from './ChartCard';

interface BaalvionDonutChartProps {
  data: { name: string; value: number; color?: string }[];
  title: string;
  description?: string;
  loading?: boolean;
  height?: number;
}

const DEFAULT_COLORS = ['#6C3AE8', '#F97316', '#10B981', '#3B82F6', '#EC4899'];

export function BaalvionDonutChart({
  data,
  title,
  description,
  loading,
  height = 300
}: BaalvionDonutChartProps) {
  return (
    <ChartCard title={title} description={description} loading={loading}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
