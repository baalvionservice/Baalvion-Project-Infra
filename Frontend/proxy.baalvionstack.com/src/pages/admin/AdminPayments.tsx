import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import {
  Search, CreditCard, AlertTriangle, RefreshCw, Ban, DollarSign,
  ArrowUpRight, Clock, Code, ChevronDown, ChevronUp, Landmark, Building2, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUsers, useAdminRevenueSummary, useAdminPendingOrders, useMarkOrderPaid } from "@/hooks/useAdmin";

interface CustomerRow { id: string; name: string; email: string; gateway: string; plan: string; mrr: number; status: string; riskScore: number; country: string; chargebackCount: number; failedPayments: number; }
interface WebhookRow { id: string; eventType: string; gateway: string; status: string; timestamp: string; httpStatus: number; retryCount: number; payload: Record<string, unknown>; }
interface ContractRow { id: string; companyName: string; contactName: string; contactEmail: string; estimatedGb: number; customPricing: number; paymentTerms: string; status: "active" | "pending" | "approved"; }

const staticWebhooks: WebhookRow[] = [
  { id: "wh1", eventType: "payment.captured", gateway: "razorpay", status: "delivered", timestamp: new Date(Date.now() - 3600000).toISOString(), httpStatus: 200, retryCount: 0, payload: { event: "payment.captured", payment_id: "pay_test_001", amount: 89900 } },
  { id: "wh2", eventType: "subscription.activated", gateway: "razorpay", status: "delivered", timestamp: new Date(Date.now() - 7200000).toISOString(), httpStatus: 200, retryCount: 0, payload: { event: "subscription.activated", subscription_id: "sub_test_001" } },
  { id: "wh3", eventType: "payment.failed", gateway: "stripe", status: "failed", timestamp: new Date(Date.now() - 86400000).toISOString(), httpStatus: 500, retryCount: 3, payload: { event: "payment.failed", payment_intent: "pi_test_001" } },
];

