
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Gavel, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ArrowRight,
  ShieldAlert,
  Download,
  Scale
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

export default function AdminDisputesPage() {
  const [disputes] = useState([
    { 
      id: "DSP-1001", 
      orderId: "ORD-9921", 
      initiator: "China Const Ltd", 
      type: "QUALITY", 
      status: "UNDER_REVIEW", 
      amount: "$525,000",
      date: "2024-05-18" 
    },
    { 
      id: "DSP-1005", 
      orderId: "ORD-9915", 
      initiator: "Blue Ridge Quarry", 
      type: "PAYMENT", 
      status: "OPEN", 
      amount: "$12,400",
      date: "2024-05-19" 
    },
    { 
      id: "DSP-0992", 
      orderId: "ORD-9882", 
      initiator: "Global Mining Inc.", 
      type: "DELAY", 
      status: "RESOLVED", 
      amount: "$68,500",
      date: "2024-05-10" 
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            Dispute Resolution Center
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage trade conflicts and enforce escrow security policies.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Download className="h-4 w-4" /> Export Resolution Logs
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            Escrow Lockdown Active
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Disputes", val: "14", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Awaiting Admin", val: "06", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved (MTD)", val: "28", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Frozen Funds", val: "$4.2M", icon: Gavel, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
                </div>
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
              <Input placeholder="Search Dispute or Order ID..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> Filters</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Dispute ID</TableHead>
              <TableHead className="font-bold">Order Details</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Value</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map((dispute) => (
              <TableRow key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-primary">{dispute.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{dispute.orderId}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Initiated by {dispute.initiator}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
                    {dispute.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold">{dispute.amount}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[10px] font-bold px-2 py-0.5 uppercase",
                    dispute.status === "OPEN" ? "bg-rose-100 text-rose-700" :
                    dispute.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {dispute.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 group text-primary font-bold">
                        Review Evidence <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <Gavel className="h-6 w-6 text-primary" />
                          Conflict Mediation: {dispute.id}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid md:grid-cols-2 gap-8 py-6">
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 rounded-xl border">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Escrow Context</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Order ID</span>
                                <span className="font-bold">{dispute.orderId}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Secured Value</span>
                                <span className="font-bold text-primary">{dispute.amount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Conflict Reason</span>
                                <span className="font-bold">{dispute.type}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evidence Vault</h4>
                            {[
                              { label: "Material Photo (Buyer)", date: "May 18", file: "IMG_9921.jpg" },
                              { label: "SGS Lab Report (Seller)", date: "May 19", file: "CERT_332.pdf" },
                              { label: "Master Bill of Lading", date: "May 15", file: "BL_772.pdf" },
                            ].map((e, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/5 rounded text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Download className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">{e.label}</p>
                                    <p className="text-[10px] text-slate-500">{e.file} • {e.date}</p>
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300" />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6 flex flex-col">
                          <div className="flex-1 space-y-4 bg-slate-50 p-4 rounded-xl border min-h-[300px] flex flex-col">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mediation Thread</h4>
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                              <div className="p-3 bg-white rounded-xl border text-xs shadow-sm self-start max-w-[85%]">
                                <p className="font-bold text-primary mb-1">Buyer (China Const Ltd)</p>
                                <p className="text-slate-700 leading-relaxed">The mineral grade received is 58% Fe, but the contract stipulated a minimum of 62% Fe. We request a price adjustment.</p>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">10:42 AM</p>
                              </div>
                              <div className="p-3 bg-primary text-white rounded-xl text-xs shadow-sm self-end ml-auto max-w-[85%]">
                                <p className="font-bold mb-1 opacity-80 uppercase tracking-tighter">Seller (Global Mining Inc.)</p>
                                <p className="leading-relaxed">Our pre-shipment SGS report confirms 62.1% Fe at the loading port. We suspect moisture contamination during the sea transit.</p>
                                <p className="text-[9px] text-primary-foreground/60 mt-2 font-bold uppercase text-right">11:15 AM</p>
                              </div>
                            </div>
                            <div className="pt-4 flex gap-2">
                              <Input placeholder="Type mediation message..." className="flex-1 h-10 text-xs border-slate-200" />
                              <Button size="icon" className="bg-primary h-10 w-10"><MessageSquare className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                            <Button variant="outline" className="text-xs font-bold border-rose-200 text-rose-700 hover:bg-rose-50">Full Refund</Button>
                            <Button variant="outline" className="text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50">Release Funds</Button>
                            <Button className="col-span-2 bg-slate-900 text-xs font-bold h-11">Issue Split Decision / Finalize Mediation</Button>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="border-t pt-6">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 italic font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Mediation actions are recorded in the সুপার Audit Log with ID: Admin_9921.
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
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Resolution Intelligence</CardTitle>
            <CardDescription>Outcome of the last 4 closed disputes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { id: "DSP-0990", order: "ORD-8812", outcome: "REFUNDED", amount: "$120,000", time: "2h ago" },
                { id: "DSP-0988", order: "ORD-8810", outcome: "RELEASED", amount: "$85,000", time: "5h ago" },
                { id: "DSP-0985", order: "ORD-8799", outcome: "SPLIT", amount: "$22,000", time: "1d ago" },
                { id: "DSP-0982", order: "ORD-8790", outcome: "RELEASED", amount: "$1.2M", time: "2d ago" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white border shadow-sm flex items-center justify-center text-[10px] font-bold text-primary">
                      {r.outcome[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.id}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{r.order} • {r.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{r.amount}</p>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      r.outcome === 'REFUNDED' ? 'text-rose-600' : 'text-emerald-600'
                    )}>{r.outcome}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Scale className="h-48 w-48" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg">Risk Sentinel</CardTitle>
            <CardDescription className="text-slate-400">High-priority conflict monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Frequent Quality Issues</span>
                <span className="font-bold text-rose-400">3 Companies Flagged</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Escrow Intervention Rate</span>
                <span className="font-bold text-amber-400">5.2% Overall</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg. Resolution Latency</span>
                <span className="font-bold text-emerald-400">18.4 Hours</span>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" /> Policy Enforcement
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                High-frequency disputes trigger an automatic suspension of Tier 3 verified status.
              </p>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold border-none h-12 shadow-lg">
              Generate Detailed Conflict Audit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
