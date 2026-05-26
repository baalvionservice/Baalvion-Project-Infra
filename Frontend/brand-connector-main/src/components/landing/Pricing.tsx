'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, ArrowRight, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';

const DEFAULT_PRICING = [
  {
    id: "STARTER",
    name: "Starter",
    description: "Perfect for brands just starting their influencer journey.",
    monthlyPrice: 0,
    annualPrice: 0,
    commission: 5,
    features: [
      "Basic AI Matching",
      "Escrow Protection",
      "Community Access",
      "1 Active Campaign",
      "Standard Analytics"
    ],
    notIncluded: [
      "Priority Support",
      "Advanced AI Insights",
      "Dedicated Manager",
      "Custom Contracts"
    ],
    cta: "Start for Free",
    popular: false
  },
  {
    id: "GROWTH",
    name: "Growth",
    description: "For growing brands looking to scale their impact.",
    monthlyPrice: 9999,
    annualPrice: 7999,
    commission: 3,
    features: [
      "Everything in Starter",
      "Advanced Analytics",
      "Priority Support",
      "5 Active Campaigns",
      "AI Recommendations",
      "Audience Demographics"
    ],
    notIncluded: [
      "Dedicated Manager",
      "Custom Contracts"
    ],
    cta: "Get Started",
    popular: true
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "Tailored solutions for large-scale operations.",
    monthlyPrice: 49999,
    annualPrice: 39999,
    commission: 2,
    features: [
      "Everything in Growth",
      "Dedicated Manager",
      "Custom Contracts",
      "Unlimited Campaigns",
      "White-label Reporting",
      "API Access"
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false
  }
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration-safe query construction
  const plansQuery = useMemo(() => {
    if (!db || !isMounted) return null;
    return collection(db!, 'system_plans');
  }, [db!, isMounted]);

  const { data: livePlans, loading } = useCollection<any>(plansQuery);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PRICING);

  useEffect(() => {
    if (livePlans && livePlans.length > 0) {
      const merged = DEFAULT_PRICING.map(def => {
        const live = livePlans.find((p: any) => p.id === def.id);
        return live ? { ...def, ...live } : def;
      });
      setPlans(merged);
    }
  }, [livePlans]);

  return (
    <section id="pricing" className="py-24 bg-white overflow-hidden">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
            Transparent Pricing for Every Stage
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mb-8">
            Choose the plan that fits your brand's growth objectives. No hidden fees, just pure ROI.
          </p>

          <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-full border">
            <Label htmlFor="billing-toggle" className={cn("text-sm font-bold transition-colors cursor-pointer ml-4", !isAnnual ? "text-primary" : "text-muted-foreground")}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={(v) => setIsAnnual(v)}
            />
            <Label htmlFor="billing-toggle" className={cn("text-sm font-bold transition-colors cursor-pointer mr-2 flex items-center gap-1.5", isAnnual ? "text-primary" : "text-muted-foreground")}>
              Annual
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 border-none">
                Save 20%
              </Badge>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "relative h-full flex flex-col border-slate-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2",
                plan.popular && "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary"
              )}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg uppercase">
                    <Star className="h-3 w-3 fill-current" />
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-headline font-bold">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-1">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">
                        {plan.id === 'ENTERPRISE' && plan.monthlyPrice > 40000 ? 'Custom' : `₹${(isAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString()}`}
                      </span>
                      {plan.id !== 'ENTERPRISE' && (
                        <span className="text-muted-foreground font-medium">/mo</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-primary mt-2">{plan.commission}% Platform Fee</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">What's Included</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature: string) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded?.map((feature: string) => (
                        <li key={feature} className="flex items-center gap-3 text-sm opacity-50">
                          <X className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-400 line-through">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button className={cn(
                    "w-full h-12 rounded-xl text-md font-bold transition-all",
                    plan.popular ? "bg-primary hover:bg-primary/90" : "bg-slate-900 hover:bg-slate-800"
                  )}>
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
