import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Shield, Smartphone, Monitor, Globe, Plus, Trash2, LogOut, Clock, Key } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi, type SecuritySession, type LoginHistoryEntry } from "@/lib/platformClient";
import { useAuth } from "@/contexts/AuthContext";

function deviceFromUA(ua?: string): string {
  if (!ua) return "Unknown device";
  const browser = /Edg/i.test(ua) ? "Edge" : /Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox"
    : /Safari/i.test(ua) ? "Safari" : /curl/i.test(ua) ? "API client" : "Browser";
  const os = /Windows/i.test(ua) ? "Windows" : /Mac OS|Macintosh/i.test(ua) ? "macOS" : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS" : /Linux/i.test(ua) ? "Linux" : "";
  return os ? `${browser} / ${os}` : browser;
}
function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function SecurityCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── IP allowlist (real) ──
  const [ipAllowlist, setIpAllowlist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  useEffect(() => { securityApi.getIpAllowlist().then(setIpAllowlist).catch(() => {}); }, []);
  const addIp = async () => {
    if (!newIp || ipAllowlist.includes(newIp)) return;
    try {
      const updated = await securityApi.addIp(newIp);
      setIpAllowlist(updated ?? [...ipAllowlist, newIp]); setNewIp("");
      toast.success("IP added to allowlist");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to add IP"); }
  };
  const removeIp = async (ip: string) => {
    const prev = ipAllowlist;
    setIpAllowlist(ipAllowlist.filter(i => i !== ip));
    try { const u = await securityApi.removeIp(ip); if (Array.isArray(u)) setIpAllowlist(u); toast.success("IP removed from allowlist"); }
    catch (e) { setIpAllowlist(prev); toast.error(e instanceof Error ? e.message : "Failed to remove IP"); }
  };

  // ── Active sessions (real) ──
  const { data: sessions = [] } = useQuery({ queryKey: ["security", "sessions"], queryFn: () => securityApi.listSessions() });
  const revoke = useMutation({
    mutationFn: (id: string) => securityApi.revokeSession(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["security", "sessions"] }); toast.success("Session revoked"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to revoke"),
  });

  // ── Login history (real) ──
  const { data: loginHistory = [] } = useQuery({ queryKey: ["security", "login-history"], queryFn: () => securityApi.getLoginHistory() });

  // ── 2FA (real enable/verify/disable) ──
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(Boolean(user?.mfaEnabled));
  useEffect(() => { setMfaEnabled(Boolean(user?.mfaEnabled)); }, [user?.mfaEnabled]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onToggle2FA = async (v: boolean) => {
    if (v) {
      try {
        const { qrCodeUrl } = await securityApi.enableMfa();
        setQrUrl(qrCodeUrl); setCode(""); setSetupOpen(true);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Could not start 2FA setup"); }
    } else {
      try { await securityApi.disableMfa(); setMfaEnabled(false); toast.success("Two-factor authentication disabled"); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Failed to disable 2FA"); }
    }
  };
  const verify2FA = async () => {
    if (code.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setBusy(true);
    try {
      await securityApi.verifyMfa(code);
      setMfaEnabled(true); setSetupOpen(false);
      toast.success("Two-factor authentication enabled");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Invalid code"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Security Center" description="Manage account security settings including 2FA, IP allowlists, and active sessions." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" />Security Center</h1>
        <p className="text-muted-foreground">Manage your account security and access controls.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 2FA */}
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Key className="w-5 h-5 text-primary" />Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">Use an app like Google Authenticator or Authy</p>
                </div>
              </div>
              <Switch checked={mfaEnabled} onCheckedChange={onToggle2FA} />
            </div>
            {mfaEnabled && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success font-medium">✓ Two-factor authentication is active</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IP Allowlist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />IP Allowlist</CardTitle>
            <CardDescription>Restrict API access to specific IP addresses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="e.g. 192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)} onKeyDown={e => e.key === "Enter" && addIp()} className="bg-secondary/50" />
              <Button onClick={addIp} size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
              {ipAllowlist.length === 0 && <p className="text-sm text-muted-foreground">No IP restrictions — access allowed from anywhere.</p>}
              {ipAllowlist.map(ip => (
                <div key={ip} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="font-mono text-sm">{ip}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeIp(ip)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" />Active Sessions <Badge variant="secondary" className="ml-1">{sessions.length}</Badge></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length === 0 && <p className="text-sm text-muted-foreground">No active sessions.</p>}
            {sessions.map((s: SecuritySession) => (
              <div key={s.id} className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30 border-border/50">
                <div className="flex items-center gap-4">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{deviceFromUA(s.userAgent)}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="font-mono">{s.ipAddress || "—"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />expires {fmt(s.expiresAt)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}><LogOut className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Login History</CardTitle>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent login activity recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((l: LoginHistoryEntry) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{fmt(l.createdAt)}</TableCell>
                    <TableCell>{deviceFromUA(l.userAgent)}</TableCell>
                    <TableCell className="font-mono text-sm">{l.ipAddress || "—"}</TableCell>
                    <TableCell><Badge variant={l.success === false ? "destructive" : "success"}>{l.success === false ? "Failed" : "Success"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 2FA setup dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrUrl && <img src={qrUrl} alt="2FA QR code" className="w-44 h-44 rounded-lg border border-border bg-white p-2" />}
            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" inputMode="numeric" className="text-center font-mono tracking-widest w-40" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
            <Button onClick={verify2FA} disabled={busy || code.length < 6}>{busy ? "Verifying…" : "Verify & enable"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
