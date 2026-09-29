import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Gavel, FileSearch, Globe, Loader2, RefreshCw } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useModerationCases, useKycQueue, useComplianceReport, useDestinationIntel,
  useTransitionCase, useDecideKyc, useRefreshIntel,
} from "@/hooks/useAdmin";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
  OPEN: "warning", INVESTIGATING: "info", ESCALATED: "destructive", ACTION_TAKEN: "info",
  RESOLVED: "success", REJECTED: "secondary",
  approved: "success", rejected: "destructive", pending: "warning", review: "info",
};

export default function AdminTrustSafety() {
  const { data: cases, isLoading: casesLoading } = useModerationCases();
  const { data: kyc } = useKycQueue();
  const { data: report } = useComplianceReport();
  const { data: intel } = useDestinationIntel();
  const transition = useTransitionCase();
  const decideKyc = useDecideKyc();
  const refreshIntel = useRefreshIntel();
  const [tab, setTab] = useState("moderation");

  const stat = (label: string, value: number | string, tone = "") => (
    <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className={`text-2xl font-bold ${tone}`}>{value}</div></CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <SEOHead title="Trust & Safety" description="Moderation, KYC review, threat intel and compliance." />
      <div>
        <h1 className="text-2xl font-bold">Trust &amp; Safety</h1>
        <p className="text-muted-foreground">Abuse moderation, KYC/AML review, threat intelligence and compliance.</p>
      </div>

      {/* Compliance summary */}
      <div className="grid gap-4 md:grid-cols-5">
        {stat("Open cases", report?.moderation.open ?? 0, "text-warning")}
        {stat("KYC pending", report?.kyc.open ?? 0)}
        {stat("KYC rejected", report?.kyc.rejected ?? 0, "text-destructive")}
        {stat("Active enforcement", report?.enforcement.active ?? 0)}
        {stat("Audit entries", report?.auditEntries.n ?? 0)}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="moderation"><Gavel className="w-4 h-4 mr-1" /> Moderation</TabsTrigger>
          <TabsTrigger value="kyc"><ShieldCheck className="w-4 h-4 mr-1" /> KYC / AML</TabsTrigger>
          <TabsTrigger value="intel"><Globe className="w-4 h-4 mr-1" /> Threat Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileSearch className="w-5 h-5 text-primary" /> Moderation Queue</CardTitle>
              <CardDescription>Abuse reports, DMCA, law-enforcement & disputes.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {casesLoading ? <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" /></div> :
                (cases ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No moderation cases.</p> :
                (cases ?? []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="min-w-0">
                      <span className="font-medium">{c.type}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.subject || c.source || c.id.slice(0, 8)}</span>
                      <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[c.status] || "secondary"}>{c.status}</Badge>
                      {["OPEN", "INVESTIGATING", "ESCALATED"].includes(c.status) && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: c.id, status: "INVESTIGATING" })}>Investigate</Button>
                          <Button size="sm" variant="destructive" onClick={() => transition.mutate({ id: c.id, status: "RESOLVED", note: "actioned" })}>Resolve</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc">
          <Card>
            <CardHeader><CardTitle>KYC / KYB Review</CardTitle><CardDescription>Sanctions/PEP flags + manual decisions.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(kyc ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No verifications.</p> :
                (kyc ?? []).map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div>
                      <span className="font-medium">{k.subject_type}</span>
                      <span className="text-xs text-muted-foreground ml-2">{k.provider} · {k.country?.toUpperCase() || "—"}</span>
                      <div className="flex gap-1 mt-1">
                        {k.sanctions_hit && <Badge variant="destructive">SANCTIONS</Badge>}
                        {k.pep_hit && <Badge variant="warning">PEP</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[k.status] || "secondary"}>{k.status}</Badge>
                      {["pending", "review"].includes(k.status) && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => decideKyc.mutate({ id: k.id, decision: "approve" })}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => decideKyc.mutate({ id: k.id, decision: "reject" })}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intel">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div><CardTitle>Destination Threat Intel</CardTitle><CardDescription>Malware / phishing / botnet / TOR / sanctioned indicators.</CardDescription></div>
              <Button size="sm" variant="outline" onClick={() => refreshIntel.mutate()} disabled={refreshIntel.isPending}>
                {refreshIntel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-1">Refresh feeds</span>
              </Button>
            </CardHeader>
            <CardContent>
              {(intel ?? []).length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No indicators loaded. Refresh feeds.</p> : (
                <div className="space-y-1 text-sm">
                  {(intel ?? []).slice(0, 100).map((d, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <code className="font-mono text-xs truncate">{d.indicator}</code>
                      <Badge variant="destructive" className="w-fit">{d.category}</Badge>
                      <span className="text-muted-foreground">{d.source}</span>
                      <span className="text-xs text-muted-foreground">{d.kind}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
