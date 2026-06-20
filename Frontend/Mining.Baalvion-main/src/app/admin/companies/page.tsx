
"use client"

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter,
  Clock,
  History,
  FileSearch
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminCompanyVerificationPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([
    { 
      id: "KYC-882", 
      company: "Atlas Mining Co", 
      country: "Australia", 
      level: 3, 
      status: "PENDING", 
      risk: "Low",
      docs: [
        { name: "Mining License #ML-7721", status: "PENDING", expiry: "Dec 2026" },
        { name: "Export Permit #EXP-442", status: "VERIFIED", expiry: "Jun 2025" },
        { name: "Tax Registration Cert", status: "VERIFIED", expiry: "N/A" }
      ],
      date: "2h ago" 
    },
    { 
      id: "KYC-880", 
      company: "SinoTrade Minerals", 
      country: "China", 
      level: 2, 
      status: "UNDER_REVIEW", 
      risk: "Medium",
      docs: [
        { name: "Business Registration", status: "PENDING", expiry: "N/A" },
        { name: "VAT ID Verification", status: "VERIFIED", expiry: "N/A" }
      ],
      date: "5h ago" 
    },
    { 
      id: "KYC-875", 
      company: "Zambia Copper Ltd", 
      country: "Zambia", 
      level: 3, 
      status: "VERIFIED", 
      risk: "Low",
      docs: [
        { name: "All Documents Verified", status: "VERIFIED", expiry: "Various" }
      ],
      date: "1d ago" 
    },
  ]);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'approve' ? "VERIFIED" : "REJECTED" } : r));
    toast({
      title: action === 'approve' ? "Entity Verified" : "Application Rejected",
      description: `Action applied to request ${id} and logged permanently.`,
      variant: action === 'reject' ? "destructive" : "default"
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Compliance Governance
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Central command for KYC Level 2 & 3 industrial audits and sanctions screening.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <History className="h-4 w-4" /> Export Audit Log
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 text-xs font-bold uppercase">
            <Clock className="h-4 w-4" />
            {requests.filter(r => r.status !== 'VERIFIED' && r.status !== 'REJECTED').length} Pending Reviews
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search Company or KYC ID..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Tiers</Button>
          </div>
        </CardHeader>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Verification ID</TableHead>
                <TableHead className="font-bold">Entity Details</TableHead>
                <TableHead className="font-bold">Tier</TableHead>
                <TableHead className="font-bold">Risk Level</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Audit Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-primary">{req.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{req.company}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{req.country}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold">Level {req.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                      req.risk === "Low" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>{req.risk} Risk</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[10px] font-bold px-2 py-0.5",
                      req.status === "PENDING" ? "bg-amber-100 text-amber-700" : 
                      req.status === "UNDER_REVIEW" ? "bg-blue-100 text-blue-700" : 
                      req.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                          <FileSearch className="h-4 w-4" /> Start Audit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-primary" />
                            Compliance Audit: {req.company}
                          </DialogTitle>
                          <DialogDescription>Review individual document authenticity and sanctions data.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-8 py-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Verification Goal</p>
                              <p className="text-lg font-bold text-primary">Tier {req.level} Access</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">Sanctions Check</p>
                              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                <CheckCircle2 className="h-4 w-4" /> Clear
                              </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">AI Fraud Score</p>
                              <p className="text-lg font-bold">04 / 100</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" /> Document Verification Queue
                            </h4>
                            <div className="space-y-3">
                              {req.docs.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                                      <FileSearch className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold">{doc.name}</p>
                                      <p className="text-[10px] text-slate-500">Expiry: {doc.expiry} • OCR Confidence: 98%</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary uppercase">View PDF</Button>
                                    <Badge variant="outline" className={cn(
                                      "text-[9px] font-bold",
                                      doc.status === "VERIFIED" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                                    )}>
                                      {doc.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                            <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" /> Internal Audit Note
                            </h4>
                            <textarea className="w-full h-24 p-3 text-xs bg-white rounded-lg border border-blue-100 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Add notes about this company's compliance history..." />
                          </div>
                        </div>
                        <DialogFooter className="sm:justify-between border-t pt-6">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic"><ShieldCheck className="h-3 w-3" /> All actions are recorded in the system audit logs.</div>
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">Reject Application</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Compliance Application?</AlertDialogTitle>
                                  <AlertDialogDescription>This will freeze the account and notify the company. They will need to re-submit docs.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAction(req.id, 'reject')} className="bg-rose-600">Confirm Rejection</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button onClick={() => handleAction(req.id, 'approve')} className="bg-primary font-bold px-8 shadow-lg">
                              Approve Tier {req.level} Access
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
