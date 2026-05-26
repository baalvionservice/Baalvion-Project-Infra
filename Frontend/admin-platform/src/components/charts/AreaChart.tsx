'use client';

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDataPoint } from '@/lib/api/analytics';
import { formatDate } from '@/lib/utils/format';

interface AreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function AreaChart({
  data,
  height = 200,
  color = 'hsl(221.2 83.2% 53.3%)',
  formatValue = (v) => v.toString(),
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d, 'MMM d')}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatValue}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 6,
            fontSize: 12,
          }}
          labelFormatter={(l) => formatDate(l, 'MMM d, yyyy')}
          formatter={(v: number) => [formatValue(v), 'Value']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#colorValue)"
          dot={false}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
