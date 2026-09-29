import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { adminRevenueApi } from "@/lib/adminApiClient";

const expansionRevenue = [
  { month: "Sep", newMRR: 18200, expansionMRR: 4800, churnedMRR: -6200, netNew: 16800 },
  { month: "Oct", newMRR: 22400, expansionMRR: 5600, churnedMRR: -5800, netNew: 22200 },
  { month: "Nov", newMRR: 25100, expansionMRR: 7200, churnedMRR: -5200, netNew: 27100 },
  { month: "Dec", newMRR: 28300, expansionMRR: 8900, churnedMRR: -4900, netNew: 32300 },
  { month: "Jan", newMRR: 31200, expansionMRR: 10400, churnedMRR: -5100, netNew: 36500 },
  { month: "Feb", newMRR: 29800, expansionMRR: 11200, churnedMRR: -4800, netNew: 36200 },
];

const planMigration = [
  { month: "Sep", freeToStarter: 45, starterToPro: 22, proToEnterprise: 8, downgrades: 12 },
  { month: "Oct", freeToStarter: 52, starterToPro: 28, proToEnterprise: 11, downgrades: 9 },
  { month: "Nov", freeToStarter: 48, starterToPro: 31, proToEnterprise: 14, downgrades: 7 },
  { month: "Dec", freeToStarter: 61, starterToPro: 35, proToEnterprise: 12, downgrades: 10 },
  { month: "Jan", freeToStarter: 58, starterToPro: 38, proToEnterprise: 16, downgrades: 8 },
  { month: "Feb", freeToStarter: 55, starterToPro: 42, proToEnterprise: 18, downgrades: 6 },
];

const cellColor = (val: number | null) => {
  if (val === null) return "bg-muted/20";
  if (val >= 90) return "bg-success/30 text-success";
  if (val >= 80) return "bg-success/15 text-success";
  if (val >= 70) return "bg-warning/20 text-warning";
  return "bg-destructive/20 text-destructive";
};

export default function AdminCohortRetention() {
  const { data: cohortData } = useQuery({
    queryKey: ["admin", "cohort-retention"],
    queryFn: () => adminRevenueApi.getCohortRetention(),
  });
  const cohorts = cohortData?.cohorts ?? [];
  const maxMonths = cohorts.reduce((m, c) => Math.max(m, c.retention?.length ?? 0), 0);
  const monthCols = Array.from({ length: Math.max(maxMonths, 1) }, (_, i) => i);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Cohort Retention & Revenue</h1>
        <p className="text-muted-foreground mt-1">Retention heatmap, expansion revenue & plan migration</p>
      </div>

      {/* Retention Heatmap (live) */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Cohort Retention Heatmap (%)</CardTitle></CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cohort data yet — retention builds up as customers age into their second month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">Cohort</th>
                    {monthCols.map((i) => <th key={i} className="text-center p-3 font-medium">M{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((row) => (
                    <tr key={row.month} className="border-b border-border/50">
                      <td className="p-3 font-medium">{row.month}</td>
                      {monthCols.map((i) => {
                        const val = row.retention?.[i] ?? null;
                        return (
                          <td key={i} className="p-1 text-center">
                            <div className={`rounded-lg p-2 font-mono text-sm font-bold ${cellColor(val)}`}>
                              {val !== null && val !== undefined ? `${Math.round(val)}%` : "—"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expansion Revenue */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Revenue Composition (New vs Expansion vs Churned)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expansionRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => `$${Math.abs(v).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="newMRR" fill="hsl(199,89%,48%)" radius={[4, 4, 0, 0]} name="New MRR" />
              <Bar dataKey="expansionMRR" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} name="Expansion MRR" />
              <Bar dataKey="churnedMRR" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} name="Churned MRR" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Migration */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Plan Migration Flow</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={planMigration}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <Area type="monotone" dataKey="freeToStarter" stroke="hsl(199,89%,48%)" fill="hsl(199,89%,48%)" fillOpacity={0.2} name="Free→Starter" />
              <Area type="monotone" dataKey="starterToPro" stroke="hsl(142,71%,45%)" fill="hsl(142,71%,45%)" fillOpacity={0.2} name="Starter→Pro" />
              <Area type="monotone" dataKey="proToEnterprise" stroke="hsl(38,92%,50%)" fill="hsl(38,92%,50%)" fillOpacity={0.2} name="Pro→Enterprise" />
              <Area type="monotone" dataKey="downgrades" stroke="hsl(0,84%,60%)" fill="hsl(0,84%,60%)" fillOpacity={0.2} name="Downgrades" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}