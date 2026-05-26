import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Globe, Network, Server, Plus, RefreshCw, Loader2, Cpu } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import {
  useEdgeRegions, useUpsertEdgeRegion, useAsnIntel, useUpsertAsn, useRefreshAsn,
  useIpPools, useCreatePool, useAddPoolIPs, useAllocateIPs,
} from "@/hooks/useAdmin";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  healthy: "success", degraded: "warning", offline: "destructive",
};
const repVariant = (r: number) => (r >= 70 ? "success" : r >= 50 ? "warning" : "destructive");

export default function AdminEdgeNetwork() {
  const { data: regions, isLoading: regionsLoading } = useEdgeRegions();
  const { data: asns } = useAsnIntel({ limit: 200 });
  const { data: pools } = useIpPools();
  const upsertRegion = useUpsertEdgeRegion();
  const upsertAsn = useUpsertAsn();
  const refreshAsn = useRefreshAsn();
  const createPool = useCreatePool();
  const addIPs = useAddPoolIPs();
  const allocate = useAllocateIPs();

  const healthyRegions = (regions ?? []).filter((r) => r.status === "healthy").length;
  const totalAvailable = (pools ?? []).reduce((s, p) => s + (Number(p.available) || 0), 0);
  const bannedAsns = (asns ?? []).filter((a) => Number(a.reputation) < 50).length;

  return (
    <div className="space-y-6">
      <SEOHead title="Global Edge Network" description="Edge regions, ASN intelligence and dedicated owned-IP pools." />
      <div>
        <h1 className="text-2xl font-bold">Global Edge Network</h1>
        <p className="text-muted-foreground">PoP regions, ASN intelligence, and dedicated owned-IP pools (Anycast + GeoDNS steered).</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard label="Regions" value={(regions ?? []).length} icon={Globe} />
        <StatCard label="Healthy" value={healthyRegions} icon={Globe} tone="success" />
        <StatCard label="ASNs tracked" value={(asns ?? []).length} icon={Cpu} />
        <StatCard label="Banned ASNs" value={bannedAsns} icon={Cpu} tone={bannedAsns ? "warning" : undefined} />
        <StatCard label="Available IPs" value={totalAvailable} icon={Server} />
      </div>

      <Tabs defaultValue="regions">
        <TabsList>
          <TabsTrigger value="regions"><Globe className="w-4 h-4 mr-1" /> Regions</TabsTrigger>
          <TabsTrigger value="asn"><Cpu className="w-4 h-4 mr-1" /> ASN Intelligence</TabsTrigger>
          <TabsTrigger value="pools"><Server className="w-4 h-4 mr-1" /> Dedicated IP Pools</TabsTrigger>
        </TabsList>

        {/* ── Regions ── */}
        <TabsContent value="regions">
          <div className="flex justify-end mb-3">
            <RegionDialog onSave={(d) => upsertRegion.mutate(d)} pending={upsertRegion.isPending} />
          </div>
          {regionsLoading ? (
            <Loading />
          ) : (regions ?? []).length === 0 ? (
            <Empty msg="No edge regions yet. Add a region to begin steering traffic." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(regions ?? []).map((r) => (
                <Card key={r.code}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{r.name}</CardTitle>
                      <Badge variant={statusVariant[r.status || "healthy"] || "secondary"}>{r.status || "healthy"}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      <code className="font-mono">{r.code}</code> · {r.continent || "—"} · weight {r.weight ?? 100}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground truncate">
                    {r.gateway_endpoint || "no gateway endpoint set"}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── ASN Intelligence ── */}
        <TabsContent value="asn">
          <div className="flex justify-end gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => refreshAsn.mutate()} disabled={refreshAsn.isPending}>
              {refreshAsn.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Recompute Reputation
            </Button>
            <AsnDialog onSave={(d) => upsertAsn.mutate(d)} pending={upsertAsn.isPending} />
          </div>
          <Card>
            <CardContent className="pt-6">
              {(asns ?? []).length === 0 ? <Empty msg="No ASN intelligence yet." /> : (
                <div className="space-y-1 text-sm">
                  <div className="grid grid-cols-6 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
                    <span>ASN</span><span className="col-span-2">Name</span><span>Type</span><span>Ban rate</span><span>Reputation</span>
                  </div>
                  {(asns ?? []).map((a) => (
                    <div key={a.asn} className="grid grid-cols-6 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                      <code className="font-mono text-xs">AS{a.asn}</code>
                      <span className="col-span-2 truncate">{a.name || "—"} <span className="text-muted-foreground">{a.country?.toUpperCase()}</span></span>
                      <Badge variant="secondary" className="w-fit">{a.type || "—"}</Badge>
                      <span>{Math.round((Number(a.ban_rate) || 0) * 100)}%</span>
                      <Badge variant={repVariant(Number(a.reputation))} className="w-fit">{Math.round(Number(a.reputation))}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IP Pools ── */}
        <TabsContent value="pools">
          <div className="flex justify-end mb-3">
            <PoolDialog onSave={(d) => createPool.mutate(d)} pending={createPool.isPending} />
          </div>
          {(pools ?? []).length === 0 ? (
            <Empty msg="No dedicated IP pools. Create a pool, then add owned IPs and allocate them to orgs." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(pools ?? []).map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="info">{p.type}</Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {p.region_code || "global"} · {p.provider || "owned"} · {p.rotation || "static"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available / Total</span>
                      <span className="font-semibold">{Number(p.available) || 0} / {Number(p.total) || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <AddIpsDialog poolId={p.id} onSave={(ips) => addIPs.mutate({ poolId: p.id, ips })} pending={addIPs.isPending} />
                      <AllocateDialog poolId={p.id} onSave={(d) => allocate.mutate({ poolId: p.id, ...d })} pending={allocate.isPending} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── small UI helpers ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Globe; tone?: "success" | "warning" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{value}</p>
          </div>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
const Loading = () => <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
const Empty = ({ msg }: { msg: string }) => <Card><CardContent className="py-8 text-center text-muted-foreground">{msg}</CardContent></Card>;

function RegionDialog({ onSave, pending }: { onSave: (d: { code: string; name: string; continent?: string; gatewayEndpoint?: string; weight?: number }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", name: "", continent: "", gatewayEndpoint: "", weight: 100 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Region</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add edge region</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Code (e.g. us-east-1)"><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Continent (NA|SA|EU|IN|SEA|ME|AF|OC)"><Input value={f.continent} onChange={(e) => setF({ ...f, continent: e.target.value })} /></Field>
          <Field label="Gateway endpoint"><Input value={f.gatewayEndpoint} onChange={(e) => setF({ ...f, gatewayEndpoint: e.target.value })} /></Field>
          <Field label="Weight"><Input type="number" value={f.weight} onChange={(e) => setF({ ...f, weight: Number(e.target.value) })} /></Field>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.code || !f.name} onClick={() => { onSave(f); setOpen(false); }}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AsnDialog({ onSave, pending }: { onSave: (d: { asn: number; name?: string; country?: string; type?: string; banRate?: number; successRate?: number }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ asn: 0, name: "", country: "", type: "residential", banRate: 0, successRate: 100 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add ASN</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add / update ASN</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="ASN number"><Input type="number" value={f.asn || ""} onChange={(e) => setF({ ...f, asn: Number(e.target.value) })} /></Field>
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Country (ISO2)"><Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
          <Field label="Type (residential|mobile|datacenter|isp)"><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ban rate (0–1)"><Input type="number" step="0.01" value={f.banRate} onChange={(e) => setF({ ...f, banRate: Number(e.target.value) })} /></Field>
            <Field label="Success rate (0–100)"><Input type="number" value={f.successRate} onChange={(e) => setF({ ...f, successRate: Number(e.target.value) })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.asn} onClick={() => { onSave(f); setOpen(false); }}>{pending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PoolDialog({ onSave, pending }: { onSave: (d: { name: string; type: string; regionCode?: string; rotation?: string }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", type: "datacenter", regionCode: "", rotation: "static" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Create Pool</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create dedicated IP pool</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Type (datacenter|residential|mobile|isp)"><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></Field>
          <Field label="Region code (optional)"><Input value={f.regionCode} onChange={(e) => setF({ ...f, regionCode: e.target.value })} /></Field>
          <Field label="Rotation (static|rotating)"><Input value={f.rotation} onChange={(e) => setF({ ...f, rotation: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.name} onClick={() => { onSave(f); setOpen(false); }}>{pending ? "Creating…" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddIpsDialog({ poolId, onSave, pending }: { poolId: string; onSave: (ips: string[]) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="flex-1"><Plus className="w-3.5 h-3.5 mr-1" /> IPs</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add owned IPs</DialogTitle></DialogHeader>
        <Field label="One IP per line">
          <textarea className="w-full h-32 rounded-md border bg-background p-2 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="203.0.113.10&#10;203.0.113.11" />
        </Field>
        <DialogFooter>
          <Button disabled={pending} onClick={() => { onSave(text.split(/\s+/).map((s) => s.trim()).filter(Boolean)); setOpen(false); }}>{pending ? "Adding…" : "Add IPs"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AllocateDialog({ poolId, onSave, pending }: { poolId: string; onSave: (d: { orgId: string; count: number }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ orgId: "", count: 1 });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="flex-1"><Network className="w-3.5 h-3.5 mr-1" /> Allocate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Allocate IPs to organization</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Organization ID"><Input value={f.orgId} onChange={(e) => setF({ ...f, orgId: e.target.value })} /></Field>
          <Field label="Count"><Input type="number" min={1} value={f.count} onChange={(e) => setF({ ...f, count: Number(e.target.value) })} /></Field>
        </div>
        <DialogFooter>
          <Button disabled={pending || !f.orgId} onClick={() => { onSave(f); setOpen(false); }}>{pending ? "Allocating…" : "Allocate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>
);
