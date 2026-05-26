
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Settings2,
  DollarSign,
  TrendingUp,
  History,
  LayoutGrid
} from "lucide-react";
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

export default function AdminMarketingPortal() {
  const [requests] = useState([
    { 
      id: "CMP-882", 
      company: "Atlas Mining Co", 
      type: "HOMEPAGE_BANNER", 
      duration: "30 Days", 
      status: "PENDING", 
      amount: "$1,500",
      date: "2h ago" 
    },
    { 
      id: "CMP-880", 
      company: "SinoTrade Minerals", 
      type: "FEATURED_LISTING", 
      duration: "7 Days", 
      status: "UNDER_REVIEW", 
      amount: "$450",
      date: "5h ago" 
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Ad Inventory & Promotions
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage platform advertising slots, moderate campaigns, and track revenue.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Settings2 className="h-4 w-4" /> Slot Config
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold uppercase">
            <Clock className="h-4 w-4" />
            08 Pending Approvals
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Campaigns", val: "42", icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Inventory Used", val: "68%", icon: LayoutGrid, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Platform Ad Rev", val: "$12.4k", icon: DollarSign, color: "text-primary", bg: "bg-primary/5" },
          { label: "Avg CTR", val: "2.8%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
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
              <Input placeholder="Search Campaign or Company..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Types</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Campaign ID</TableHead>
              <TableHead className="font-bold">Supplier</TableHead>
              <TableHead className="font-bold">Placement Type</TableHead>
              <TableHead className="font-bold">Value</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-primary">{req.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{req.company}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Submitted {req.date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">
                      {req.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-slate-400">({req.duration})</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-900">{req.amount}</TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[10px] font-bold px-2 py-0.5",
                    req.status === "PENDING" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : 
                    req.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  )}>
                    {req.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                        <Eye className="h-4 w-4" /> Review Creative
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <Megaphone className="h-6 w-6 text-primary" />
                          Ad Moderation: {req.id}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-8 py-6">
                        <div className="aspect-[12/4] bg-slate-100 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400">
                          <Eye className="h-8 w-8 mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">Banner Preview Not Uploaded</p>
                          <p className="text-[9px]">Featured listing uses standard product image</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-4 bg-slate-50 rounded-xl border">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Campaign Context</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Supplier Tier</span>
                                <span className="font-bold">Platinum</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Target Asset</span>
                                <span className="font-bold text-primary underline">Copper Fine Listing</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Policy Checks</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Creative Compliant
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Payment Verified
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-between border-t pt-6">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                          <History className="h-3 w-3" /> Moderation actions are logged.
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">Reject Creative</Button>
                          <Button className="bg-primary font-bold px-8">Approve & Activate</Button>
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
    </div>
  );
}
