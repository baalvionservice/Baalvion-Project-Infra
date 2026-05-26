"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Info,
  DollarSign,
  Globe,
  Activity,
  Zap,
  BarChart3,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Placeholder data generation for charts
const generateMonthlyData = () => [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 500 },
  { name: "Jun", value: 900 },
];

const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b"];

interface EntityAnalyticsProps {
  type: string;
  slug: string;
}

/**
 * Global Entity Analytics Panel.
 * Specialized hub for visualizing node-level performance and telemetry.
 */
export const EntityAnalytics = ({ type, slug }: EntityAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Simulate data ingestion delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 justify-center text-muted-foreground animate-pulse">
        <Loader2 className="h-5 w-5 animate-spin" />
        <Text variant="caption" className="font-bold uppercase tracking-widest">
          Loading node analytics...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 py-12 justify-center text-destructive">
        <AlertCircle className="h-5 w-5" />
        <Text variant="caption" className="font-bold uppercase tracking-widest">
          Analytics unavailable at this time.
        </Text>
      </div>
    );
  }

  const getMetrics = () => {
    switch (type) {
      case "country":
        return [
          {
            label: "GDP Growth",
            value: "+2.4%",
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Population Index",
            value: "1.2B",
            icon: Users,
            color: "text-primary",
          },
          {
            label: "Trade Balance",
            value: "+$45B",
            icon: DollarSign,
            color: "text-secondary",
          },
          {
            label: "HDI Score",
            value: "0.92",
            icon: Activity,
            color: "text-amber-500",
          },
        ];
      case "company":
        return [
          {
            label: "Revenue Velocity",
            value: "+15%",
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Employee Growth",
            value: "+850",
            icon: Users,
            color: "text-secondary",
          },
          {
            label: "Market Cap Index",
            value: "2.1T",
            icon: BarChart3,
            color: "text-primary",
          },
          {
            label: "R&D Spend",
            value: "$12B",
            icon: Zap,
            color: "text-amber-500",
          },
        ];
      case "industry":
        return [
          {
            label: "Sector CAGR",
            value: "12.5%",
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Global Players",
            value: "450+",
            icon: Globe,
            color: "text-secondary",
          },
          {
            label: "Market Reach",
            value: "Global",
            icon: Activity,
            color: "text-primary",
          },
          {
            label: "Innovation Score",
            value: "88/100",
            icon: Zap,
            color: "text-amber-500",
          },
        ];
      case "technology":
        return [
          {
            label: "Adoption Rate",
            value: "42%",
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Patent Node Count",
            value: "1,240",
            icon: Layers,
            color: "text-primary",
          },
          {
            label: "Market Impact",
            value: "Disruptive",
            icon: Zap,
            color: "text-amber-500",
          },
          {
            label: "Active Implementation",
            value: "85%",
            icon: Activity,
            color: "text-secondary",
          },
        ];
      default:
        return [];
    }
  };

  const metrics = getMetrics();

  return (
    <div className="space-y-8 mt-12 animate-in fade-in duration-1000">
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <Text variant="h3" className="font-bold tracking-tight">
            Analytics & Insights
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
          >
            High-Fidelity Telemetry Hub
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <Card
            key={idx}
            className="glass-card border-none bg-card/30 hover:border-primary/20 transition-all group shadow-xl"
          >
            <CardContent className="p-6 space-y-2">
              <div className="flex justify-between items-start">
                <Text
                  variant="label"
                  className="text-[10px] opacity-50 font-bold uppercase tracking-widest"
                >
                  {m.label}
                </Text>
                <m.icon className={cn("h-4 w-4", m.color)} />
              </div>
              <div className="text-2xl font-bold tracking-tighter group-hover:text-primary transition-colors">
                {m.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
              Trajectory Audit
            </CardTitle>
            <CardDescription className="text-xs">
              Historical performance and projected variance across the index.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateMonthlyData()}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8272F2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8272F2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C1822",
                    border: "1px solid #ffffff10",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "#8272F2" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8272F2"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-6">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-secondary">
              Taxonomy Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Comparative weight across key intelligence clusters.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateMonthlyData()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "#1C1822",
                    border: "1px solid #ffffff10",
                    borderRadius: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#69B9FF"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 flex items-start gap-4">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed italic"
          >
            // TODO: Connect to AI insights API
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed italic"
          >
            // TODO: Fetch real-time data metrics
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed italic"
          >
            // TODO: Add dynamic chart updates based on AI reports
          </Text>
        </div>
      </div>
    </div>
  );
};
