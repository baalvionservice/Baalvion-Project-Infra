import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const frameworks = [
  { name: "GDPR", region: "EU", status: "Compliant", details: "Full compliance with EU General Data Protection Regulation. DPA available on request." },
  { name: "CCPA", region: "US-CA", status: "Compliant", details: "California Consumer Privacy Act compliance with opt-out mechanisms." },
  { name: "SOC 2 Type II", region: "Global", status: "Certified", details: "Annual audit by independent third party. Report available under NDA." },
  { name: "ISO 27001", region: "Global", status: "Certified", details: "Information security management system certification." },
];

const reports = [
  { name: "SOC 2 Type II Report", type: "Audit Report", date: "Jan 2026" },
  { name: "Penetration Test Summary", type: "Security Assessment", date: "Dec 2025" },
  { name: "Data Processing Agreement", type: "Legal Document", date: "Nov 2025" },
  { name: "Privacy Impact Assessment", type: "Compliance", date: "Oct 2025" },
];

export default function CompliancePage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Compliance</h1>
        <p className="text-lg text-muted-foreground">Regulatory compliance & data governance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {frameworks.map((f) => (
          <Card key={f.name} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">{f.name}</span>
                <Badge>{f.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{f.details}</p>
              <Badge variant="outline" className="mt-3 text-xs">{f.region}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glass-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Compliance Reports</h3>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div><p className="text-sm font-medium text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.type} · {r.date}</p></div>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Download", description: `${r.name} download simulated.` })}><Download className="w-3 h-3 mr-1" />Download</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
