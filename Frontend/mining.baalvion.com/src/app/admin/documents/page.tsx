
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { 
  FileStack, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  MoreVertical,
  ShieldCheck,
  AlertTriangle,
  History
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

export default function AdminDocumentModerationPage() {
  const [queue] = useState([
    { 
      id: "DOC-1021", 
      company: "Atlas Mining Co", 
      type: "BILL_OF_LADING", 
      order: "ORD-9921", 
      status: "PENDING_REVIEW", 
      date: "2h ago",
      risk: "LOW"
    },
    { 
      id: "DOC-1025", 
      company: "Zambia Copper Ltd", 
      type: "QUALITY_CERT", 
      order: "ORD-9930", 
      status: "PENDING_REVIEW", 
      date: "5h ago",
      risk: "MEDIUM"
    },
    { 
      id: "DOC-1030", 
      company: "SinoTrade Minerals", 
      type: "COMMERCIAL_INVOICE", 
      order: "ORD-9912", 
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
            <FileStack className="h-8 w-8 text-primary" />
            Trade Document Hub
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Oversee all legal, technical, and financial documentation across the platform.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <History className="h-4 w-4" /> Global Audit Log
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-xs font-bold uppercase">
            <Clock className="h-4 w-4" />
            24 Pending Reviews
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Pending Review", val: "24", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Verified Today", val: "142", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rejected (MTD)", val: "18", icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "System Auto-Check", val: "99.2%", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/5" },
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
              <Input placeholder="Search Document, Order, or Company..." className="pl-10 h-10 border-slate-200 focus-visible:ring-primary/20" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Types</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Doc ID</TableHead>
              <TableHead className="font-bold">Company & Order</TableHead>
              <TableHead className="font-bold">Document Type</TableHead>
              <TableHead className="font-bold">Risk Level</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-primary">{doc.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{doc.company}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{doc.order}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{doc.type.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold",
                    doc.risk === "LOW" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                  )}>
                    {doc.risk} RISK
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[10px] font-bold px-2 py-0.5",
                    doc.status === "PENDING_REVIEW" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {doc.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                          <Eye className="h-4 w-4" /> Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            Document Audit: {doc.id}
                          </DialogTitle>
                          <CardDescription>System scan complete. Awaiting manual administrative sign-off.</CardDescription>
                        </DialogHeader>
                        
                        <div className="grid md:grid-cols-2 gap-8 py-6">
                          <div className="space-y-6">
                            <div className="aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400">
                              <FileText className="h-12 w-12 mb-2" />
                              <p className="text-sm font-bold uppercase tracking-widest">Document Preview</p>
                              <p className="text-[10px]">PDF Renderer Active</p>
                            </div>
                            <Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" /> Download Original</Button>
                          </div>

                          <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-xl border space-y-4">
                              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">System Insights</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">Metadata Match</span>
                                  <span className="font-bold text-emerald-600">98% Match</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">OCR Extraction</span>
                                  <span className="font-bold">Successful</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">Tampering Detection</span>
                                  <span className="font-bold text-emerald-600">Negative</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4">
                              <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                              <div>
                                <p className="text-sm font-bold text-amber-700">Verification Note</p>
                                <p className="text-xs text-amber-600 leading-relaxed mt-1">
                                  Signature region detected. Ensure the stamp matches the official registry for {doc.company}.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Reviewer Comments</label>
                              <textarea className="w-full h-32 p-3 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Add internal notes or rejection reason..." />
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="sm:justify-between border-t pt-6 mt-4">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                            <History className="h-3 w-3" /> Actions are logged permanently.
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">Reject Document</Button>
                            <Button className="bg-primary font-bold px-8">Verify & Approve</Button>
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
      </Card>
    </div>
  );
}
