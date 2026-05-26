import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const slaTable = [
  { metric: "Proxy Gateway Uptime", target: "99.9%", measurement: "Monthly", credit: "10% for <99.9%, 25% for <99.5%" },
  { metric: "API Response Time", target: "<200ms p95", measurement: "Daily", credit: "5% for >200ms sustained" },
  { metric: "Support Response (Critical)", target: "<15 minutes", measurement: "Per incident", credit: "Service credit on breach" },
  { metric: "Support Response (Standard)", target: "<4 hours", measurement: "Per incident", credit: "N/A" },
  { metric: "Data Processing", target: "Real-time", measurement: "Continuous", credit: "Pro-rated for delays >5min" },
];

export default function SLAPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Service Level Agreement</h1>
        <p className="text-lg text-muted-foreground">Our commitment to reliability and performance</p>
      </div>
      <Card className="glass-card mb-8">
        <CardContent className="p-8 text-center">
          <p className="text-6xl font-bold gradient-text mb-2">99.9%</p>
          <p className="text-lg text-muted-foreground">Guaranteed Uptime</p>
          <Badge className="mt-4">Enterprise SLA</Badge>
        </CardContent>
      </Card>
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs"><th className="text-left py-3 px-3">Metric</th><th className="text-left py-3 px-3">Target</th><th className="text-left py-3 px-3">Measurement</th><th className="text-left py-3 px-3">Service Credit</th></tr></thead>
              <tbody>
                {slaTable.map((row) => (
                  <tr key={row.metric} className="border-b border-border/50"><td className="py-3 px-3 font-medium text-foreground">{row.metric}</td><td className="py-3 px-3 text-primary font-mono">{row.target}</td><td className="py-3 px-3 text-muted-foreground">{row.measurement}</td><td className="py-3 px-3 text-muted-foreground text-xs">{row.credit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
