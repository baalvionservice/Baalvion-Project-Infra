
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Lock, 
  Search, 
  ArrowUpRight, 
  MapPin, 
  History, 
  FileCheck,
  CheckCircle2,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";

const threatData = [
  { time: '00:00', threats: 2 },
  { time: '04:00', threats: 1 },
  { time: '08:00', threats: 8 },
  { time: '12:00', threats: 12 },
  { time: '16:00', threats: 5 },
  { time: '20:00', threats: 3 },
  { time: '23:59', threats: 2 },
];

export default function AdminSecurityDashboard() {
  const [activeIncidents] = useState([
    { id: "SEC-1021", type: "UNAUTHORIZED_ACCESS", severity: "CRITICAL", user: "User_8821", ip: "104.22.1.42", status: "INVESTIGATING", time: "12m ago" },
    { id: "SEC-1018", type: "MFA_FAILURE", severity: "MEDIUM", user: "Admin_04", ip: "Internal", status: "OPEN", time: "45m ago" },
    { id: "SEC-1015", type: "BRUTE_FORCE", severity: "HIGH", user: "N/A", ip: "192.168.1.12", status: "CONTAINED", time: "2h ago" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Security Command Center
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Real-time threat monitoring, identity governance, and global compliance audit.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Fingerprint className="h-4 w-4" /> Identity Audit
          </Button>
          <Button className="bg-primary text-white font-bold gap-2 h-12 px-8 shadow-lg">
            <Activity className="h-4 w-4" /> Run Vulnerability Scan
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Incidents", val: "03", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Blocked Requests", val: "1,420", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "MFA Adoption", val: "94%", icon: Lock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Trust Score", val: "99.8", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-colors", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Access Attempt Velocity</CardTitle>
              <CardDescription>Frequency of high-risk login attempts (24h Window).</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200">Live Traffic</Badge>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threatData}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorThreats)" name="Attempt Count" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" />
                Geographic Risk Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {[
                  { region: "Western Europe", risk: "Low", attempts: 1204 },
                  { region: "East Asia", risk: "Medium", attempts: 4502 },
                  { region: "North America", risk: "Low", attempts: 842 },
                  { region: "Middle East", risk: "Low", attempts: 312 },
                ].map((r, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.region}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{r.attempts} Attempts</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold",
                      r.risk === "Low" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                    )}>{r.risk} Risk</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute right-0 bottom-0 p-4 opacity-10">
              <CheckCircle2 className="h-32 w-32" />
            </div>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-secondary" />
                Compliance Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">GDPR Compliance</span>
                  <span className="font-bold text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">India IT Rules 2021</span>
                  <span className="font-bold text-emerald-400">Verified</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Data Encryption (At Rest)</span>
                  <span className="font-bold text-secondary">Secured</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-xs">
                Export Compliance Evidence
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Active Security Incidents</CardTitle>
            <CardDescription>Open cases requiring manual investigation.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search Incident ID..." className="pl-10 h-10" />
          </div>
        </CardHeader>
        <div className="divide-y">
          {activeIncidents.map((incident) => (
            <div key={incident.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border",
                  incident.severity === "CRITICAL" ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-slate-50 border-slate-100 text-slate-400"
                )}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{incident.id}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{incident.time}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1">{incident.type.replace('_', ' ')} • Source: {incident.ip}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Severity</p>
                  <span className={cn(
                    "text-xs font-bold",
                    incident.severity === "CRITICAL" ? "text-rose-600" : "text-amber-600"
                  )}>{incident.severity}</span>
                </div>
                <div className="h-10 w-px bg-slate-200 hidden md:block" />
                <Badge className={cn(
                  "text-[10px] font-bold px-2 py-0.5",
                  incident.status === "INVESTIGATING" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                )}>
                  {incident.status}
                </Badge>
                <Button variant="ghost" size="sm" className="font-bold text-primary gap-2">
                  Respond <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <History className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Security Audit Logs</h3>
            <p className="text-sm text-slate-500">View immutable record of all administrative and system actions.</p>
          </div>
        </div>
        <Button variant="outline" className="font-bold border-slate-300 px-8" onClick={() => window.location.href='/admin/logs'}>
          Explore Audit Ledger
        </Button>
      </div>
    </div>
  );
}
