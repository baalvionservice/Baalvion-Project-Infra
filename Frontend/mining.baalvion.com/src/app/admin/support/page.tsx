
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter,
  ArrowRight,
  ShieldCheck,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminSupportDashboard() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState([
    { id: "TKT-1021", user: "John Doe", company: "Atlas Mining", subject: "KYC Level 3 Rejection Inquiry", priority: "HIGH", status: "OPEN", time: "2h ago" },
    { id: "TKT-1018", user: "Li Wei", company: "SinoTrade", subject: "Payment Milestone Not Releasing", priority: "CRITICAL", status: "IN_PROGRESS", time: "5h ago" },
    { id: "TKT-1015", user: "Sara Smith", company: "Logistics Pro", subject: "Account Access Issue", priority: "MEDIUM", status: "AWAITING_USER", time: "1d ago" },
  ]);

  const handleResolve = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Ticket Resolved",
      description: `Support case ${id} has been finalized and archived.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Support Governance
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage user inquiries, technical assistance, and industrial mediation.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="h-12 px-6 flex items-center gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold uppercase tracking-widest">
            <CheckCircle2 className="h-4 w-4" /> 98% CSAT Score
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Tickets", val: tickets.length.toString(), icon: LifeBuoy, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg. Response", val: "1.2h", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved (MTD)", val: "142", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Critical Flags", val: "03", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
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
              <Input placeholder="Search user, company, or ID..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Status</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Ticket ID</TableHead>
              <TableHead className="font-bold">Entity Details</TableHead>
              <TableHead className="font-bold">Subject</TableHead>
              <TableHead className="font-bold">Priority</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Audit Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                <TableCell className="font-mono text-[10px] font-bold text-primary">{t.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-xs">{t.user}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{t.company}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{t.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Opened {t.time}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold tracking-widest uppercase",
                    t.priority === "CRITICAL" ? "border-rose-200 text-rose-700 bg-rose-50" : 
                    t.priority === "HIGH" ? "border-amber-200 text-amber-700 bg-amber-50" :
                    "border-blue-200 text-blue-700 bg-blue-50"
                  )}>
                    {t.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                    t.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                    t.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {t.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-primary font-bold text-[10px] uppercase gap-2 group/btn hover:bg-primary/5">
                        Respond <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                          <LifeBuoy className="h-6 w-6 text-primary" />
                          Issue Mediation: {t.id}
                        </DialogTitle>
                        <DialogDescription>Direct terminal for resolving company-level technical or financial issues.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-6 border-y my-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</p>
                              <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold">{t.company}</Badge>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">"We uploaded the Tier 3 license three times but the automated OCR keeps flagging the seal as invalid. This is blocking our Iron Ore export."</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Resolution / Response</label>
                          <textarea className="w-full h-32 p-3 text-sm rounded-xl border bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Provide technical feedback or confirm manual override..." />
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-blue-600" />
                          <p className="text-xs text-blue-700 font-bold uppercase tracking-tighter">Verified session action will be logged globally.</p>
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic"><History className="h-3.5 w-3.5" /> Immutable ledger active</div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="font-bold">Transfer Ticket</Button>
                          <Button onClick={() => handleResolve(t.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">Finalize & Resolve</Button>
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

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <MessageSquare className="h-48 w-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg">Real-time Assistance</CardTitle>
            <CardDescription className="text-slate-400">Live chat performance metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-secondary">42s</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-widest">First Response</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">94%</p>
                <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-widest">Success Rate</p>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg border-none">
              Launch Agent Console
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Compliance Spike Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4">
              <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-700 uppercase tracking-tighter">Verification Anomaly</p>
                <p className="text-xs text-amber-600 leading-relaxed mt-1 font-medium">
                  Abnormal increase in Tier 3 verification requests from West Africa trade region. System has flagged 12 new IDs for manual review.
                </p>
              </div>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-4">
              <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-700 uppercase tracking-tighter">Fraud Sentinel Alert</p>
                <p className="text-xs text-rose-600 leading-relaxed mt-1 font-medium">
                  System detected overlapping IP metadata between 3 active dispute initiators. Immediate investigation recommended.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
