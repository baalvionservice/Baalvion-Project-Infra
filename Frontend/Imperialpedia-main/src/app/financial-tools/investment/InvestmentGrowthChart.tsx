'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartPoint {
  year: number | string;
  balance: number;
}

/**
 * Split out of InvestmentClient.tsx and dynamically imported there — recharts
 * is heavy (~100KB gzipped) and was the last static (non-dynamic) import of it
 * left in the app, which was enough for webpack's automatic chunk splitting to
 * hoist it into a shared chunk loaded on every page site-wide, including ones
 * with no chart at all. Matches the pattern already used for QuoteChart and
 * ArticleInlineChartClient.
 */
export function InvestmentGrowthChart({
  data,
  formatCurrency,
}: {
  data: ChartPoint[];
  formatCurrency: (val: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1d4fc4" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#1d4fc4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="year" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10 }} />
        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
        <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '12px' }} formatter={(value: number) => [formatCurrency(value), 'Capital Maturity']} />
        <Area type="monotone" dataKey="balance" stroke="#1d4fc4" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
