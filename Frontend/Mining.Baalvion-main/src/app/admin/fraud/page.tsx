
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  UserX, 
  Ban, 
  Eye,
  ShieldCheck,
  History,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";

export default function AdminFraudDashboard() {
  const [cases] = useState([
    { 
      id: "CASE-9921", 
      target: "SinoTrade Minerals", 
      type: "PRICE_ANOMALY", 
      severity: "HIGH", 
      status: "OPEN", 
      date: "2h ago",
      desc: "Lithium priced at $400/MT (Market: $1,150). Potential scam listing."
    },
    { 
      id: "CASE-9918", 
      target: "User_7721", 
      type: "RFQ_SPAM", 
      severity: "MEDIUM", 
      status: "INVESTIGATING", 
      date: "5h ago",
      desc: "12 RFQs created in 30 minutes for varied minerals. High automation probability."
    },
    { 
      id: "CASE-9915", 
      target: "Global Mining Inc.", 
      type: "IDENTITY_OVERLAP", 
      severity: "CRITICAL", 
      status: "OPEN", 
      date: "1d ago",
      desc: "Company document metadata matches blacklisted entity 'Shadow Metals Ltd'."
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-rose-600" />
            Fraud & Moderation
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Central command for platform safety and integrity enforcement.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <ShieldCheck className="h-4 w-4" /> Safety Rules
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-xs font-bold uppercase">
            <Activity className="h-4 w-4" />
            Active Risk: High
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Cases", val: "14", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "User Reports", val: "42", icon: UserX, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Auto-Blocked", val: "128", icon: Ban, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "False Positives", val: "3%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
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

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search Case ID or Entity..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Risks</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Case ID</TableHead>
              <TableHead className="font-bold">Entity Under Review</TableHead>
              <TableHead className="font-bold">Incident Type</TableHead>
              <TableHead className="font-bold">Risk Level</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-rose-600">{c.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{c.target}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Logged {c.date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-bold tracking-tight">
                    {c.type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                    c.severity === "CRITICAL" ? "bg-rose-600 text-white" :
                    c.severity === "HIGH" ? "bg-rose-100 text-rose-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {c.severity}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[10px] font-bold",
                    c.status === "OPEN" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                  )}>
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                        <Eye className="h-4 w-4" /> Investigate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-rose-600">
                          <AlertTriangle className="h-6 w-6" />
                          Security Investigation: {c.id}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-8 py-6">
                        <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evidence Summary</h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{c.desc}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-900 uppercase">Actor Profile</h4>
                            <div className="p-4 border rounded-xl space-y-3">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Registration Date</span>
                                <span className="font-bold">May 12, 2024</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Verification Level</span>
                                <Badge className="bg-amber-500 h-4 text-[9px]">Tier 1</Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Total Listings</span>
                                <span className="font-bold">1 Active</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-900 uppercase">System Insights</h4>
                            <div className="p-4 border rounded-xl space-y-3 bg-rose-50/30">
                              <div className="flex justify-between text-xs text-rose-700">
                                <span>Risk Score</span>
                                <span className="font-bold">84/100</span>
                              </div>
                              <div className="flex justify-between text-xs text-rose-700">
                                <span>Known IP Match</span>
                                <span className="font-bold">None</span>
                              </div>
                              <div className="flex justify-between text-xs text-rose-700">
                                <span>Bot Behavior</span>
                                <span className="font-bold">Probable</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Internal Investigation Notes</label>
                          <textarea className="w-full h-24 p-3 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Add details from your manual review..." />
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-between border-t pt-6">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                          <History className="h-3 w-3" /> Actions are logged in the Super Audit Log.
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="font-bold">Dismiss Case</Button>
                          <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 font-bold">Issue Warning</Button>
                          <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8">Suspend Account</Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Moderation Actions</CardTitle>
            <CardDescription>Execution log of the last 5 admin interventions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { action: "Listing Removed", target: "Iron Fine Batch #772", admin: "Admin_04", time: "12m ago", type: "FRAUD" },
                { action: "Account Suspended", target: "Global Metals LLC", admin: "System_Auto", time: "45m ago", type: "SCAM" },
                { action: "Warning Issued", target: "Zambia Trade Corp", admin: "Admin_01", time: "2h ago", type: "POLICY" },
                { action: "Access Revoked", target: "User_9921", admin: "Admin_02", time: "5h ago", type: "SPAM" },
              ].map((a, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <History className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.action}: {a.target}</p>
                      <p className="text-[10px] text-slate-500">By {a.admin} • {a.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold">{a.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldAlert className="h-48 w-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
            <CardDescription className="text-slate-400">Automated sentinel status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Bots Detected (24h)</span>
                <span className="font-bold text-primary">142 Attempts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Spam RFQ Blocked</span>
                <span className="font-bold text-emerald-400">842 Events</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Sentinel Uptime</span>
                <span className="font-bold text-emerald-400">99.99%</span>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold border-none h-12 shadow-lg">
              Run Global Integrity Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
