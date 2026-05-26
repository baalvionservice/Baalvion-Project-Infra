
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  Download,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
  History,
  Star,
  Plus
} from 'lucide-react';
import { useBillingStore } from '@/store/useBillingStore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlanTier } from '@/types/billing';

export default function BrandBillingDashboard() {
  const { currentUser } = useAuth();
  const {
    plans,
    subscription,
    invoices,
    fetchPlans,
    fetchSubscription,
    fetchInvoices,
    subscribe,
    cancel,
    loading
  } = useBillingStore();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
    fetchInvoices();
  }, []);

  const handleUpgrade = async (plan: PlanTier) => {
    await subscribe(plan);
    toast({ title: "Plan Updated", description: `You are now on the ${plan} plan.` });
  };

  const handleCancel = async () => {
    await cancel();
    toast({ title: "Subscription Modified", description: "Your plan will remain active until the end of the period." });
  };

  if (loading && !subscription) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = plans.find(p => p.id === subscription?.plan);

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscriptions & Billing</h1>
          <p className="text-slate-500 font-medium">Manage your plan, payment methods, and invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-4 py-2 rounded-xl border-none font-black text-[10px] tracking-widest uppercase shadow-sm",
            subscription?.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {subscription?.status || 'ACCOUNT ACTIVE'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Plans & Usage */}
        <div className="lg:col-span-8 space-y-8">

          {/* Current Plan Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">Active Subscription</CardTitle>
                  <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-tighter">
                    {subscription?.plan} PLAN
                  </Badge>
                </div>
                <CardDescription>
                  {subscription?.cancelAtPeriodEnd
                    ? `Expiring on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Next renewal: ${new Date(subscription?.currentPeriodEnd || '').toLocaleDateString()} for ₹${activePlan?.monthlyPrice.toLocaleString()}/mo.`}
                </CardDescription>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Features</p>
                  <ul className="space-y-3">
                    {activePlan?.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Limits</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tighter text-slate-500">
                      <span>Active Projects</span>
                      <span>3 / {activePlan?.limits.maxCampaigns}</span>
                    </div>
                    <Progress value={30} className="h-1.5" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-slate-50/30 border-t flex flex-wrap gap-4">
              <Button onClick={() => handleUpgrade('ENTERPRISE')} className="rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20">
                Upgrade to Enterprise
              </Button>
              {subscription?.cancelAtPeriodEnd ? (
                <Button variant="outline" className="rounded-xl font-bold h-11 px-8 bg-white" onClick={() => handleUpgrade(subscription.plan)}>
                  Resume Subscription
                </Button>
              ) : (
                <Button variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Upgrade Options */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 px-2">
              <Plus className="h-5 w-5 text-primary" />
              Switch Plan Tier
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.filter(p => p.id !== subscription?.plan).map(plan => (
                <Card key={plan.id} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="p-6">
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    <p className="text-2xl font-black text-slate-900 mt-2">₹{plan.monthlyPrice.toLocaleString()}<span className="text-sm text-slate-400 font-bold">/mo</span></p>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(0, 3).map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <CheckCircle2 className="h-3 w-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full rounded-xl font-bold h-10 border-slate-200" onClick={() => handleUpgrade(plan.id)}>
                      Select {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Invoice History */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 px-2">
              <History className="h-5 w-5 text-primary" />
              Payment History
            </h2>
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 h-14 bg-slate-50/30">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-slate-400">Invoice ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Date</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Amount</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="group hover:bg-slate-50 transition-colors border-slate-50 h-16">
                        <TableCell className="pl-8 font-bold text-slate-900">{inv.id}</TableCell>
                        <TableCell className="text-sm font-medium text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center font-black text-slate-900">₹{inv.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase">{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-primary group-hover:opacity-100 transition-all">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Cards & Tips */}
        <aside className="lg:col-span-4 space-y-8">

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Method
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-primary">Edit</Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 bg-white">
                <div className="h-10 w-14 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 leading-none">Visa •••• 4242</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">Expires 12/26</p>
                </div>
                <div className="ml-auto">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Star className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Escrow Protection</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Your platform subscription covers all automated escrow settlements. No additional wire fees for creator payouts.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Audited & Secure
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Billing Questions?</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Our accounts team typically responds within 2 hours. Reach out for corporate tax receipts.
              </p>
            </div>
            <Button variant="link" className="text-xs font-bold text-primary h-auto p-0">Contact Support</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
