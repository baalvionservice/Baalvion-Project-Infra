import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Store, Users, Trophy, Wallet, Plus, Loader2, CheckCircle2, Package, Tag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useResellers, useChannelLeaderboard, useChannelRevenue, useAdminPayouts,
  useApproveReseller, useApprovePayout, useProcessPayouts, useCreateAffiliate,
  useCreateReseller, useUpsertProduct, useUpsertPromotion,
} from "@/hooks/useAdmin";

const money = (n?: number) => `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function AdminMarketplace() {
  const { data: resellers } = useResellers();
  const { data: leaderboard } = useChannelLeaderboard();
  const { data: revenue } = useChannelRevenue();
  const { data: payouts } = useAdminPayouts();
  const approveReseller = useApproveReseller();
  const approvePayout = useApprovePayout();
  const processPayouts = useProcessPayouts();
  const createAffiliate = useCreateAffiliate();
  const createReseller = useCreateReseller();
  const upsertProduct = useUpsertProduct();
  const upsertPromotion = useUpsertPromotion();

  const pending = (resellers ?? []).filter((r) => r.status === "pending").length;
  const holds = (payouts ?? []).filter((p) => p.status === "hold").length;

  return (
    <div className="space-y-6">
      <SEOHead title="Marketplace & Channel" description="Resellers, affiliates, channel revenue, payouts and the marketplace catalog." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="w-6 h-6 text-primary" /> Marketplace & Channel</h1>
        <p className="text-muted-foreground">Reseller network · affiliates · channel revenue · payouts.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="Channel Revenue" value={money(revenue?.total)} icon={Trophy} />
        <Stat label="Resellers" value={(resellers ?? []).length} icon={Users} />
        <Stat label="Pending Approval" value={pending} icon={Users} tone={pending ? "warning" : undefined} />
        <Stat label="Payouts on Hold" value={holds} icon={Wallet} tone={holds ? "warning" : undefined} />
      </div>

      <Tabs defaultValue="resellers">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="resellers"><Users className="w-4 h-4 mr-1" /> Resellers</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-1" /> Payouts</TabsTrigger>
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" /> Products</TabsTrigger>
          <TabsTrigger value="promotions"><Tag className="w-4 h-4 mr-1" /> Promotions</TabsTrigger>
          <TabsTrigger value="affiliates"><Plus className="w-4 h-4 mr-1" /> Affiliates</TabsTrigger>
        </TabsList>

        <TabsContent value="resellers">
          <div className="flex justify-end mb-3">
            <ResellerForm onCreate={(d) => createReseller.mutate(d)} pending={createReseller.isPending} />
          </div>
          <Card>
            <CardHeader><CardTitle>Reseller Network</CardTitle><CardDescription>Master → sub-reseller hierarchy with margins + KYB.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(resellers ?? []).length === 0 ? <Empty msg="No resellers yet." /> :
                (resellers ?? []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="text-sm min-w-0">
                      <Badge variant="secondary" className="mr-2">{r.tier}</Badge>
                      <code className="font-mono text-xs">{r.org_id?.slice(0, 10)}</code>
                      <span className="text-muted-foreground ml-2">margin {Math.round(Number(r.margin_pct) * 100)}%{r.parent_reseller_id ? " · sub" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.kyb_status === "approved" ? "success" : "secondary"}>{r.kyb_status || "unverified"}</Badge>
                      <Badge variant={r.status === "active" ? "success" : r.status === "pending" ? "warning" : "destructive"}>{r.status}</Badge>
                      {r.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => approveReseller.mutate({ id: r.id, kybApproved: true })}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Reseller Leaderboard</CardTitle>
              <CardDescription>By commission earned. Channel: resellers {money(revenue?.reseller)} · affiliates {money(revenue?.affiliate)}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {(leaderboard ?? []).length === 0 ? <Empty msg="No channel revenue yet." /> :
                (leaderboard ?? []).map((l) => (
                  <div key={l.resellerId} className="grid grid-cols-5 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                    <span className="font-bold">#{l.rank}</span>
                    <code className="col-span-2 font-mono text-xs truncate">{l.resellerId.slice(0, 12)}</code>
                    <span>{l.customers} cust</span>
                    <span className="font-semibold text-right">{money(l.revenue)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => processPayouts.mutate()} disabled={processPayouts.isPending}>
              {processPayouts.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wallet className="w-4 h-4 mr-1" />} Process Approved
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle>Payouts</CardTitle><CardDescription>Fraud-gated; holds need review before approval.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(payouts ?? []).length === 0 ? <Empty msg="No payouts." /> :
                (payouts ?? []).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="text-sm">
                      <Badge variant="secondary" className="mr-2">{p.party_type}</Badge>
                      <span className="font-medium">{money(p.amount)}</span>
                      {p.risk_score != null && <span className="text-muted-foreground ml-2">risk {Math.round(p.risk_score)}</span>}
                      {p.hold_reason && <span className="text-destructive text-xs ml-2">{p.hold_reason}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === "paid" ? "success" : p.status === "hold" ? "destructive" : "warning"}>{p.status}</Badge>
                      {(p.status === "pending" || p.status === "hold") && (
                        <Button size="sm" variant="ghost" onClick={() => approvePayout.mutate(p.id)}>Approve</Button>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle>Marketplace Products</CardTitle><CardDescription>Create / update SKUs in the catalog (powers the customer storefront + quotes).</CardDescription></CardHeader>
            <CardContent><ProductForm onSave={(d) => upsertProduct.mutate(d)} pending={upsertProduct.isPending} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader><CardTitle>Promotions</CardTitle><CardDescription>Percent / fixed / bonus-GB codes applied at quote time.</CardDescription></CardHeader>
            <CardContent><PromotionForm onSave={(d) => upsertPromotion.mutate(d)} pending={upsertPromotion.isPending} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader><CardTitle>Create Affiliate</CardTitle><CardDescription>Issue a referral code with commission terms.</CardDescription></CardHeader>
            <CardContent>
              <AffiliateForm onCreate={(d) => createAffiliate.mutate(d)} pending={createAffiliate.isPending} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResellerForm({ onCreate, pending }: { onCreate: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ orgId: "", tier: "reseller", marginPct: 0.2, wholesaleDiscount: 0.15, quotaGb: 0 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Onboard Reseller</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Onboard reseller</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Organization ID"><Input value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })} /></Field>
          <Field label="Tier (master|reseller|sub_reseller)"><Input value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Margin %"><Input type="number" step="0.05" value={f.marginPct} onChange={(e) => setF({ ...f, marginPct: Number(e.target.value) })} /></Field>
            <Field label="Wholesale −%"><Input type="number" step="0.05" value={f.wholesaleDiscount} onChange={(e) => setF({ ...f, wholesaleDiscount: Number(e.target.value) })} /></Field>
            <Field label="Quota GB (0=∞)"><Input type="number" value={f.quotaGb} onChange={(e) => setF({ ...f, quotaGb: Number(e.target.value) })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.orgId} onClick={() => { onCreate({ ...f, quotaGb: f.quotaGb || null }); setOpen(false); }}>{pending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({ onSave, pending }: { onSave: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [f, setF] = useState({ sku: "", name: "", category: "residential", basePrice: 0, unit: "gb" });
  return (
    <div className="grid grid-cols-2 gap-3 max-w-xl">
      <Field label="SKU"><Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></Field>
      <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Category (residential|mobile|datacenter|dedicated|geo|api)"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
      <Field label="Unit (gb|ip|month|request)"><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Field>
      <Field label="Base price ($)"><Input type="number" step="0.01" value={f.basePrice} onChange={(e) => setF({ ...f, basePrice: Number(e.target.value) })} /></Field>
      <div className="flex items-end"><Button size="sm" disabled={pending || !f.sku || !f.name} onClick={() => onSave(f)}>Save product</Button></div>
    </div>
  );
}

function PromotionForm({ onSave, pending }: { onSave: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [f, setF] = useState({ code: "", kind: "percent", value: 10, appliesTo: "all", maxRedemptions: 0 });
  return (
    <div className="grid grid-cols-2 gap-3 max-w-xl">
      <Field label="Code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="SAVE10" /></Field>
      <Field label="Kind (percent|fixed|bonus_gb)"><Input value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} /></Field>
      <Field label="Value"><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: Number(e.target.value) })} /></Field>
      <Field label="Applies to (all|category:x|sku:x)"><Input value={f.appliesTo} onChange={(e) => setF({ ...f, appliesTo: e.target.value })} /></Field>
      <Field label="Max redemptions (0=∞)"><Input type="number" value={f.maxRedemptions} onChange={(e) => setF({ ...f, maxRedemptions: Number(e.target.value) })} /></Field>
      <div className="flex items-end"><Button size="sm" disabled={pending || !f.code} onClick={() => onSave({ ...f, maxRedemptions: f.maxRedemptions || null })}>Save promotion</Button></div>
    </div>
  );
}

function AffiliateForm({ onCreate, pending }: { onCreate: (d: Record<string, unknown>) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", email: "", commissionPct: 0.2, recurringPct: 0.1, attributionWindowDays: 30 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Affiliate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create affiliate</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Referral code"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="ACME20" /></Field>
          <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="One-time %"><Input type="number" step="0.05" value={f.commissionPct} onChange={(e) => setF({ ...f, commissionPct: Number(e.target.value) })} /></Field>
            <Field label="Recurring %"><Input type="number" step="0.05" value={f.recurringPct} onChange={(e) => setF({ ...f, recurringPct: Number(e.target.value) })} /></Field>
            <Field label="Window (days)"><Input type="number" value={f.attributionWindowDays} onChange={(e) => setF({ ...f, attributionWindowDays: Number(e.target.value) })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.code} onClick={() => { onCreate(f); setOpen(false); }}>{pending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Store; tone?: "warning" }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold ${tone === "warning" ? "text-warning" : ""}`}>{value}</p></div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </CardContent></Card>
  );
}
const Empty = ({ msg }: { msg: string }) => <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>
);
