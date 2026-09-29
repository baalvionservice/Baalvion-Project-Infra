import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Globe, Copy, Plus, Loader2, ShieldAlert, Activity, Gauge, KeyRound, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { useOrg } from "@/contexts/OrgContext";
import {
  useApiKeys, useCreateApiKey, useProxySessions, useRealtimeUsage, useProjectedOverage,
} from "@/hooks/usePlatform";
import { PROXY_GATEWAY } from "@/lib/platformClient";
import type { ApiKeyCreated } from "@/lib/platformClient";

const COUNTRIES = ["", "us", "gb", "de", "fr", "ca", "in", "jp", "br", "au"];

export default function ProxyAccess() {
  const { currentOrg } = useOrg();
  const { data: keys } = useApiKeys();
  const createKey = useCreateApiKey();
  const { data: sessions, isLoading: sessionsLoading } = useProxySessions();
  const { data: realtime } = useRealtimeUsage();
  const { data: projected } = useProjectedOverage();

  const [country, setCountry] = useState("us");
  const [city, setCity] = useState("");
  const [rotation, setRotation] = useState<"rotating" | "sticky">("rotating");
  const [sessionId, setSessionId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreated, setNewlyCreated] = useState<ApiKeyCreated | null>(null);

  const proxyKeys = (keys ?? []).filter((k) => k.keyType === "proxy" && !k.revokedAt);
  const orgFragment = (currentOrg?.id || "org").slice(0, 8);

  const username = useMemo(() => {
    const parts = [`customer-${orgFragment}`];
    if (country) parts.push(`country-${country}`);
    if (city.trim()) parts.push(`city-${city.trim().toLowerCase()}`);
    if (rotation === "sticky") parts.push(`session-${sessionId.trim() || "abc123"}`);
    parts.push(`rotation-${rotation}`);
    return parts.join("-");
  }, [orgFragment, country, city, rotation, sessionId]);

  const password = newlyCreated?.rawKey || "<YOUR_PROXY_KEY>";
  const { host, httpPort, socksPort } = PROXY_GATEWAY;

  const examples: Record<string, string> = {
    curl: `# HTTPS via CONNECT tunnel\ncurl -x "http://${username}:${password}@${host}:${httpPort}" https://api.ipify.org`,
    socks5: `# SOCKS5\ncurl --socks5 "${username}:${password}@${host}:${socksPort}" https://api.ipify.org`,
    python: `import requests\n\nproxy = "http://${username}:${password}@${host}:${httpPort}"\nr = requests.get("https://api.ipify.org",\n    proxies={"http": proxy, "https": proxy})\nprint(r.text)`,
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast({ title: "Copied to clipboard" }); };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    const result = await createKey.mutateAsync({
      name: newKeyName.trim(),
      keyType: "proxy",
      scopes: ["proxy:connect", "proxy:sticky", "usage:read"],
    });
    setNewlyCreated(result);
    setNewKeyName("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Proxy Access" description="Connect to the Baalvion proxy network — endpoints, credentials and live usage." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proxy Access</h1>
          <p className="text-muted-foreground">Generate connection credentials for the proxy gateway and monitor live usage.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Proxy Key
        </Button>
      </div>

      {/* Live usage + projected overage */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Activity className="w-4 h-4" /> Live this period</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{(realtime?.periodGb ?? 0).toFixed(2)} GB</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Gauge className="w-4 h-4" /> Active sessions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{realtime?.activeSessions ?? 0}</div></CardContent>
        </Card>
        <Card className={projected && projected.overageGb > 0 ? "border-warning/40 bg-warning/5" : ""}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><ShieldAlert className="w-4 h-4" /> Projected overage</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(projected?.overageGb ?? 0).toFixed(2)} GB</div>
            {projected && projected.total > 0 && <p className="text-xs text-warning mt-1">Est. ${projected.total.toFixed(2)} this period</p>}
          </CardContent>
        </Card>
      </div>

      {/* Newly created key banner */}
      {newlyCreated && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-accent">Copy your proxy key now — it won't be shown again. Use it as the connection password.</p>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={newlyCreated.rawKey} readOnly className="font-mono text-sm" />
                  <Button size="icon" variant="outline" onClick={() => copy(newlyCreated.rawKey)}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setNewlyCreated(null)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Connection Builder</CardTitle>
          <CardDescription>Endpoint <code className="font-mono">{host}:{httpPort}</code> (HTTP/CONNECT) · <code className="font-mono">{host}:{socksPort}</code> (SOCKS5)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c || "any"} value={c || "any"}>{c ? c.toUpperCase() : "Any"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City (optional)</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. newyork" />
            </div>
            <div className="space-y-2">
              <Label>Rotation</Label>
              <Select value={rotation} onValueChange={(v) => setRotation(v as "rotating" | "sticky")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rotating">Rotating (new IP/request)</SelectItem>
                  <SelectItem value="sticky">Sticky (session)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session ID</Label>
              <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="abc123" disabled={rotation !== "sticky"} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Proxy username</Label>
            <div className="flex items-center gap-2">
              <Input value={username} readOnly className="font-mono text-sm bg-secondary/50" />
              <Button size="icon" variant="outline" onClick={() => copy(username)}><Copy className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Password = your <code>bvl_proxy_</code> key{proxyKeys.length === 0 && " — create one above"}.</p>
          </div>

          <Tabs defaultValue="curl">
            <TabsList>
              <TabsTrigger value="curl">cURL (HTTP)</TabsTrigger>
              <TabsTrigger value="socks5">SOCKS5</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            {Object.entries(examples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang}>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-background overflow-x-auto text-sm border border-border/50"><code>{code}</code></pre>
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copy(code)}><Copy className="w-4 h-4" /></Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Proxy keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Proxy Keys</CardTitle>
          <CardDescription>Use these as the connection password. Manage all keys in API Keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {proxyKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No proxy keys yet. Create one to connect.</p>
          ) : proxyKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <span className="font-medium">{k.name}</span>
                <code className="text-xs text-muted-foreground ml-3 font-mono">{k.keyPrefix}•••</code>
              </div>
              <Badge variant="success">proxy</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Active Sessions</CardTitle>
          <CardDescription>Live sticky/rotating sessions on the gateway.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : (sessions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active proxy sessions.</p>
          ) : (sessions ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="min-w-0">
                <code className="font-mono text-sm">{s.sessionToken}</code>
                <div className="text-xs text-muted-foreground">{s.country?.toUpperCase() || "ANY"} · {s.rotation}</div>
              </div>
              <Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create proxy key dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Proxy Key</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Key name</Label>
              <Input placeholder="e.g. Scraper – production" value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
            </div>
            <p className="text-xs text-muted-foreground">Scopes: proxy:connect, proxy:sticky, usage:read.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newKeyName.trim() || createKey.isPending}>
              {createKey.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
