
"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, getCurrentUser } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  DollarSign,
  ArrowRight,
  LogOut,
  ShieldCheck,
  FileText,
  MousePointer2,
  Zap,
  Settings2,
  UserCheck,
  ClipboardList
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const tradeVelocityData = [
  { name: 'Jan', leads: 4000, converted: 2400 },
  { name: 'Feb', leads: 3000, converted: 1398 },
  { name: 'Mar', leads: 2000, converted: 9800 },
  { name: 'Apr', leads: 2780, converted: 3908 },
  { name: 'May', leads: 1890, converted: 4800 },
  { name: 'Jun', leads: 3200, converted: 5200 },
];

const blueprintStageData = [
  { name: 'Beginner', value: 35, color: '#1B4498' },
  { name: 'Scaling', value: 45, color: '#21CEDD' },
  { name: 'Expansion', value: 15, color: '#64748b' },
  { name: 'Enterprise', value: 5, color: '#94a3b8' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Session is enforced by the admin layout + middleware; reflect the in-memory role for display.
    setRole(getCurrentUser()?.role ?? null);
  }, []);

  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    router.push("/login");
  };

  const kpis = [
    { label: "Submissions", val: "14,842", change: "+18%", isUp: true, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Blueprints", val: "12,420", change: "+22%", isUp: true, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Conversion", val: "24.2%", change: "+5.2%", isUp: true, icon: MousePointer2, color: "text-primary", bg: "bg-primary/5" },
    { label: "Revenue", val: "$14.2M", change: "+12%", isUp: true, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  if (!role) return null;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
            <Zap className="h-3.5 w-3.5" /> Super Admin Matrix
          </div>
          <h1 className="text-4xl font-headline font-bold text-slate-900">Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">Platform Governance Interface • {role.replace('_', ' ')}</p>
        </div>
        <div className="flex gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border h-11">
            <Activity className="h-4 w-4 text-emerald-500" /> System Healthy
          </div>
          <Button variant="outline" className="text-rose-600 border-rose-200 font-bold h-11" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> End Session</Button>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((s, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", s.bg, s.color)}><s.icon className="h-5 w-5" /></div>
                <div className={cn("flex items-center text-[10px] font-bold px-2 py-1 rounded-full", s.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                  {s.isUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />} {s.change}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.val}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Trade Pipeline Velocity</CardTitle><CardDescription>Leads vs Conversions (Monthly)</CardDescription></div>
            <Link href="/admin/reports"><Button variant="ghost" size="sm" className="text-primary font-bold">BI Reports <ArrowRight className="h-3 w-3 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeVelocityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="leads" fill="#1B4498" radius={[4, 4, 0, 0]} name="Inquiries" />
                <Bar dataKey="converted" fill="#21CEDD" radius={[4, 4, 0, 0]} name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle className="text-lg">Lead Stages</CardTitle></CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={blueprintStageData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {blueprintStageData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {blueprintStageData.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} /> {m.name} ({m.value}%)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Management Grid</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Leads", icon: UserCheck, href: "/admin/leads", count: "14k Profiles", color: "text-blue-600", bg: "bg-blue-50" },
              { name: "Compliance", icon: ShieldCheck, href: "/admin/companies", count: "14 Alerts", color: "text-amber-600", bg: "bg-amber-50" },
              { name: "Global Trade", icon: Globe, href: "/admin/trade", count: "Rules Active", color: "text-emerald-600", bg: "bg-emerald-50" },
              { name: "Config", icon: Settings2, href: "/admin/settings", count: "System Sync", color: "text-slate-600", bg: "bg-slate-100" },
            ].map((item) => (
              <Link key={item.name} href={item.href}>
                <Card className="border-none shadow-sm hover:shadow-md group h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className={cn("p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors", item.bg, item.color)}><item.icon className="h-5 w-5" /></div>
                    <div><h4 className="font-bold text-slate-900 text-sm">{item.name}</h4><p className="text-[9px] font-bold text-slate-400 uppercase">{item.count}</p></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority Queue</h3><Badge className="bg-amber-100 text-amber-700 font-bold text-[9px]">ACTION REQUIRED</Badge></div>
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="divide-y">
              {[
                { name: "Atlas Mining", score: 94, status: "Tier 3 Audit", time: "2h ago" },
                { name: "SinoTrade", score: 88, status: "Rule Conflict", time: "5h ago" },
              ].map((l, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center font-bold text-primary text-xs">{l.name[0]}</div>
                    <div><p className="text-sm font-bold text-slate-900">{l.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{l.time} • Score: {l.score}</p></div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase">{l.status}</Badge>
                </div>
              ))}
            </div>
            <Link href="/admin/leads"><Button variant="ghost" className="w-full text-[10px] font-bold text-slate-400 hover:text-primary h-10 border-t rounded-none">View Full Registry</Button></Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
