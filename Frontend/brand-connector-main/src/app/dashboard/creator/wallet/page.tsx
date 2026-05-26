'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  History,
  Plus,
  ShieldCheck,
  Loader2,
  ChevronRight,
  MoreHorizontal,
  Download,
  Building2,
  Zap,
  Check,
  Smartphone,
  Globe,
  ArrowRight,
  ArrowLeft,
  Activity
} from 'lucide-react';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { TransactionHistory } from '@/components/payments/TransactionHistory';
import { requestPayout, getPayoutStep } from '@/lib/payouts';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui';

type PayoutStep = 'amount' | 'method' | 'confirm' | 'otp' | 'processing' | 'success';

export default function CreatorWalletPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<PayoutStep>('amount');
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [otpValue, setOtpValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Transactions
  const txQuery = useMemo(() => {
    if (!currentUser?.id) return null;
    return query(
      collection(db!, 'transactions'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );
  }, [db!, currentUser?.id]);

  const { data: transactions, loading: txLoading } = useCollection<any>(txQuery);

  // Find most recent pending payout for tracker
  const activePayout = useMemo(() => {
    return (transactions || []).find(tx => tx.type === 'PAYOUT' && tx.status === 'PENDING');
  }, [transactions]);

  const stats = {
    available: 62500,
    pending: 12500,
    total: 422500
  };

  const handleNextStep = () => {
    const val = Number(amount);
    if (currentStep === 'amount') {
      if (isNaN(val) || val < 500) {
        return toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Minimum withdrawal is ₹500.' });
      }
      if (val > stats.available) {
        return toast({ variant: 'destructive', title: 'Insufficient Funds', description: "You don't have enough available balance." });
      }
      setCurrentStep('method');
    } else if (currentStep === 'method') {
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      setCurrentStep('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) {
      return toast({ variant: 'destructive', title: 'Verification Error', description: 'Please enter the 6-digit code sent to your phone.' });
    }

    setCurrentStep('processing');
    setIsSubmitting(true);

    try {
      await requestPayout(db!, {
        creatorId: currentUser!.id,
        amount: Number(amount),
        method: payoutMethod as any,
        target: payoutMethod === 'upi' ? 'sarah@okaxis' : payoutMethod === 'bank' ? 'HDFC ****4242' : 'sarah.chen@payoneer.com'
      });

      setTimeout(() => {
        setCurrentStep('success');
        setIsSubmitting(false);
      }, 2000);
    } catch (err) {
      setCurrentStep('confirm');
      setIsSubmitting(false);
    }
  };

  const resetWithdrawFlow = () => {
    setIsWithdrawModalOpen(false);
    setTimeout(() => {
      setCurrentStep('amount');
      setAmount('');
      setOtpValue('');
    }, 300);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Wallet</h1>
          <p className="text-slate-500 font-medium">Manage your earnings, payouts, and campaign financial security.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" />
            Statements
          </Button>

          <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
                <ArrowUpRight className="mr-2 h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none max-w-lg shadow-2xl">
              <AnimatePresence mode="wait">
                {currentStep === 'amount' && (
                  <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 space-y-8">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">Withdraw Amount</DialogTitle>
                      <DialogDescription className="font-medium">How much would you like to transfer to your account?</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <Label className="font-bold text-slate-700">Amount (₹)</Label>
                          <span className="text-[10px] font-black text-primary uppercase">Available: ₹{stats.available.toLocaleString()}</span>
                        </div>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                          <Input
                            type="number"
                            placeholder="5,000"
                            className="h-16 pl-12 rounded-2xl text-2xl font-black border-slate-100 bg-slate-50 focus-visible:ring-primary"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Minimum withdrawal ₹500</p>
                      </div>
                      <Button onClick={handleNextStep} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'method' && (
                  <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 space-y-8">
                    <DialogHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentStep('amount')}>
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <DialogTitle className="text-2xl font-black">Payout Method</DialogTitle>
                      </div>
                      <DialogDescription className="font-medium">Select your preferred destination for the funds.</DialogDescription>
                    </DialogHeader>
                    <RadioGroup defaultValue="upi" onValueChange={setPayoutMethod} className="grid grid-cols-1 gap-4">
                      {[
                        { id: 'upi', label: 'UPI ID', desc: 'Instant transfer to your VPA', icon: Zap, color: 'text-indigo-600', val: 'sarah@okaxis' },
                        { id: 'bank', label: 'Bank Transfer', desc: '2-4 hours to settle', icon: Building2, color: 'text-emerald-600', val: 'HDFC Bank ****4242' },
                        { id: 'payoneer', label: 'Payoneer', desc: 'Global payout (USD conversion)', icon: Globe, color: 'text-orange-600', val: 'sarah.chen@global.com' },
                      ].map((m) => (
                        <div key={m.id}>
                          <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                          <Label htmlFor={m.id} className={cn(
                            "flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 bg-white cursor-pointer transition-all hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                            payoutMethod === m.id && "border-primary bg-primary/5 shadow-md"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className={cn("h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0", m.color)}>
                                <m.icon className="h-6 w-6" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900">{m.label}</p>
                                <p className="text-xs text-slate-400 font-medium">{m.desc}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-slate-300">Account</p>
                              <p className="text-xs font-bold text-slate-600 truncate max-w-[100px]">{m.val}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button onClick={handleNextStep} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                      Confirm Method <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                {currentStep === 'confirm' && (
                  <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="p-10 space-y-8">
                    <DialogHeader className="text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                      </div>
                      <DialogTitle className="text-2xl font-black">Confirm Details</DialogTitle>
                      <DialogDescription className="font-medium">Please verify the payout information below.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Amount</span>
                        <span className="text-2xl font-black text-slate-900">₹{Number(amount).toLocaleString()}</span>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Method</span>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 uppercase">{payoutMethod}</p>
                          <p className="text-xs text-slate-500 font-medium">{payoutMethod === 'bank' ? 'HDFC Bank ****4242' : 'sarah@okaxis'}</p>
                        </div>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fee</span>
                        <span className="text-sm font-bold text-emerald-600">₹0.00 (PRO)</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200" onClick={() => setCurrentStep('method')}>Back</Button>
                      <Button onClick={handleNextStep} className="flex-2 h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
                        Authorize Payout
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 space-y-8">
                    <DialogHeader className="text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                        <Smartphone className="h-8 w-8 text-orange-500" />
                      </div>
                      <DialogTitle className="text-2xl font-black">Identity Verification</DialogTitle>
                      <DialogDescription className="font-medium">A 6-digit code was sent to your registered phone number.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Input
                          placeholder="0 0 0 0 0 0"
                          className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl bg-slate-50 border-slate-100"
                          maxLength={6}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                        />
                        <button className="w-full text-xs font-bold text-primary hover:underline uppercase tracking-widest mt-2">Resend Code</button>
                      </div>
                      <Button
                        disabled={otpValue.length < 6}
                        onClick={handleVerifyOtp}
                        className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
                      >
                        Verify & Transfer
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 flex flex-col items-center text-center space-y-8">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                      <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black">Securing Funds</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Verifying transaction integrity and communicating with the payment gateway.</p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'success' && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-12 flex flex-col items-center text-center space-y-8">
                    <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                      <CheckCircle2 className="h-14 w-14" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black">Transfer Initiated!</h3>
                      <p className="text-slate-500 font-medium">₹{Number(amount).toLocaleString()} is on its way to your account.</p>
                    </div>

                    <div className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-left">
                      <Clock className="h-10 w-10 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-tighter">Estimated Arrival</p>
                        <p className="font-bold text-slate-900">Within {payoutMethod === 'upi' ? '5 minutes' : '2 - 4 business hours'}</p>
                      </div>
                    </div>

                    <Button onClick={resetWithdrawFlow} className="w-full h-14 rounded-2xl font-bold text-lg bg-slate-900 hover:bg-slate-800 text-white">
                      Got it, Thanks!
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payout Progress Tracker (Active Only) */}
      <AnimatePresence>
        {activePayout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-none shadow-xl shadow-primary/5 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-primary/10">
              <CardHeader className="p-8 border-b bg-primary/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Active Payout Tracker</CardTitle>
                    <CardDescription className="text-xs font-bold text-primary uppercase">Ref: #{activePayout.id.substring(0, 8)}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Transferring</p>
                  <p className="text-2xl font-black text-slate-900">₹{activePayout.amount.toLocaleString()}</p>
                </div>
              </CardHeader>
              <CardContent className="p-8 lg:p-12">
                <div className="relative py-10">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-[2000ms] ease-out"
                    style={{ width: `${(getPayoutStep(activePayout.status, activePayout.payoutMethod?.type) / 4) * 100}%` }}
                  />

                  <div className="relative flex justify-between">
                    {[
                      { label: 'Request Received', active: true },
                      { label: 'Clearing System', active: getPayoutStep(activePayout.status, activePayout.payoutMethod?.type) >= 2 },
                      { label: 'Bank Settlement', active: getPayoutStep(activePayout.status, activePayout.payoutMethod?.type) >= 3 },
                      { label: 'Funds Arrived', active: getPayoutStep(activePayout.status, activePayout.payoutMethod?.type) >= 4 }
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className={cn(
                          "h-10 w-10 rounded-full border-4 flex items-center justify-center z-10 transition-colors duration-500",
                          step.active ? "bg-primary border-white text-white shadow-lg" : "bg-white border-slate-100 text-slate-300"
                        )}>
                          {step.active ? <Check className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                          step.active ? "text-primary" : "text-slate-400"
                        )}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Estimated Settlement</p>
                      <p className="text-[10px] text-slate-500 font-medium">Funds usually arrive within 2-4 hours for {activePayout.payoutMethod?.type.toUpperCase()} transfers.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white h-10 px-6 border-slate-200">
                    Get Help with Payout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Balance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-slate-950 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Available Balance</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">₹{stats.available.toLocaleString()}</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] tracking-widest">+15%</Badge>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-4 flex items-center gap-2 uppercase tracking-tighter">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Funds fully cleared and ready for payout
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pending Clearance</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">₹{stats.pending.toLocaleString()}</span>
              <div className="h-2 w-2 rounded-full bg-orange-50 animate-pulse" />
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <span>Verification Stage</span>
                <span>Audit in Progress</span>
              </div>
              <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total Lifetime Earned</CardTitle>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-primary">₹{stats.total.toLocaleString()}</span>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-primary font-bold leading-relaxed">
                You're in the top 5% of creators this month! Keep up the quality work.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shared Transaction History Component */}
      <TransactionHistory
        data={transactions || []}
        loading={txLoading}
        title="Personal Earnings Ledger"
        description="Comprehensive audit of campaign payouts, milestone releases, and platform settlements."
      />

      {/* Financial Security Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Escrow Protected</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every campaign payment is secured in Baalvion Escrow before you start work. Your efforts are guaranteed to be compensated upon brand approval.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Clearing Period</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Funds typically clear 48 hours after brand approval to ensure marketplace compliance and quality assurance for our partners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
