'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileBadge, 
  Download, 
  ReceiptText, 
  IndianRupee, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  FileDown,
  Building2,
  TrendingUp,
  History,
  Briefcase,
  ChevronRight,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock Data
const COMPLIANCE_SUMMARY = {
  totalTaxPaid: 482500,
  itcAvailable: 385000,
  tdsDeposited: 92500,
  gstCompliantPartners: '94%',
};

const COMPLIANCE_CHECKLIST = [
  { label: 'GSTIN Verified', status: 'VERIFIED', icon: CheckCircle2, color: 'text-emerald-500' },
  { label: 'TDS Returns (Q1)', status: 'FILED', icon: CheckCircle2, color: 'text-emerald-500' },
  { label: 'Vendor PAN Validation', status: 'ACTIVE', icon: CheckCircle2, color: 'text-emerald-500' },
  { label: 'MSME Declaration', status: 'PENDING', icon: Clock, color: 'text-slate-300' },
];

const TAX_INVOICES = [
  { id: 'TX-2024-901', type: 'ESCROW_FUNDING', amount: 500000, gst: 90000, date: '2024-07-01', status: 'PAID' },
  { id: 'TX-2024-855', type: 'SUBSCRIPTION', amount: 9999, gst: 1800, date: '2024-06-15', status: 'PAID' },
  { id: 'TX-2024-720', type: 'ESCROW_FUNDING', amount: 250000, gst: 45000, date: '2024-05-20', status: 'PAID' },
];

export default function BrandTaxPage() {
  const { toast } = useToast();
  const [fy, setFy] = useState('2024-25');

  const handleDownload = (title: string) => {
    toast({
      title: "Generating Report",
      description: `Your ${title} is being compiled from the platform ledger.`,
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <FileBadge className="h-8 w-8 text-primary" />
            Corporate Tax & Compliance
          </h1>
          <p className="text-slate-500 font-medium">Audit GST input credits, TDS deposits, and corporate tax statements.</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={fy} onValueChange={setFy}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-white font-bold border-slate-200 shadow-sm">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue placeholder="Financial Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-25" className="font-bold">FY 2024 - 25</SelectItem>
              <SelectItem value="2023-24" className="font-bold">FY 2023 - 24</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200 shadow-sm" onClick={() => handleDownload("Compliance Report")}>
            <Download className="mr-2 h-4 w-4" /> Fiscal Export
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <Alert className="bg-primary/5 border-primary/10 rounded-3xl p-6">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-black uppercase text-xs tracking-widest ml-2">Corporate Disclaimer</AlertTitle>
        <AlertDescription className="text-slate-600 font-medium text-sm mt-1 ml-2">
          These summaries are calculated based on your platform activity and escrow funding. For official GST returns and TDS challans, please refer to your nodal bank statements and corporate ERP.
        </AlertDescription>
      </Alert>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tax Paid', value: `₹${(COMPLIANCE_SUMMARY.totalTaxPaid / 100000).toFixed(2)}L`, icon: IndianRupee, color: 'text-slate-900', bg: 'bg-slate-100' },
          { label: 'ITC Available', value: `₹${(COMPLIANCE_SUMMARY.itcAvailable / 100000).toFixed(2)}L`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'TDS Deposited', value: `₹${(COMPLIANCE_SUMMARY.tdsDeposited / 1000).toFixed(1)}k`, icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Partner Compliance', value: COMPLIANCE_SUMMARY.gstCompliantPartners, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm rounded-2xl p-6 bg-white group hover:shadow-md transition-shadow">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900">{stat.value}</h3>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Ledger & Documents */}
        <div className="lg:col-span-8 space-y-8">
          
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Platform Tax Invoices</CardTitle>
                <CardDescription>Official invoices for subscription and campaign funding.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px] tracking-widest">
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 h-14">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Date</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Invoice ID</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Amount</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TAX_INVOICES.map((inv) => (
                    <TableRow key={inv.id} className="group hover:bg-slate-50 transition-colors border-slate-50 h-16">
                      <TableCell className="pl-8 font-bold text-slate-500">
                        {new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">{inv.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-400">{inv.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">₹{inv.amount.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-primary uppercase">GST: ₹{inv.gst.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-primary transition-all" onClick={() => handleDownload("Tax Invoice")}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  TDS Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Consolidated TDS deducted on creator payouts for this financial year.
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Deposited</p>
                      <p className="text-xl font-black text-slate-900 mt-1">₹92,500</p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg font-bold h-8 text-[10px] bg-white">Get Challans</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-6 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Compliance Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center py-10">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900">Certificate of Compliance</h4>
                <p className="text-[10px] text-slate-400 uppercase font-black mt-1">Status: Up to date</p>
                <Button variant="ghost" className="mt-4 text-primary font-bold text-xs">Download FY 23-24 Proof</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Checklist & Info */}
        <aside className="lg:col-span-4 space-y-8">
          
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Quarterly Checklist</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {COMPLIANCE_CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-sm font-bold text-slate-600">{item.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-50 text-[10px] font-black uppercase border-none text-slate-400 h-5">{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Building2 className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ReceiptText className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Audit Protection</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  We generate GST-compliant invoices for every transaction. Download your annual bulk package for corporate audit preparation.
                </p>
              </div>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 text-[10px] uppercase tracking-widest shadow-lg">
                Generate Audit Package
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">GST Reconciliation</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Download GSTR-2A matching report to verify vendor invoice uploads for this quarter.
              </p>
            </div>
            <Button variant="link" className="text-xs font-bold text-primary h-auto p-0">Download Report</Button>
          </div>

        </aside>
      </div>
    </div>
  );
}
