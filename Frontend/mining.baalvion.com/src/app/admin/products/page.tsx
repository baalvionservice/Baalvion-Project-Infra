"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { 
  PackageSearch, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  MoreVertical,
  Gem,
  History,
  ShieldCheck
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

export default function AdminProductModeration() {
  const [listings] = useState([
    { 
      id: "LST-882", 
      product: "Iron Ore Fine", 
      grade: "62% Fe", 
      supplier: "Atlas Mining", 
      status: "PENDING", 
      date: "2h ago",
      risk: "LOW"
    },
    { 
      id: "LST-880", 
      product: "Lithium Spodumene", 
      grade: "SC 6.0", 
      supplier: "SinoTrade", 
      status: "FLAGGED", 
      date: "5h ago",
      risk: "HIGH"
    },
    { 
      id: "LST-875", 
      product: "Copper Cathodes", 
      grade: "99.99%", 
      supplier: "Zambia Copper", 
      status: "VERIFIED", 
      date: "1d ago",
      risk: "LOW"
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <PackageSearch className="h-8 w-8 text-primary" />
            Product Moderation
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Verify industrial listings and enforce material grade accuracy.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <History className="h-4 w-4" /> Moderation Log
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold uppercase">
            <AlertTriangle className="h-4 w-4" />
            08 Flagged Listings
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Pending Review", val: "14", icon: PackageSearch, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Verified Today", val: "142", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Auto-Flagged", val: "05", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Risk Coverage", val: "99.2%", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5" },
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
              <Input placeholder="Search Listing ID, Supplier..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Grades</Button>
          </div>
        </CardHeader>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Listing ID</TableHead>
                <TableHead className="font-bold">Product & Grade</TableHead>
                <TableHead className="font-bold">Supplier</TableHead>
                <TableHead className="font-bold">Risk Level</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((lst) => (
                <TableRow key={lst.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="font-bold text-primary">{lst.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{lst.product}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">{lst.grade}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">{lst.supplier}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      lst.risk === "HIGH" ? "border-rose-200 text-rose-700 bg-rose-50" : "border-emerald-200 text-emerald-700 bg-emerald-50"
                    )}>
                      {lst.risk} RISK
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      lst.status === "PENDING" ? "bg-blue-100 text-blue-700" : 
                      lst.status === "FLAGGED" ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {lst.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                            <Eye className="h-4 w-4" /> Inspect
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                              <Gem className="h-6 w-6 text-primary" />
                              Technical Audit: {lst.id}
                            </DialogTitle>
                            <CardDescription>Cross-referencing supplier extraction capacity with listed quantity.</CardDescription>
                          </DialogHeader>
                          <div className="grid md:grid-cols-2 gap-8 py-6">
                            <div className="space-y-6">
                              <div className="aspect-video bg-slate-100 rounded-xl border flex flex-col items-center justify-center text-slate-400">
                                <PackageSearch className="h-12 w-12 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Listing Image</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase">Supplier Verification</h4>
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                                  <ShieldCheck className="h-4 w-4" /> Tier 3 Verified Miner
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">License ML-7721 verified and active until 2026.</p>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Auto-Detection Insights</Label>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center text-xs text-amber-700 font-bold">
                                    <span>Price Index Match</span>
                                    <span>-12.4%</span>
                                  </div>
                                  <p className="text-[10px] text-amber-600 leading-relaxed">Price is within 15% of Nexus Spot Index for {lst.grade}.</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Moderator Comments</Label>
                                <textarea className="w-full h-32 p-3 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Add internal review notes..." />
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between border-t pt-6">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 italic"><History className="h-3 w-3" /> Actions are logged.</div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="text-rose-600 border-rose-200 font-bold">Flag for Fraud</Button>
                              <Button className="bg-primary font-bold px-8">Verify Listing</Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}
