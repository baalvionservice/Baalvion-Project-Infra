import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Handshake, Users, DollarSign, Wallet, Plus, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  usePartnerProfile, usePartnerCustomers, usePartnerCommissions,
  useAddPartnerCustomer, useRequestPartnerPayout, useCreateSubReseller,
} from "@/hooks/usePlatform";

const money = (n?: number) => `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function Partner() {
  const { data: me, isLoading, isError } = usePartnerProfile();
  const { data: customers } = usePartnerCustomers();
  const { data: commissions } = usePartnerCommissions();
  const addCustomer = useAddPartnerCustomer();
  const requestPayout = useRequestPartnerPayout();
  const createSub = useCreateSubReseller();

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;

  // Not a reseller → invite to apply.
  if (isError || !me) {
    return (
      <div className="space-y-6">
        <SEOHead title="Partner Program" description="Become a Baalvion reseller or affiliate partner." />
        <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="w-6 h-6 text-primary" /> Partner Program</h1>
        <Card><CardContent className="py-12 text-center space-y-3">
          <p className="text-muted-foreground">Your organization isn't a reseller yet.</p>
          <p className="text-sm text-muted-foreground">Resell Baalvion proxies under your own brand with wholesale pricing, custom margins and white-label dashboards. Contact your account team to get approved.</p>
          <Button asChild><a href="/app/support">Apply to the Partner Program</a></Button>
        </CardContent></Card>
      </div>
    );
  }

  const approved = (commissions ?? []).filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.amount), 0);
  const accrued = (commissions ?? []).filter((c) => c.status === "accrued").reduce((s, c) => s + Number(c.amount), 0);
  const paid = (commissions ?? []).filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <SEOHead title="Partner Dashboard" description="Manage your customers, commissions and payouts." />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake className="w-6 h-6 text-primary" /> Partner Dashboard</h1>
          <p className="text-muted-foreground">
            <Badge variant="secondary" className="mr-2">{me.tier}</Badge>
            margin {Math.round(Number(me.margin_pct) * 100)}% · wholesale −{Math.round(Number(me.wholesale_discount) * 100)}%
            <Badge variant={me.status === "active" ? "success" : "warning"} className="ml-2">{me.status}</Badge>
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat label="Customers" value={(customers ?? []).length} icon={Users} />
        <Stat label="Accrued" value={money(accrued)} icon={DollarSign} />
        <Stat label="Approved (payable)" value={money(approved)} icon={Wallet} tone="success" />
        <Stat label="Paid out" value={money(paid)} icon={DollarSign} />
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers"><Users className="w-4 h-4 mr-1" /> Customers</TabsTrigger>
          <TabsTrigger value="commissions"><DollarSign className="w-4 h-4 mr-1" /> Commissions</TabsTrigger>
          <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-1" /> Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <div className="flex justify-end gap-2 mb-3">
            <SubResellerDialog onCreate={(d) => createSub.mutate(d)} pending={createSub.isPending} />
            <AddCustomerDialog onAdd={(d) => addCustomer.mutate(d)} pending={addCustomer.isPending} />
          </div>
          <Card>
            <CardHeader><CardTitle>Your Customers</CardTitle><CardDescription>Customers + sub-resellers in your subtree.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {(customers ?? []).length === 0 ? <Empty msg="No customers yet. Assign one to start earning." /> :
                (customers ?? []).map((c) => (
                  <div key={c.customer_org_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
                    <code className="font-mono text-xs">{c.customer_org_id.slice(0, 14)}</code>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{c.quota_gb != null ? `${c.quota_gb} GB` : "unlimited"}</span>
                      <Badge variant={c.status === "active" ? "success" : "secondary"}>{c.status}</Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader><CardTitle>Commission Rollup</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {(commissions ?? []).length === 0 ? <Empty msg="No commissions accrued yet." /> :
                (commissions ?? []).map((c, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                    <Badge variant="secondary" className="w-fit">{c.basis}</Badge>
                    <Badge variant={c.status === "paid" ? "success" : c.status === "approved" ? "info" : "secondary"} className="w-fit">{c.status}</Badge>
                    <span className="text-muted-foreground">{c.n} entries</span>
                    <span className="font-semibold text-right">{money(c.amount)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader><CardTitle>Request Payout</CardTitle><CardDescription>Payable balance: {money(approved)}. Subject to minimum threshold + fraud review.</CardDescription></CardHeader>
            <CardContent>
              <Button onClick={() => requestPayout.mutate("manual")} disabled={requestPayout.isPending || approved <= 0}>
                {requestPayout.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wallet className="w-4 h-4 mr-1" />} Request Payout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddCustomerDialog({ onAdd, pending }: { onAdd: (d: { customerOrgId: string; quotaGb?: number; country?: string }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ customerOrgId: "", quotaGb: 0, country: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Customer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign a customer</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Customer organization ID"><Input value={f.customerOrgId} onChange={(e) => setF({ ...f, customerOrgId: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quota (GB, 0 = inherit)"><Input type="number" value={f.quotaGb} onChange={(e) => setF({ ...f, quotaGb: Number(e.target.value) })} /></Field>
            <Field label="Country (optional)"><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.customerOrgId} onClick={() => { onAdd({ customerOrgId: f.customerOrgId, quotaGb: f.quotaGb || undefined, country: f.country || undefined }); setOpen(false); }}>{pending ? "Adding…" : "Assign"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubResellerDialog({ onCreate, pending }: { onCreate: (d: { orgId: string; marginPct: number }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ orgId: "", marginPct: 0.1 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Sub-Reseller</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create sub-reseller</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Sub-reseller organization ID"><Input value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })} /></Field>
          <Field label="Margin % (≤ your margin)"><Input type="number" step="0.05" value={f.marginPct} onChange={(e) => setF({ ...f, marginPct: Number(e.target.value) })} /></Field>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.orgId} onClick={() => { onCreate(f); setOpen(false); }}>{pending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Users; tone?: "success" }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold ${tone === "success" ? "text-success" : ""}`}>{value}</p></div>
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
    </CardContent></Card>
  );
}
const Empty = ({ msg }: { msg: string }) => <p className="text-sm text-muted-foreground py-6 text-center">{msg}</p>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>
);
