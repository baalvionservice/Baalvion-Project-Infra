'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Zap,
  ShieldCheck,
  Save,
  History,
  Plus,
  Trash2,
  Info,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { doc, updateDoc, setDoc, collection, query, orderBy, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Mock Plan Defaults
const DEFAULT_PLANS: Record<string, any> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    commission: 5,
    campaignLimit: 1,
    analytics: 'Standard',
    support: 'Standard',
    features: ['Basic AI Matching', 'Escrow Protection', 'Community Access']
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    monthlyPrice: 9999,
    annualPrice: 7999,
    commission: 3,
    campaignLimit: 5,
    analytics: 'Advanced',
    support: 'Priority',
    features: ['Everything in Starter', 'AI Recommendations', 'Audience Demographics']
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 49999,
    annualPrice: 39999,
    commission: 2,
    campaignLimit: 100,
    analytics: 'Professional',
    support: 'Dedicated',
    features: ['Unlimited Campaigns', 'White-label Reporting', 'API Access', 'Custom Contracts']
  }
};

export default function AdminPlanConfigPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [activeTier, setActiveTab] = useState('GROWTH');
  const [isSaving, setIsSaving] = useState(false);
  const [plansData, setPlansData] = useState<any>(DEFAULT_PLANS);

  // Fetch Live Plan Config
  const livePlansQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'system_plans');
  }, [db]);
  const { data: livePlans, loading } = useCollection<any>(livePlansQuery);

  const historyQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'system_plan_history'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: changeHistory } = useCollection<any>(historyQuery);

  useEffect(() => {
    if (livePlans && livePlans.length > 0) {
      const mapped = livePlans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {});
      setPlansData(mapped);
    }
  }, [livePlans]);

  const activePlan = plansData[activeTier];

  const handleUpdateField = (field: string, value: any) => {
    setPlansData({
      ...plansData,
      [activeTier]: { ...activePlan, [field]: value }
    });
  };

  const handleSave = async () => {
    if (!activePlan) return;
    setIsSaving(true);
    const planRef = doc(db!, 'system_plans', activeTier);

    try {
      await setDoc(planRef, activePlan, { merge: true });

      // Record in history
      await addDoc(collection(db!, 'system_plan_history'), {
        planId: activeTier,
        changes: activePlan,
        adminId: 'current_admin',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Plan Configuration Published", description: "Pricing and limits have been updated globally." });
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: planRef.path,
        operation: 'write',
        requestResourceData: activePlan
      }));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Plan Configuration
          </h1>
          <p className="text-slate-500 font-medium">Define marketplace tiers, pricing strategies, and platform economics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-xl font-black px-8 shadow-xl shadow-primary/20 h-12"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Publish Tier Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Configuration Panel */}
        <div className="lg:col-span-8 space-y-8">
          <Tabs value={activeTier} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 rounded-2xl border mb-6">
              {Object.keys(DEFAULT_PLANS).map(key => (
                <TabsTrigger key={key} value={key} className="rounded-xl py-2.5 px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  {key}
                </TabsTrigger>
              ))}
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTier}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="p-8 border-b bg-slate-50/50">
                    <CardTitle className="text-xl">Commercials & Limits</CardTitle>
                    <CardDescription>Adjust the economic levers for the {activeTier} tier.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Monthly Price (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                          <Input
                            type="number"
                            value={activePlan?.monthlyPrice}
                            onChange={(e) => handleUpdateField('monthlyPrice', parseInt(e.target.value) || 0)}
                            className="pl-8 h-12 rounded-xl bg-slate-50 border-none font-bold text-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Annual Price (₹/mo)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                          <Input
                            type="number"
                            value={activePlan?.annualPrice}
                            onChange={(e) => handleUpdateField('annualPrice', parseInt(e.target.value) || 0)}
                            className="pl-8 h-12 rounded-xl bg-slate-50 border-none font-bold text-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Platform Fee (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={activePlan?.commission}
                            onChange={(e) => handleUpdateField('commission', parseInt(e.target.value) || 0)}
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold pr-8"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Campaign Limit</Label>
                        <Input
                          type="number"
                          value={activePlan?.campaignLimit}
                          onChange={(e) => handleUpdateField('campaignLimit', parseInt(e.target.value) || 0)}
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="font-bold text-slate-700">Support Level</Label>
                        <Select value={activePlan?.support} onValueChange={(v) => handleUpdateField('support', v)}>
                          <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Standard" className="font-bold">Standard</SelectItem>
                            <SelectItem value="Priority" className="font-bold">Priority</SelectItem>
                            <SelectItem value="Dedicated" className="font-bold">Dedicated Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="font-bold text-slate-700">Included Features (Visual Only)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePlan?.features.map((feature: string, i: number) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <span className="text-sm font-bold text-slate-600">{feature}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-300 hover:text-red-500"
                              onClick={() => handleUpdateField('features', activePlan.features.filter((_: any, idx: number) => idx !== i))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="p-2 flex gap-2">
                          <Input placeholder="Add feature..." className="h-10 rounded-xl" onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateField('features', [...activePlan.features, (e.target as HTMLInputElement).value]);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Sidebar: History & Impact */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Version History */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Change Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {changeHistory.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 uppercase">Tier: {log.planId}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Commercials recalibrated</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(log.createdAt).toLocaleDateString()} • System Admin</p>
                    </div>
                  </div>
                ))}
                {changeHistory.length === 0 && (
                  <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No changes recorded</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Impact Intelligence */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <TrendingUp className="h-16 w-16" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">Market Elasticity</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Growth tier conversions are sensitive to the ₹10k/mo barrier. Current strategy maintains high liquidity at ₹9,999.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Revenue Projection</span>
                  <span className="text-emerald-400">+12% Uplift</span>
                </div>
                <Progress value={75} className="h-1 bg-white/5" />
              </div>
            </CardContent>
          </Card>

          {/* Preview Seal */}
          <div className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Live Pricing Sync</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                All changes made here are instantly pushed to the public pricing page and brand upgrade workflows.
              </p>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
