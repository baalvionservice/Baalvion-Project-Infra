import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, Zap, Globe, Ban, Activity } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAdminAbuseLogs } from "@/hooks/useAdmin";

const burstDetectionData = [
  { time: "00:00", normal: 120, burst: 0 }, { time: "04:00", normal: 80, burst: 0 },
  { time: "08:00", normal: 340, burst: 0 }, { time: "10:00", normal: 420, burst: 180 },
  { time: "12:00", normal: 510, burst: 320 }, { time: "14:00", normal: 480, burst: 0 },
  { time: "16:00", normal: 390, burst: 0 }, { time: "20:00", normal: 210, burst: 0 },
];
const apiMisuseData = [
  { date: "5/18", authFailures: 12, rateLimited: 34, invalidRequests: 8 },
  { date: "5/19", authFailures: 8, rateLimited: 28, invalidRequests: 5 },
  { date: "5/20", authFailures: 22, rateLimited: 45, invalidRequests: 14 },
  { date: "5/21", authFailures: 15, rateLimited: 31, invalidRequests: 9 },
  { date: "5/22", authFailures: 9, rateLimited: 22, invalidRequests: 6 },
  { date: "5/23", authFailures: 18, rateLimited: 38, invalidRequests: 11 },
];
const asnBlockList = [
  { asn: "AS13335", name: "Cloudflare", reason: "Datacenter traffic bypass", blocked: false },
  { asn: "AS16509", name: "Amazon AWS", reason: "Automated scraping abuse", blocked: true },
  { asn: "AS8075", name: "Microsoft Azure", reason: "Monitoring only", blocked: false },
];
const countryBlockConfig = [
  { code: "KP", country: "North Korea", reason: "Sanctioned country", blocked: true },
  { code: "IR", country: "Iran", reason: "Sanctioned country", blocked: true },
  { code: "RU", country: "Russia", reason: "High abuse rate", blocked: false },
];

const severityBadge = (s: string) => {
  if (s === "critical") return <Badge variant="destructive">{s}</Badge>;
  if (s === "high") return <Badge className="bg-warning/20 text-warning border-0">{s}</Badge>;
  if (s === "medium") return <Badge variant="secondary">{s}</Badge>;
  return <Badge variant="outline">{s}</Badge>;
};

export default function AdminRiskCenter() {
  const [killSwitch, setKillSwitch] = useState(false);
  const { data: abusePage } = useAdminAbuseLogs({ page: 1, pageSize: 50 });

  const userAbuseScores = (abusePage?.data ?? []).map(log => ({
    id: log.id,
    name: log.userId,
    score: log.riskScore,
    status: log.riskScore > 80 ? "critical" : log.riskScore > 60 ? "high" : log.riskScore > 40 ? "medium" : "low",
    flags: [log.eventType],
    requests24h: 1000 + log.riskScore * 150,
    blocked: !log.resolved && log.riskScore > 70,
  }));

  const suspiciousPatterns = (abusePage?.data ?? []).map(log => ({
    id: log.id,
    type: log.eventType,
    severity: log.severity,
    detectedAt: new Date(log.createdAt).toLocaleString(),
    details: log.reason,
    source: log.userId,
    status: log.resolved ? "resolved" : "active",
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Risk & Abuse Intelligence</h1>
          <p className="text-muted-foreground mt-1">Threat detection & enforcement</p>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <span className="text-sm font-medium text-destructive">Auto Kill Switch</span>
          <Switch checked={killSwitch} onCheckedChange={setKillSwitch} />
        </div>
      </div>

      {/* Abuse Score Table */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-destructive" />User Abuse Scores</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2 px-3">User</th><th className="text-left py-2 px-3">Score</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Flags</th><th className="text-right py-2 px-3">Requests/24h</th><th className="text-center py-2 px-3">Blocked</th>
              </tr></thead>
              <tbody>
                {userAbuseScores.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{u.name}</td>
                    <td className="py-2.5 px-3"><span className={`font-bold ${u.score > 80 ? "text-destructive" : u.score > 60 ? "text-warning" : "text-foreground"}`}>{u.score}</span></td>
                    <td className="py-2.5 px-3">{severityBadge(u.status)}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{u.flags.join(", ")}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">{u.requests24h.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center">{u.blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="outline">Active</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-warning" />Burst Request Detection</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={burstDetectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="time" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Area type="monotone" dataKey="normal" fill="hsl(199,89%,48%)" fillOpacity={0.2} stroke="hsl(199,89%,48%)" strokeWidth={2} name="Normal" />
                <Area type="monotone" dataKey="burst" fill="hsl(0,84%,60%)" fillOpacity={0.3} stroke="hsl(0,84%,60%)" strokeWidth={2} name="Burst" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />API Misuse Frequency</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={apiMisuseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,47%,16%)" />
                <XAxis dataKey="date" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222,47%,10%)", border: "1px solid hsl(222,47%,16%)", borderRadius: "8px", color: "hsl(210,40%,98%)" }} />
                <Bar dataKey="authFailures" fill="hsl(0,84%,60%)" radius={[2, 2, 0, 0]} name="Auth Failures" />
                <Bar dataKey="rateLimited" fill="hsl(38,92%,50%)" radius={[2, 2, 0, 0]} name="Rate Limited" />
                <Bar dataKey="invalidRequests" fill="hsl(199,89%,48%)" radius={[2, 2, 0, 0]} name="Invalid" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ASN & Country Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ban className="w-4 h-4 text-destructive" />ASN Block List</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {asnBlockList.map((a) => (
                <div key={a.asn} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div><p className="text-sm font-medium text-foreground">{a.name}</p><p className="text-xs text-muted-foreground">{a.asn} · {a.reason}</p></div>
                  <Badge variant={a.blocked ? "destructive" : "outline"}>{a.blocked ? "Blocked" : "Monitoring"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Country Block Simulation</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {countryBlockConfig.map((c) => (
                <div key={c.code} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <div><p className="text-sm font-medium text-foreground">{c.country}</p><p className="text-xs text-muted-foreground">{c.reason}</p></div>
                  <Badge variant={c.blocked ? "destructive" : "secondary"}>{c.blocked ? "Blocked" : "Active"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Patterns */}
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Suspicious Pattern Alert Feed</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suspiciousPatterns.map((p) => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${p.severity === "critical" ? "bg-destructive" : p.severity === "high" ? "bg-warning" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{p.type}</span>
                    {severityBadge(p.severity)}
                    <span className="text-xs text-muted-foreground">{p.detectedAt}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.details}</p>
                  <p className="text-xs text-muted-foreground">Source: {p.source} · Status: {p.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
