
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  IndianRupee, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Download,
  Filter,
  Zap,
  Loader2,
  TrendingUp,
  History,
  MoreVertical
} from 'lucide-react';
import { usePaymentStore } from '@/store/usePaymentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function FinancialManagementPage() {
  const { payments, loading, fetchPayments, releasePayment } = usePaymentStore();

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalInEscrow = payments
    .filter(p => p.status === 'escrow')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-slate-100 text-slate-500">Awaiting</Badge>;
      case 'paid': return <Badge className="bg-blue-100 text-blue-600">Processing</Badge>;
      case 'escrow': return <Badge className="bg-orange-100 text-orange-600">In Escrow</Badge>;
      case 'released': return <Badge className="bg-emerald-100 text-emerald-600">Released</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-primary" />
            Treasury & Escrow
          </h1>
          <p className="text-slate-500 font-medium">Global platform economics, revenue auditing, and escrow holds.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200 shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export Ledger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Secured Escrow</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">₹{totalInEscrow.toLocaleString()}</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase mt-4">
            <ShieldCheck className="h-3 w-3" /> Funds Audited
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl p-6 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Transactions</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{payments.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-4">Last 24 hours</p>
        </Card>
        <Card className="border-none shadow-xl shadow-primary/10 rounded-2xl p-6 bg-slate-900 text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Revenue</p>
          <h3 className="text-3xl font-black text-white mt-1">₹{(totalInEscrow * 0.15).toLocaleString()}</h3>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase mt-4">
            <TrendingUp className="h-3 w-3" /> +12.5% vs LW
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Global Ledger</CardTitle>
            <CardDescription>Real-time audit trail of all marketplace movements.</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search company..." className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="h-14 border-slate-100 hover:bg-transparent">
                <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Company</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Amount</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Method</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Control</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
              ) : payments.map((pay) => (
                <TableRow key={pay.id} className="h-20 border-slate-50 group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{pay.companyName}</span>
                      <span className="text-[10px] text-slate-400 uppercase">TXN: {pay.transactionId || '---'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-black">₹{pay.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(pay.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">{pay.method || '---'}</span>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    {pay.status === 'escrow' && (
                      <Button 
                        size="sm" 
                        className="rounded-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => releasePayment(pay.id)}
                      >
                        Release Funds
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
