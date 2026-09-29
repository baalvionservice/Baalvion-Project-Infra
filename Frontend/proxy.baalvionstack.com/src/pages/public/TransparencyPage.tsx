import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Government Data Requests", value: "0", period: "H2 2025" },
  { label: "Law Enforcement Requests", value: "3", period: "H2 2025" },
  { label: "Requests Complied With", value: "2", period: "H2 2025" },
  { label: "National Security Letters", value: "0", period: "H2 2025" },
];

const entries = [
  { date: "2025-12-15", type: "Law Enforcement", jurisdiction: "United States", outcome: "Partial compliance", details: "Metadata only; no traffic content disclosed." },
  { date: "2025-11-02", type: "Law Enforcement", jurisdiction: "Germany", outcome: "Complied", details: "User billing records provided per valid court order." },
  { date: "2025-08-18", type: "Civil Subpoena", jurisdiction: "United States", outcome: "Challenged", details: "Request deemed overbroad; successfully quashed." },
];

export default function TransparencyPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Transparency Report</h1>
        <p className="text-lg text-muted-foreground">Our commitment to user privacy and openness</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card text-center">
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              <Badge variant="outline" className="mt-2 text-xs">{s.period}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Request Log</h3>
          <div className="space-y-4">
            {entries.map((e, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2"><Badge variant="outline">{e.type}</Badge><span className="text-xs text-muted-foreground">{e.jurisdiction}</span></div>
                  <div className="flex items-center gap-2"><Badge variant={e.outcome === "Complied" ? "default" : e.outcome === "Challenged" ? "secondary" : "outline"}>{e.outcome}</Badge><span className="text-xs text-muted-foreground">{e.date}</span></div>
                </div>
                <p className="text-sm text-muted-foreground">{e.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
