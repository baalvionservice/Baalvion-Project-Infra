import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Shield, FileText, Trash2, AlertTriangle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";

const exportItems = [
  { label: "Usage Logs", desc: "Download proxy usage history", icon: FileText, format: "CSV" },
  { label: "API Logs", desc: "Download API request logs", icon: Database, format: "JSON" },
  { label: "Account Data", desc: "Export all account data (GDPR)", icon: Download, format: "ZIP" },
];

const complianceItems = [
  { label: "GDPR Data Request", desc: "Request a copy of all personal data", action: "Request" },
  { label: "Data Deletion", desc: "Request deletion of all personal data", action: "Request Deletion", destructive: true },
  { label: "Cookie Preferences", desc: "Manage cookie consent settings", action: "Manage" },
  { label: "Data Processing", desc: "View data processing agreements", action: "View DPA" },
];

export default function DataCenter() {
  const triggerExport = (label: string) => {
    toast.success(`${label} export started. You'll receive a download link shortly.`);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Data & Compliance" description="Export data and manage compliance settings." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="w-6 h-6 text-primary" />Data & Compliance</h1>
        <p className="text-muted-foreground">Export your data and manage privacy controls.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Data Export</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {exportItems.map(item => (
            <Card key={item.label}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => triggerExport(item.label)}>
                  <Download className="w-4 h-4 mr-1" />Export {item.format}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Compliance & Privacy</h2>
        <div className="space-y-3">
          {complianceItems.map(item => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {item.destructive && <AlertTriangle className="w-5 h-5 text-destructive" />}
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Button variant={item.destructive ? "destructive" : "outline"} size="sm" onClick={() => toast.success(`${item.label} processed`)}>
                  {item.destructive && <Trash2 className="w-4 h-4 mr-1" />}
                  {item.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Compliance Badges</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2"><Shield className="w-4 h-4 text-accent" />SOC 2 Type II</Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2"><Shield className="w-4 h-4 text-primary" />GDPR Compliant</Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2"><Shield className="w-4 h-4 text-warning" />ISO 27001</Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm gap-2"><Shield className="w-4 h-4 text-accent" />CCPA Compliant</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
