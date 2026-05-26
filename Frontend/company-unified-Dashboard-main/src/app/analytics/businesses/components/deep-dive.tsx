
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import analyticsData from '@/lib/data/analytics-businesses.json';

interface DeepDiveProps {
  businessId: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DeepDive({ businessId }: DeepDiveProps) {
  const deepDiveData = analyticsData.deepDive[businessId as keyof typeof analyticsData.deepDive];

  if (!deepDiveData) {
    return <div className="p-8 text-center text-muted-foreground">Detailed data not available for this business.</div>;
  }

  const { revenueTrend, expenseBreakdown, revenueSources, monthlyMetrics } = deepDiveData;

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>12-Month Revenue Trend</CardTitle>
            <CardDescription>In Millions (local currency)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}M`} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueSources.map((source) => (
                <div key={source.source}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="font-medium">{source.source}</span>
                    <span className="text-muted-foreground">${source.revenue.toLocaleString()}</span>
                  </div>
                  <Progress value={source.percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyMetrics.map(metric => (
                  <TableRow key={metric.month}>
                    <TableCell>{metric.month}</TableCell>
                    <TableCell>{metric.revenue}</TableCell>
                    <TableCell>{metric.profit}</TableCell>
                    <TableCell className="text-green-500">{metric.growth}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
