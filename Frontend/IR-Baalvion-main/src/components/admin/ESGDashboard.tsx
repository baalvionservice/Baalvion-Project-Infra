
"use client";

import { EsgMetric } from "@/types/intelligence";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  Legend
} from 'recharts';
import { ShieldCheck, Leaf, Users, Gavel } from "lucide-react";

interface ESGDashboardProps {
  metrics: EsgMetric[];
  globalScore: number;
}

export function ESGDashboard({ metrics, globalScore }: ESGDashboardProps) {
  // Aggregate data for radar
  const avgSocial = metrics.reduce((a, b) => a + b.socialImpact, 0) / metrics.length;
  const avgCompliance = metrics.reduce((a, b) => a + b.complianceScore, 0) / metrics.length;
  const avgEnvironmental = metrics.reduce((a, b) => a + b.score, 0) / metrics.length;

  const radarData = [
    { subject: 'Environmental', A: avgEnvironmental, fullMark: 100 },
    { subject: 'Social Impact', A: avgSocial, fullMark: 100 },
    { subject: 'Compliance', A: avgCompliance, fullMark: 100 },
    { subject: 'Governance', A: 85, fullMark: 100 },
    { subject: 'Ethical Supply', A: 78, fullMark: 100 },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold tracking-tighter">{globalScore}/100</div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Institutional ESG Baseline</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold tracking-tighter">A+</div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Compliance Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold tracking-tighter">Low</div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Risk Exposure</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">ESG Performance Facets</CardTitle>
            <CardDescription className="text-xs">Weighted distribution across core institutional benchmarks.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Radar
                  name="Baalvion Baseline"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '10px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Carbon Intensity by SPV</CardTitle>
            <CardDescription className="text-xs">Tons CO2e compared across strategic asset vehicles.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="spvName" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '10px' }}
                />
                <Bar dataKey="carbonFootprint" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
