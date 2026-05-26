import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const retentionMatrix = [
  { cohort: "Sep '24", m0: 100, m1: 88, m2: 82, m3: 78, m4: 75, m5: 72 },
  { cohort: "Oct '24", m0: 100, m1: 91, m2: 85, m3: 80, m4: 77, m5: null },
  { cohort: "Nov '24", m0: 100, m1: 89, m2: 84, m3: 81, m4: null, m5: null },
  { cohort: "Dec '24", m0: 100, m1: 92, m2: 87, m3: null, m4: null, m5: null },
  { cohort: "Jan '25", m0: 100, m1: 90, m2: null, m3: null, m4: null, m5: null },
  { cohort: "Feb '25", m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null },
];

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
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Cohort Retention & Revenue</h1>
        <p className="text-muted-foreground mt-1">Retention heatmap, expansion revenue & plan migration</p>
      </div>

      {/* Retention Heatmap */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Cohort Retention Heatmap (%)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Cohort</th>
                  <th className="text-center p-3 font-medium">M0</th>
                  <th className="text-center p-3 font-medium">M1</th>
                  <th className="text-center p-3 font-medium">M2</th>
                  <th className="text-center p-3 font-medium">M3</th>
                  <th className="text-center p-3 font-medium">M4</th>
                  <th className="text-center p-3 font-medium">M5</th>
                </tr>
              </thead>
              <tbody>
                {retentionMatrix.map((row) => (
                  <tr key={row.cohort} className="border-b border-border/50">
                    <td className="p-3 font-medium">{row.cohort}</td>
                    {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5].map((val, i) => (
                      <td key={i} className="p-1 text-center">
                        <div className={`rounded-lg p-2 font-mono text-sm font-bold ${cellColor(val)}`}>
                          {val !== null ? `${val}%` : "—"}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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