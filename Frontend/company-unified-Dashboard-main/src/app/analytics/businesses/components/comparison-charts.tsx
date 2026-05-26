"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import analyticsData from "@/lib/data/analytics-businesses.json";
import businessesData from "@/lib/data/businesses";

const comparisonData = analyticsData.comparison;
const businessNames = businessesData.map((b) => b.name);
const businessColors: Record<string, string> = {
  "TechCorp India": "hsl(var(--chart-1))",
  "Baalvion Media UK": "hsl(var(--chart-2))",
  "RetailChain UAE": "hsl(var(--chart-3))",
  "FinanceHub USA": "hsl(var(--chart-4))",
  "DigitalAgency SG": "hsl(var(--chart-5))",
};

export default function ComparisonCharts() {
  const profitMarginData = [...comparisonData.profitMargins].sort(
    (a, b) => a.margin - b.margin
  );
  const growthRatesData = [...comparisonData.growthRates].sort(
    (a, b) => a.growth - b.growth
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Comparison (Last 3 Months)</CardTitle>
          <CardDescription>In Millions (Local Currency)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData.revenueLast3Months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip formatter={(value, name) => [`${value}M`, name]} />
              <Legend />
              {businessNames.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={businessColors[name]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Growth Rate (MoM)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthRatesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  unit="%"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar
                  dataKey="growth"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitMarginData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  unit="%"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar
                  dataKey="margin"
                  fill="hsl(var(--chart-4))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
