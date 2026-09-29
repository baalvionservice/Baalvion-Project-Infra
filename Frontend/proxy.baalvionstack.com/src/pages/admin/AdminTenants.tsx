import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Search, Users, ArrowUpRight, Pause, Play, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAdminTenants, useSuspendTenant, useReactivateTenant } from "@/hooks/useAdmin";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  users: number;
  usagePercent: number;
  mrr: number;
  status: "active" | "suspended";
  createdAt: string;
  contactEmail: string;
  bandwidth: { used: number; total: number };
}

export default function AdminTenants() {
  const { data: tenantsPage } = useAdminTenants({ page: 1, pageSize: 100 });
  const suspendTenant = useSuspendTenant();
  const reactivateTenant = useReactivateTenant();

  const tenants: Tenant[] = (tenantsPage?.data ?? []).map((org) => ({
    id: org.id,
    name: org.name,
    plan: org.planSlug ?? "starter",
    users: 0,
    usagePercent: org.bandwidthLimitGb > 0
      ? Math.round((org.bandwidthUsedGb / org.bandwidthLimitGb) * 100)
      : 0,
    mrr: org.planSlug === "enterprise" ? 899 : org.planSlug === "growth" ? 199 : 49,
    status: (org.status === "active" ? "active" : "suspended") as "active" | "suspended",
    createdAt: new Date(org.createdAt).toLocaleDateString(),
    contactEmail: `admin@${org.slug}.com`,
    bandwidth: { used: org.bandwidthUsedGb, total: org.bandwidthLimitGb || 1 },
  }));

  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;
    if (tenant.status === "active") {
      suspendTenant.mutate(id);
    } else {
      reactivateTenant.mutate(id);
    }
    toast.success("Tenant status updated");
  };

  const totalMRR = tenants.filter(t => t.status === "active").reduce((s, t) => s + t.mrr, 0);
  const totalUsers = tenants.reduce((s, t) => s + t.users, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-primary" />Tenant Management</h1>
        <p className="text-muted-foreground">Manage all platform tenants and their subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Tenants</p><p className="text-2xl font-bold">{tenants.length}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{tenants.filter(t => t.status === "active").length}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total MRR</p><p className="text-2xl font-bold">${totalMRR.toLocaleString()}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{totalUsers}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Tenants</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                  <TableCell>{t.users}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={t.usagePercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{t.usagePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${t.mrr}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "active" ? "success" : "destructive"}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(t)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(t.id)}>
                        {t.status === "active" ? <Pause className="w-4 h-4 text-warning" /> : <Play className="w-4 h-4 text-success" />}
                      </Button>
                      <Button variant="ghost" size="sm"><ArrowUpRight className="w-4 h-4 text-primary" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {selectedTenant && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{selectedTenant.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Plan</p><p className="font-medium">{selectedTenant.plan}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">MRR</p><p className="font-medium">${selectedTenant.mrr}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Users</p><p className="font-medium">{selectedTenant.users}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Since</p><p className="font-medium">{selectedTenant.createdAt}</p></div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Bandwidth Usage</p>
                  <Progress value={(selectedTenant.bandwidth.used / selectedTenant.bandwidth.total) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground">{selectedTenant.bandwidth.used} / {selectedTenant.bandwidth.total} GB</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-mono text-sm">{selectedTenant.contactEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { toggleStatus(selectedTenant.id); setSelectedTenant(null); }}>
                    {selectedTenant.status === "active" ? "Suspend" : "Reactivate"}
                  </Button>
                  <Button variant="hero" className="flex-1">Upgrade Plan</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
