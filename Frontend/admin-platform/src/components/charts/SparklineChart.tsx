'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data:       Array<{ value: number }>;
  color?:     string;
  height?:    number;
  showTooltip?: boolean;
}

export default function SparklineChart({ data, color = '#6366f1', height = 36, showTooltip = false }: Props) {
  if (!data.length) return <div style={{ height }} className="w-full" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        {showTooltip && <Tooltip contentStyle={{ fontSize: 11 }} />}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
