
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star, ArrowRight, Rocket, ShieldCheck, Cpu } from 'lucide-react';
import { useBillingStore } from '@/store/useBillingStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PricingPage() {
  const { plans, fetchPlans, loading } = useBillingStore();
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-24 px-4">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center mb-8">
            <div className="bg-primary p-2 rounded-xl mr-2">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-slate-900">Baalvion</span>
          </Link>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
            Pricing for <span className="text-primary">Hyper-Growth</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Choose the perfect plan to scale your influencer marketing. No hidden fees, just pure performance.
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 bg-white p-2 rounded-2xl border shadow-sm w-fit mx-auto">
          <Label className={cn("text-sm font-bold px-4 cursor-pointer", !isAnnual && "text-primary")}>Monthly</Label>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <Label className={cn("text-sm font-bold px-4 cursor-pointer flex items-center gap-2", isAnnual && "text-primary")}>
            Annual <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] uppercase">Save 20%</Badge>
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                "h-full border-2 flex flex-col relative transition-all duration-300",
                plan.id === 'GROWTH' ? "border-primary shadow-2xl shadow-primary/10 scale-105" : "border-slate-100 shadow-sm hover:shadow-xl"
              )}>
                {plan.id === 'GROWTH' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                    <Star className="h-3 w-3 fill-current" /> Most Popular
                  </div>
                )}
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                  <CardDescription className="font-medium">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-1 space-y-8">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">
                        ₹{(isAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-bold">/mo</span>
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{plan.commission}% Platform Fee</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What's Included</p>
                    <ul className="space-y-3">
                      {plan.features.map((f: string) => (
                        <li key={f} className="flex items-start gap-3 text-sm font-bold text-slate-600">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Link href="/auth/signup" className="w-full">
                    <Button 
                      className={cn(
                        "w-full h-14 rounded-2xl text-lg font-black shadow-xl",
                        plan.id === 'GROWTH' ? "bg-primary shadow-primary/20" : "bg-slate-900 shadow-slate-900/10"
                      )}
                    >
                      {plan.id === 'ENTERPRISE' ? 'Contact Sales' : 'Get Started'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
            <h4 className="font-black text-slate-900">Cancel Anytime</h4>
            <p className="text-sm text-slate-500 font-medium">No lock-ins. Switch plans or cancel at any time from your dashboard.</p>
          </div>
          <div className="space-y-2">
            <Cpu className="h-8 w-8 text-primary mx-auto" />
            <h4 className="font-black text-slate-900">AI Enabled</h4>
            <p className="text-sm text-slate-500 font-medium">Advanced matching and ROI prediction on Growth & Enterprise tiers.</p>
          </div>
          <div className="space-y-2">
            <Badge className="bg-orange-100 text-orange-600 border-none mx-auto mb-2">Beta</Badge>
            <h4 className="font-black text-slate-900">Free Forever Tier</h4>
            <p className="text-sm text-slate-500 font-medium">Perfect for individuals and test campaigns before you scale.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
