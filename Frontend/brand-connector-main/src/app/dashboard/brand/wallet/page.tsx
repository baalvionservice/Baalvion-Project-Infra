
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  History, 
  Download, 
  Filter, 
  Search, 
  IndianRupee, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  ChevronRight,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TransactionHistory } from '@/components/payments/TransactionHistory';
import { formatCurrency, fromBase } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { BrandProfile } from '@/types';

// Mock Data for Spend Chart
const SPEND_DATA = [
  { month: 'Feb', amount: 45000 },
  { month: 'Mar', amount: 120000 },
  { month: 'Apr', amount: 85000 },
  { month: 'May', amount: 160000 },
  { month: 'Jun', amount: 210000 },
  { month: 'Jul', amount: 185000 },
];

export default function BrandWalletPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();
  
  const brandId = currentUser?.id ? `brand_${currentUser.id}` : null;
  const { data: brand } = useDoc<BrandProfile>(brandId ? `brands/${brandId}` : null);
  const preferredCurrency = brand?.currency || 'INR';

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  // 1. Fetch Real-time Transactions
  const txQuery = useMemo(() => {
    if (!currentUser?.id) return null;
    return query(
      collection(db!, 'transactions'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );
  }, [db!, currentUser?.id]);

  const { data: transactions, loading: txLoading } = useCollection<any>(txQuery);

  const stats = {
    totalSpent: 842500,
    escrowed: 125000,
    available: 45000,
  };

  const handleDeposit = () => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    toast({
      title: "Deposit Initiated",
      description: `${formatCurrency(Number(depositAmount), preferredCurrency)} is being added to your available credit.`,
    });
    setIsDepositOpen(false);
    setDepositAmount('');
  };

  const convertedSpendData = useMemo(() => 
    SPEND_DATA.map(d => ({ ...d, amount: fromBase(d.amount, preferredCurrency) })),
    [preferredCurrency]
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Treasury</h1>
          <p className="text-slate-500 font-medium">Manage your marketing capital and track escrowed campaign funds.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Download Yearly Report
          </Button>
          
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
                <Plus className="mr-2 h-4 w-4 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
              <DialogHeader>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black">Top Up Credit</DialogTitle>
                <DialogDescription>Add funds to your available credit to launch new campaigns instantly.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold text-slate-700">Deposit Amount ({preferredCurrency})</Label>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[10px] h-5">BASE: INR</Badge>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      {preferredCurrency}
                    </div>
                    <Input 
                      type="number" 
                      placeholder="50,000" 
                      className="h-16 pl-16 rounded-2xl text-2xl font-black border-slate-100 bg-slate-50"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Lumina Corporate (SBI ****9012)</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold text-xs uppercase tracking-widest">Change</Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleDeposit} className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20">
                  Confirm Deposit <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-slate-950 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Campaign Spend</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{formatCurrency(fromBase(stats.totalSpent, preferredCurrency), preferredCurrency)}</span>
              <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest uppercase">Portfolio</Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Allocated efficiently across platforms
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Funds in Escrow</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{formatCurrency(fromBase(stats.escrowed, preferredCurrency), preferredCurrency)}</span>
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold mt-4">Secured for active campaign milestones</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Available Credit</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-600">{formatCurrency(fromBase(stats.available, preferredCurrency), preferredCurrency)}</span>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                Ready to fund upcoming creative partnerships.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Spend Chart */}
        <div className="lg:col-span-12 space-y-8">
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Spending Trajectory</CardTitle>
                <CardDescription>Monthly marketing capital allocation in {preferredCurrency}</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border shadow-sm">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investment</span>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={convertedSpendData}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C3AE8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6C3AE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                      tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6C3AE8" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorSpend)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Shared Transaction History Component */}
          <TransactionHistory 
            data={transactions} 
            loading={txLoading} 
            title="Corporate Transaction Ledger"
            description="Complete audit trail of deposits, escrow holds, and platform fees."
            currency={preferredCurrency}
          />
        </div>
      </div>

      {/* Financial Security Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Escrow Protected</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every campaign payment is secured in Baalvion Escrow before work starts. Capital is only released upon your final approval of assets.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Multi-Currency Clearance</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              All transactions are settled using real-time interbank rates to ensure you always have the most accurate financial overview.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
