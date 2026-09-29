import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Scale, TrendingUp, Server, RefreshCw, Loader2, Receipt, AlertTriangle, FileDown, Percent } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useFinanceDashboard, useReconciliationRuns, useMarginHeatmap, useProviderCostModels,
  useRefunds, useRunReconciliation, useSnapshotProfitability, useDecideRefund,
  useUpsertProviderCostModel, useUpsertProviderContract, useIngestInfraCost, useAttributeInfra,
  useUpsertTaxRate, useAddCredit, useErpExport, useProviderSpendForecast,
} from "@/hooks/useAdmin";

const money = (n?: number) => `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const pct = (n?: number) => `${Math.round((Number(n) || 0) * 100)}%`;

export default function AdminFinance() {
  const { data: dash, isLoading } = useFinanceDashboard();
  const { data: runs } = useReconciliationRuns();
  const { data: heatmap } = useMarginHeatmap("org");
  const { data: costs } = useProviderCostModels();
  const { data: refunds } = useRefunds();
  const { data: forecast } = useProviderSpendForecast();
  const runRecon = useRunReconciliation();
  const snapshot = useSnapshotProfitability();
  const decideRefund = useDecideRefund();
  const upsertModel = useUpsertProviderCostModel();
  const upsertContract = useUpsertProviderContract();
  const ingestInfra = useIngestInfraCost();
  const attributeInfra = useAttributeInfra();
  const upsertTax = useUpsertTaxRate();
  const addCredit = useAddCredit();
  const erpExport = useErpExport();

  return (
    <div className="space-y-6">
      <SEOHead title="Financial Operations" description="Revenue intelligence, reconciliation, provider costs, profitability, tax, ledger and ERP export." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" /> Financial Operations</h1>
        <p className="text-muted-foreground">Revenue intelligence · reconciliation · provider cost · profitability · tax · ledger · ERP.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Stat label="Revenue" value={isLoading ? "…" : money(dash?.revenue)} icon={DollarSign} />
        <Stat label="Provider Cost" value={money(dash?.providerCost)} icon={Server} />
        <Stat label="Infra Cost" value={money(dash?.infraCost)} icon={Server} />
        <Stat label="Gross Margin" value={`${money(dash?.grossMargin)} (${pct(dash?.marginRatio)})`} icon={TrendingUp} tone={Number(dash?.marginRatio) < 0 ? "warning" : "success"} />
        <Stat label="Negative-Margin Accts" value={dash?.negativeMarginAccounts ?? 0} icon={AlertTriangle} tone={(dash?.negativeMarginAccounts ?? 0) > 0 ? "warning" : undefined} />
      </div>

      <Tabs defaultValue="reconciliation">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="reconciliation"><Scale className="w-4 h-4 mr-1" /> Reconciliation</TabsTrigger>
          <TabsTrigger value="profitability"><TrendingUp className="w-4 h-4 mr-1" /> Profitability</TabsTrigger>
          <TabsTrigger value="providers"><Server className="w-4 h-4 mr-1" /> Provider Costs</TabsTrigger>
          <TabsTrigger value="tax"><Percent className="w-4 h-4 mr-1" /> Infra & Tax</TabsTrigger>
          <TabsTrigger value="ops"><FileDown className="w-4 h-4 mr-1" /> Ledger & ERP</TabsTrigger>
          <TabsTrigger value="refunds"><Receipt className="w-4 h-4 mr-1" /> Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => runRecon.mutate()} disabled={runRecon.isPending}>
              {runRecon.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Run Usage Reconciliation
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Reconciliation Runs</CardTitle><CardDescription>Metered vs invoiced — detects lost events, over/under-billing.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(runs ?? []).length === 0 ? <Empty msg="No reconciliation runs yet." /> :
                (runs ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="text-sm"><Badge variant="secondary" className="mr-2">{r.kind}</Badge><span className="text-muted-foreground">{new Date(r.period_start).toLocaleDateString()} → {new Date(r.period_end).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><span className="text-sm">{r.discrepancies} discrepancies · {Number(r.max_variance).toFixed(1)}% max</span><Badge variant={r.status === "clean" ? "success" : "warning"}>{r.status}</Badge></div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => snapshot.mutate()} disabled={snapshot.isPending}>
              {snapshot.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <TrendingUp className="w-4 h-4 mr-1" />} Recompute Snapshot
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Margin Heatmap (by org)</CardTitle><CardDescription>Net margin = revenue (ex-tax) − provider cost − infra cost.</CardDescription></CardHeader>
            <CardContent>
              {(heatmap ?? []).length === 0 ? <Empty msg="No profitability snapshots yet." /> : (
                <div className="space-y-1 text-sm">
                  <div className="grid grid-cols-5 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium"><span className="col-span-2">Org</span><span>Revenue</span><span>Net Margin</span><span>Ratio</span></div>
                  {(heatmap ?? []).map((m) => (
                    <div key={m.entity_id} className="grid grid-cols-5 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <code className="col-span-2 font-mono text-xs truncate">{m.entity_id}</code>
                      <span>{money(m.revenue)}</span>
                      <span className={Number(m.net_margin) < 0 ? "text-destructive font-medium" : ""}>{money(m.net_margin)}</span>
                      <Badge variant={Number(m.margin_ratio) < 0 ? "destructive" : Number(m.margin_ratio) < 0.2 ? "warning" : "success"} className="w-fit">{pct(m.margin_ratio)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Cost Models</CardTitle><CardDescription>per-GB / per-IP / ASN / geo / concurrency.</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {(costs ?? []).length === 0 ? <Empty msg="No cost models." /> :
                  (costs ?? []).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30">
                      <span>{c.provider} <Badge variant="secondary" className="ml-1">{c.model_type}{c.dim_key ? `:${c.dim_key}` : ""}</Badge></span>
                      <span className="font-mono">{money(c.unit_cost)}</span>
                    </div>
                  ))}
                <CostModelForm onSave={(d) => upsertModel.mutate(d)} pending={upsertModel.isPending} />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Provider Spend</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(dash?.providers ?? []).length === 0 ? <Empty msg="No provider usage yet." /> :
                    (dash?.providers ?? []).map((p) => (
                      <div key={p.provider} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30"><span className="font-medium">{p.provider}</span><span className="text-muted-foreground">{Number(p.gb).toFixed(1)} GB · {money(p.cost)}</span></div>
                    ))}
                  <ContractForm onSave={(d) => upsertContract.mutate(d)} pending={upsertContract.isPending} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>30-day Provider Spend Forecast</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(forecast ?? []).length === 0 ? <Empty msg="No forecast yet." /> :
                    (forecast ?? []).map((f) => (
                      <div key={f.provider} className="flex items-center justify-between text-sm px-3 py-2 rounded bg-secondary/30"><span>{f.provider}</span><span className="font-mono">{money(f.projectedCost)}</span></div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tax">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Infrastructure Costs</CardTitle><CardDescription>Ingest cloud spend, then attribute to orgs.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <InfraCostForm onSave={(d) => ingestInfra.mutate(d)} pending={ingestInfra.isPending} />
                <Button variant="outline" size="sm" className="w-full" onClick={() => attributeInfra.mutate()} disabled={attributeInfra.isPending}>
                  {attributeInfra.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Attribute Infra Cost → Orgs
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tax Rates</CardTitle><CardDescription>Jurisdiction-aware GST / VAT / sales tax.</CardDescription></CardHeader>
              <CardContent><TaxRateForm onSave={(d) => upsertTax.mutate(d)} pending={upsertTax.isPending} /></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ops">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Add Prepaid Credit</CardTitle><CardDescription>Append-only ledger entry.</CardDescription></CardHeader>
              <CardContent><CreditForm onSave={(d) => addCredit.mutate(d)} pending={addCredit.isPending} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>ERP Export</CardTitle><CardDescription>Balanced double-entry journals for this period.</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {["csv", "quickbooks", "xero", "netsuite"].map((sys) => (
                  <Button key={sys} size="sm" variant="outline" className="capitalize" onClick={() => erpExport.mutate(sys)} disabled={erpExport.isPending}>
                    <FileDown className="w-4 h-4 mr-1" /> {sys}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="refunds">
          <Card>
            <CardHeader><CardTitle>Refunds</CardTitle><CardDescription>Risk-scored; pending refunds need approval.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(refunds ?? []).length === 0 ? <Empty msg="No refunds." /> :
                (refunds ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="text-sm">
                      <code className="font-mono text-xs">{r.org_id.slice(0, 10)}</code>
                      <span className="ml-2 font-medium">{money(r.amount)}</span>
                      {r.risk_score != null && <Badge variant={r.risk_score >= 60 ? "destructive" : r.risk_score >= 25 ? "warning" : "success"} className="ml-2">risk {Math.round(r.risk_score)}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "destructive" : "warning"}>{r.status}</Badge>
                      {r.status === "pending" && (<>
                        <Button size="sm" variant="ghost" onClick={() => decideRefund.mutate({ id: r.id, decision: "approve" })}>Approve</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => decideRefund.mutate({ id: r.id, decision: "reject" })}>Reject</Button>
                      </>)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── inline forms ────────────────────────────────────────────────────────────────
function CostModelForm({ onSave, pending }: { onSave: (d: { provider: string; modelType: string; dimKey?: string; unitCost: number }) => void; pending: boolean }) {
  const [f, setF] = useState({ provider: "", modelType: "per_gb", dimKey: "", unitCost: 0 });
  return (
    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
      <Field label="Provider"><Input value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} className="h-8" /></Field>
      <Field label="Model (per_gb|per_ip|geo)"><Input value={f.modelType} onChange={(e) => setF({ ...f, modelType: e.target.value })} className="h-8" /></Field>
      <Field label="Dim key (country/asn)"><Input value={f.dimKey} onChange={(e) => setF({ ...f, dimKey: e.target.value })} className="h-8" /></Field>
      <Field label="Unit cost ($)"><Input type="number" step="0.01" value={f.unitCost} onChange={(e) => setF({ ...f, unitCost: Number(e.target.value) })} className="h-8" /></Field>
      <Button size="sm" className="col-span-2" disabled={pending || !f.provider} onClick={() => onSave(f)}>Save cost model</Button>
    </div>
  );
}
function ContractForm({ onSave, pending }: { onSave: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [f, setF] = useState({ provider: "", monthlyCommit: 0, includedGb: 0, overagePerGb: 0, minCharge: 0 });
  return (
    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
      <Field label="Provider"><Input value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} className="h-8" /></Field>
      <Field label="Monthly commit ($)"><Input type="number" value={f.monthlyCommit} onChange={(e) => setF({ ...f, monthlyCommit: Number(e.target.value) })} className="h-8" /></Field>
      <Field label="Included GB"><Input type="number" value={f.includedGb} onChange={(e) => setF({ ...f, includedGb: Number(e.target.value) })} className="h-8" /></Field>
      <Field label="Overage $/GB"><Input type="number" step="0.01" value={f.overagePerGb} onChange={(e) => setF({ ...f, overagePerGb: Number(e.target.value) })} className="h-8" /></Field>
      <Button size="sm" className="col-span-2" disabled={pending || !f.provider} onClick={() => onSave(f)}>Save contract</Button>
    </div>
  );
}
function InfraCostForm({ onSave, pending }: { onSave: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [f, setF] = useState({ category: "k8s", region: "", amount: 0, periodStart: "", periodEnd: "" });
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Category (k8s|bandwidth|edge)"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="h-8" /></Field>
      <Field label="Region"><Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} className="h-8" /></Field>
      <Field label="Amount ($)"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className="h-8" /></Field>
      <Field label="Period start"><Input type="date" value={f.periodStart} onChange={(e) => setF({ ...f, periodStart: e.target.value })} className="h-8" /></Field>
      <Field label="Period end"><Input type="date" value={f.periodEnd} onChange={(e) => setF({ ...f, periodEnd: e.target.value })} className="h-8" /></Field>
      <Button size="sm" className="col-span-2" disabled={pending || !f.amount} onClick={() => onSave(f)}>Ingest infra cost</Button>
    </div>
  );
}
function TaxRateForm({ onSave, pending }: { onSave: (d: { country: string; region?: string; taxType: string; rate: number; b2bReverse?: boolean }) => void; pending: boolean }) {
  const [f, setF] = useState({ country: "", region: "", taxType: "gst", rate: 0.18 });
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Country (ISO2)"><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} className="h-8" /></Field>
      <Field label="Region/state"><Input value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} className="h-8" /></Field>
      <Field label="Type (gst|vat|sales)"><Input value={f.taxType} onChange={(e) => setF({ ...f, taxType: e.target.value })} className="h-8" /></Field>
      <Field label="Rate (0–1)"><Input type="number" step="0.01" value={f.rate} onChange={(e) => setF({ ...f, rate: Number(e.target.value) })} className="h-8" /></Field>
      <Button size="sm" className="col-span-2" disabled={pending || !f.country} onClick={() => onSave(f)}>Save tax rate</Button>
    </div>
  );
}
function CreditForm({ onSave, pending }: { onSave: (d: { orgId: string; amount: number; reason?: string }) => void; pending: boolean }) {
  const [f, setF] = useState({ orgId: "", amount: 0, reason: "manual_credit" });
  return (
    <div className="space-y-2">
      <Field label="Organization ID"><Input value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })} className="h-8" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Amount ($)"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className="h-8" /></Field>
        <Field label="Reason"><Input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className="h-8" /></Field>
      </div>
      <Button size="sm" className="w-full" disabled={pending || !f.orgId || !f.amount} onClick={() => onSave(f)}>Add credit</Button>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof DollarSign; tone?: "success" | "warning" }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{value}</p></div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </CardContent></Card>
  );
}
const Empty = ({ msg }: { msg: string }) => <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>
);
