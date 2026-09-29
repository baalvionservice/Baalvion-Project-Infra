
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flag, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Filter,
  Ban,
  History,
  Eye,
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

export default function AdminReviewsPage() {
  const [reports] = useState([
    { 
      id: "REP-772", 
      reviewId: "REV-105", 
      reporter: "Global Mining Inc.", 
      target: "User_9921", 
      reason: "False Information", 
      status: "PENDING",
      date: "3h ago",
      comment: "The reviewer claims the grade was 58% but our lab report clearly shows 62%."
    },
    { 
      id: "REP-770", 
      reviewId: "REV-092", 
      reporter: "Blue Ridge Quarry", 
      target: "Admin_Test", 
      reason: "Inappropriate Content", 
      status: "UNDER_REVIEW",
      date: "1d ago",
      comment: "Review contains unprofessional language regarding our site manager."
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Review Moderation
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Investigate reported feedback and maintain marketplace integrity.</p>
        </div>
        <Button variant="outline" className="gap-2 border-slate-300">
          <Scale className="h-4 w-4" /> Global Policy Settings
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Pending Reports", val: "14", icon: Flag, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "High Risk Flags", val: "08", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Removed (MTD)", val: "22", icon: Trash2, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Auto-Filtered", val: "142", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
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
              <Input placeholder="Search reports or Review IDs..." className="pl-10 h-10 border-slate-200" />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> Advanced Filters</Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-slate-900">Report ID</TableHead>
              <TableHead className="font-bold text-slate-900">Flag Reason</TableHead>
              <TableHead className="font-bold text-slate-900">Reporter</TableHead>
              <TableHead className="font-bold text-slate-900">Timeline</TableHead>
              <TableHead className="font-bold text-slate-900">Status</TableHead>
              <TableHead className="font-bold text-right text-slate-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-primary">{report.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{report.reason}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Review ID: {report.reviewId}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-700">{report.reporter}</TableCell>
                <TableCell className="text-xs text-slate-500 font-medium">{report.date}</TableCell>
                <TableCell>
                  <Badge variant={report.status === "PENDING" ? "outline" : "secondary"} className={cn(
                    "text-[10px] font-bold px-2 py-0.5",
                    report.status === "PENDING" ? "border-amber-200 text-amber-700 bg-amber-50" : "bg-blue-50 text-blue-700"
                  )}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                          <Eye className="h-4 w-4" /> Investigate
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                            Moderation Case: {report.id}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Reporter Claims</p>
                              <p className="text-sm text-slate-700 italic">"{report.comment}"</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border">
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Review Content</p>
                              <p className="text-sm text-slate-700">"The mineral grade received was far below the standard promised in the RFQ."</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-900 uppercase">System Context</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 border rounded-lg text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Order ID</p>
                                <p className="text-sm font-bold text-primary">ORD-9921</p>
                              </div>
                              <div className="p-3 border rounded-lg text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Buyer Rating</p>
                                <p className="text-sm font-bold text-amber-600">4.2 / 5</p>
                              </div>
                              <div className="p-3 border rounded-lg text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase">Seller Rating</p>
                                <p className="text-sm font-bold text-emerald-600">4.9 / 5</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="sm:justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                            <CheckCircle2 className="h-3 w-3" /> All moderation logs are permanent.
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">Remove Review</Button>
                            <Button className="bg-primary font-bold">Dismiss Flag</Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50"><Ban className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-emerald-500 hover:bg-emerald-50"><CheckCircle2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Policy Alerts</CardTitle>
            <CardDescription>AI-detected patterns suggesting review manipulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-4">
              <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-700">Potential Rating Ring Detected</p>
                <p className="text-xs text-rose-600 leading-relaxed mt-1">
                  Three companies (ID: 882, 885, 901) have exchanged 5-star reviews within 10 minutes of order completion over 12 consecutive trades.
                </p>
                <div className="flex gap-3 mt-4">
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-700 font-bold">Freeze Accounts</Button>
                  <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 font-bold">Manual Audit</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <History className="h-48 w-48" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Moderation Intelligence</CardTitle>
            <CardDescription className="text-slate-400">Monthly integrity performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Disputed Reviews Resolved</span>
                <span className="font-bold text-emerald-400">84% Accuracy</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg. Moderation Speed</span>
                <span className="font-bold text-amber-400">4.2 Hours</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Repeated Offenders Blocked</span>
                <span className="font-bold text-rose-400">12 Companies</span>
              </div>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold border-none h-12">
              Generate Detailed Integrity Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
