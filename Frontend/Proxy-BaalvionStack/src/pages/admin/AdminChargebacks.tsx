import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAbuseLogs } from "@/hooks/useAdmin";

type ChargebackStatus = "open" | "under_review" | "evidence_submitted" | "won" | "lost";
interface Chargeback { id: string; customerName: string; customerEmail: string; amount: number; currency: string; gateway: string; reason: string; riskScore: number; status: ChargebackStatus; evidenceDeadline: string; }

const initialChargebacks: Chargeback[] = [
  { id: "cb1", customerName: "John Smith", customerEmail: "john@example.com", amount: 89, currency: "USD", gateway: "stripe", reason: "Product not received", riskScore: 72, status: "open", evidenceDeadline: "2026-06-10" },
  { id: "cb2", customerName: "Priya Patel", customerEmail: "priya@example.com", amount: 499, currency: "USD", gateway: "razorpay", reason: "Unauthorized charge", riskScore: 45, status: "under_review", evidenceDeadline: "2026-06-08" },
  { id: "cb3", customerName: "Carlos Ruiz", customerEmail: "carlos@example.com", amount: 199, currency: "USD", gateway: "stripe", reason: "Service not as described", riskScore: 30, status: "won", evidenceDeadline: "2026-05-20" },
];

export default function AdminChargebacks() {
  const [chargebacks, setChargebacks] = useState<Chargeback[]>(initialChargebacks);
  const { data: abusePage } = useAdminAbuseLogs({ page: 1, pageSize: 50 });
  const abuseLogs = abusePage?.data ?? [];

  const riskColor = (score: number) => score >= 70 ? "text-destructive" : score >= 40 ? "text-warning" : "text-success";
  const statusIcon = (s: ChargebackStatus) => {
    switch (s) {
      case "won": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "lost": return <XCircle className="w-4 h-4 text-destructive" />;
      case "evidence_submitted": return <FileText className="w-4 h-4 text-primary" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const flaggedAccounts = abuseLogs.filter(l => !l.resolved && l.riskScore >= 50);

  return (
    <div className="space-y-6">
      <SEOHead title="Chargebacks & Fraud" description="Monitor chargebacks and fraud risk" />
      <div>
        <h1 className="text-2xl font-bold">Chargebacks & Fraud Monitoring</h1>
        <p className="text-muted-foreground">Track disputes, risk scores, and fraud indicators</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="py-4 px-5"><p className="text-2xl font-bold">{chargebacks.length}</p><p className="text-xs text-muted-foreground">Total Chargebacks</p></CardContent></Card>
        <Card><CardContent className="py-4 px-5"><p className="text-2xl font-bold">{chargebacks.filter(c => c.status === "open" || c.status === "under_review").length}</p><p className="text-xs text-muted-foreground">Active Disputes</p></CardContent></Card>
        <Card><CardContent className="py-4 px-5"><p className="text-2xl font-bold text-success">{chargebacks.filter(c => c.status === "won").length}</p><p className="text-xs text-muted-foreground">Won</p></CardContent></Card>
        <Card><CardContent className="py-4 px-5"><p className="text-2xl font-bold text-destructive">{chargebacks.filter(c => c.status === "lost").length}</p><p className="text-xs text-muted-foreground">Lost</p></CardContent></Card>
      </div>

      {/* Chargebacks Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Chargeback Cases</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Gateway</th>
                <th className="text-left p-4 font-medium">Reason</th>
                <th className="text-left p-4 font-medium">Risk</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Deadline</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chargebacks.map(cb => (
                <tr key={cb.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="p-4"><p className="font-medium">{cb.customerName}</p><p className="text-xs text-muted-foreground">{cb.customerEmail}</p></td>
                  <td className="p-4 font-medium">${cb.amount} {cb.currency}</td>
                  <td className="p-4 capitalize">{cb.gateway.replace("_", " ")}</td>
                  <td className="p-4 max-w-[200px] truncate">{cb.reason}</td>
                  <td className="p-4"><span className={cn("font-bold", riskColor(cb.riskScore))}>{cb.riskScore}</span></td>
                  <td className="p-4"><div className="flex items-center gap-1.5">{statusIcon(cb.status)}<span className="capitalize text-xs">{cb.status.replace("_", " ")}</span></div></td>
                  <td className="p-4 text-xs">{cb.evidenceDeadline}</td>
                  <td className="p-4">
                    {(cb.status === "open" || cb.status === "under_review") && (
                      <Button size="sm" variant="outline" onClick={() => setChargebacks(prev => prev.map(x => x.id === cb.id ? { ...x, status: "evidence_submitted" as const } : x))}>
                        Submit Evidence
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Auto-Flagged Accounts from Abuse Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Auto-Flagged Accounts</CardTitle>
          <CardDescription>Accounts flagged by risk score ≥50 from abuse monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          {flaggedAccounts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No accounts currently flagged</p>
          ) : (
            <div className="space-y-2">
              {flaggedAccounts.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="font-medium text-sm">{log.userId}</p>
                      <p className="text-xs text-muted-foreground">{log.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Risk: <span className={cn("font-bold", riskColor(log.riskScore))}>{log.riskScore}</span></span>
                    <span className="capitalize">{log.severity}</span>
                    <Button variant="destructive" size="sm">Suspend</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
