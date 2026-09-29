'use client';

import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { ChartCard } from './ChartCard';

interface BaalvionRadarChartProps {
  data: any[];
  dataKey: string;
  categoryKey: string;
  title: string;
  description?: string;
  loading?: boolean;
  height?: number;
}

export function BaalvionRadarChart({
  data,
  dataKey,
  categoryKey,
  title,
  description,
  loading,
  height = 350
}: BaalvionRadarChartProps) {
  return (
    <ChartCard title={title} description={description} loading={loading}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#f1f5f9" />
            <PolarAngleAxis 
              dataKey={categoryKey} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Value"
              dataKey={dataKey}
              stroke="#6C3AE8"
              strokeWidth={3}
              fill="#6C3AE8"
              fillOpacity={0.15}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
