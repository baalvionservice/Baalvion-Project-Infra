import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Smartphone, Monitor, Globe, Plus, Trash2, LogOut, Clock, MapPin, Key } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";

const mockSessions = [
  { id: "s1", device: "Chrome / macOS", ip: "192.168.1.100", location: "San Francisco, US", lastActive: "Just now", current: true },
  { id: "s2", device: "Firefox / Windows", ip: "10.0.0.45", location: "London, UK", lastActive: "2 hours ago", current: false },
  { id: "s3", device: "Safari / iPhone", ip: "172.16.0.12", location: "Mumbai, IN", lastActive: "1 day ago", current: false },
];

const mockLoginHistory = [
  { id: "l1", time: "2026-02-17 14:32:00", device: "Chrome / macOS", ip: "192.168.1.100", location: "San Francisco, US", status: "success" },
  { id: "l2", time: "2026-02-17 09:15:00", device: "Firefox / Windows", ip: "10.0.0.45", location: "London, UK", status: "success" },
  { id: "l3", time: "2026-02-16 22:10:00", device: "Unknown", ip: "45.33.12.8", location: "Moscow, RU", status: "failed" },
  { id: "l4", time: "2026-02-16 18:00:00", device: "Safari / iPhone", ip: "172.16.0.12", location: "Mumbai, IN", status: "success" },
  { id: "l5", time: "2026-02-15 11:45:00", device: "Chrome / macOS", ip: "192.168.1.100", location: "San Francisco, US", status: "success" },
];

export default function SecurityCenter() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState(["192.168.1.0/24", "10.0.0.0/8"]);
  const [newIp, setNewIp] = useState("");
  const [sessions, setSessions] = useState(mockSessions);

  const addIp = () => {
    if (newIp && !ipAllowlist.includes(newIp)) {
      setIpAllowlist([...ipAllowlist, newIp]);
      setNewIp("");
      toast.success("IP added to allowlist");
    }
  };

  const removeIp = (ip: string) => {
    setIpAllowlist(ipAllowlist.filter(i => i !== ip));
    toast.success("IP removed from allowlist");
  };

  const revokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success("Session revoked");
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
              <Switch checked={twoFAEnabled} onCheckedChange={(v) => { setTwoFAEnabled(v); toast.success(v ? "2FA enabled" : "2FA disabled"); }} />
            </div>
            {twoFAEnabled && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-success font-medium">✓ Two-factor authentication is active</p>
                <p className="text-xs text-muted-foreground mt-1">Last verified: 2 hours ago</p>
              </div>
            )}
            <Button variant="outline" size="sm">View Recovery Codes</Button>
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
              <Input placeholder="e.g. 192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)} className="bg-secondary/50" />
              <Button onClick={addIp} size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" />Active Sessions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => { setSessions(sessions.filter(s => s.current)); toast.success("All other sessions revoked"); }}>
              <LogOut className="w-4 h-4 mr-1" />Revoke All Others
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-lg border ${s.current ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border/50"}`}>
                <div className="flex items-center gap-4">
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{s.device} {s.current && <Badge variant="success" className="ml-2 text-xs">Current</Badge>}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>
                      <span className="font-mono">{s.ip}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.lastActive}</span>
                    </div>
                  </div>
                </div>
                {!s.current && <Button variant="ghost" size="sm" onClick={() => revokeSession(s.id)}><LogOut className="w-4 h-4" /></Button>}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLoginHistory.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.time}</TableCell>
                  <TableCell>{l.device}</TableCell>
                  <TableCell className="font-mono text-sm">{l.ip}</TableCell>
                  <TableCell>{l.location}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "success" ? "success" : "destructive"}>
                      {l.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