const staticContracts: ContractRow[] = [
  { id: "c1", companyName: "TechFlow Inc", contactName: "David Park", contactEmail: "ops@techflow.io", estimatedGb: 5000, customPricing: 1499, paymentTerms: "net_30", status: "active" },
  { id: "c2", companyName: "Acme Corp", contactName: "Jane Doe", contactEmail: "billing@acme.com", estimatedGb: 2000, customPricing: 799, paymentTerms: "net_60", status: "pending" },
];

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [webhooks] = useState(staticWebhooks);
  const [contracts, setContracts] = useState(staticContracts);
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null);

  const { data: usersPage } = useAdminUsers({ page: 1, pageSize: 100 });
  const { data: rev } = useAdminRevenueSummary();
  const { data: pendingOrders } = useAdminPendingOrders();
  const markPaid = useMarkOrderPaid();

  const customers: CustomerRow[] = (usersPage?.data ?? []).map((u, i) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    gateway: i % 3 === 0 ? "stripe" : i % 3 === 1 ? "razorpay" : "payu",
    plan: u.role === "platform_admin" ? "Enterprise" : u.role === "owner" ? "Growth" : "Starter",
    mrr: u.role === "platform_admin" ? 899 : u.role === "owner" ? 499 : 99,
    status: u.status === "active" ? "active" : "canceled",
    riskScore: 10 + (i * 13) % 60,
    country: "IN",
    chargebackCount: 0,
    failedPayments: 0,
  }));

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const riskColor = (score: number) => score >= 70 ? "text-destructive" : score >= 40 ? "text-warning" : "text-success";

  return (
    <div className="space-y-6">
      <SEOHead title="Admin Payments" description="Manage customer payments and gateways" />
      <div>
        <h1 className="text-2xl font-bold">Payment Control Panel</h1>
        <p className="text-muted-foreground">Manage customer payments, webhooks, and enterprise contracts</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Customers", value: customers.filter(c => c.status === "active").length, icon: CreditCard },
          { label: "Total MRR", value: `$${(rev?.mrr ?? 0).toLocaleString()}`, icon: DollarSign },
          { label: "At-Risk", value: customers.filter(c => c.riskScore >= 50).length, icon: AlertTriangle },
          { label: "Chargebacks", value: customers.reduce((s, c) => s + c.chargebackCount, 0), icon: Ban },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <k.icon className="w-8 h-8 text-primary" />
              <div><p className="text-2xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="orders">Pending Orders{pendingOrders?.length ? ` (${pendingOrders.length})` : ""}</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
          <TabsTrigger value="contracts">Enterprise Contracts</TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Gateway</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">MRR</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Risk</th>
                    <th className="text-left p-4 font-medium">Country</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                      <td className="p-4 capitalize">{c.gateway.replace("_", " ")}</td>
                      <td className="p-4">{c.plan}</td>
                      <td className="p-4 font-medium">${c.mrr}</td>
                      <td className="p-4"><Badge variant={c.status === "active" ? "success" : c.status === "past_due" ? "warning" : c.status === "canceled" ? "destructive" : "secondary"}>{c.status}</Badge></td>
                      <td className="p-4"><span className={cn("font-bold", riskColor(c.riskScore))}>{c.riskScore}</span></td>
                      <td className="p-4">{c.country}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Refund"><RefreshCw className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" title="Extend Grace"><Clock className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="sm" title="Cancel" className="text-destructive"><Ban className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="w-4 h-4" /> Webhook Event Log</CardTitle></CardHeader>
            <CardContent className="p-0">
              {webhooks.map(wh => (
                <div key={wh.id} className="border-b border-border last:border-0">
                  <div
                    className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedWebhook(expandedWebhook === wh.id ? null : wh.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={wh.status === "delivered" ? "success" : wh.status === "failed" ? "destructive" : "warning"} className="text-[10px] w-20 justify-center">{wh.status}</Badge>
                      <span className="font-mono text-xs">{wh.eventType}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{wh.gateway}</span>
                      <span>{new Date(wh.timestamp).toLocaleString()}</span>
                      {expandedWebhook === wh.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {expandedWebhook === wh.id && (
                    <div className="px-6 pb-4">
                      <pre className="bg-secondary/30 rounded-lg p-4 text-xs overflow-x-auto font-mono">{JSON.stringify(wh.payload, null, 2)}</pre>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>HTTP {wh.httpStatus}</span>
                        <span>Retries: {wh.retryCount}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enterprise Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Est. GB</th>
                    <th className="text-left p-4 font-medium">Pricing</th>
                    <th className="text-left p-4 font-medium">Terms</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map(c => (
                    <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-medium">{c.companyName}</td>
                      <td className="p-4"><p>{c.contactName}</p><p className="text-xs text-muted-foreground">{c.contactEmail}</p></td>
                      <td className="p-4">{c.estimatedGb.toLocaleString()} GB</td>
                      <td className="p-4 font-medium">${c.customPricing}/mo</td>
                      <td className="p-4 capitalize">{c.paymentTerms.replace("_", " ")}</td>
                      <td className="p-4"><Badge variant={c.status === "active" ? "success" : c.status === "pending" ? "warning" : "secondary"}>{c.status}</Badge></td>
                      <td className="p-4">
                        {c.status === "pending" && (
                          <Button size="sm" onClick={() => setContracts(prev => prev.map(x => x.id === c.id ? { ...x, status: "approved" as const } : x))}>
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending bank/wire orders → mark received to activate the subscription */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Pending Bank / Wire Orders</CardTitle>
              <CardDescription>Offline-settled orders awaiting payment. Mark an order received to activate the customer's subscription.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {(pendingOrders ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No pending orders. Bank and wire checkouts will appear here for settlement.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">Organization</th>
                      <th className="text-left p-4 font-medium">Plan</th>
                      <th className="text-left p-4 font-medium">Method</th>
                      <th className="text-left p-4 font-medium">Amount</th>
                      <th className="text-left p-4 font-medium">Issued</th>
                      <th className="text-left p-4 font-medium">Due</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pendingOrders ?? []).map(o => (
                      <tr key={o.invoiceId} className="border-b border-border hover:bg-secondary/30 transition-colors">
                        <td className="p-4"><p className="font-medium">{o.orgName}</p><p className="text-xs text-muted-foreground font-mono">INV-{o.invoiceId}</p></td>
                        <td className="p-4 capitalize">{o.planSlug || "—"}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="capitalize gap-1">
                            {o.method === "wire" ? <Building2 className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}{o.method}
                          </Badge>
                        </td>
                        <td className="p-4 font-medium">${Number(o.total ?? o.amount ?? 0).toFixed(2)}</td>
                        <td className="p-4 text-muted-foreground">{(o.issuedAt || "").slice(0, 10)}</td>
                        <td className="p-4 text-muted-foreground">{(o.dueAt || "").slice(0, 10)}</td>
                        <td className="p-4">
                          <Button size="sm" disabled={markPaid.isPending} onClick={() => markPaid.mutate(o.invoiceId)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Received
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
