
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, ShieldCheck, Crown, Zap, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Maison Plans Page: Institutional Subscription Selection.
 * Features bank-grade typography and tiered benefit transparency.
 */
export default function MembershipPlansPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { paymentPlans } = useAppStore();
  const router = useRouter();

  return (
    <div className="bg-ivory min-h-screen pb-40 animate-fade-in font-body">
      {/* Editorial Header */}
      <section className="container mx-auto px-12 py-24 text-center space-y-8 max-w-[1600px]">
        <nav className="flex items-center justify-center space-x-2 text-[10px] tracking-widest uppercase text-muted-foreground mb-8 font-bold">
          <Link href={`/${countryCode}`} className="hover:text-black">Maison</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-black">Membership Registry</span>
        </nav>
        <div className="inline-flex items-center space-x-3 text-plum mb-4">
          <Crown className="w-6 h-6 text-gold" />
          <span className="text-[10px] font-bold tracking-[0.5em] uppercase">Private Client Tiers</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-headline font-bold italic text-gray-900 tracking-tighter">The Absolute <br /> Standard</h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto italic leading-relaxed">
          "Membership in the Maison is not merely a status; it is an architectural commitment to human brilliance and the preservation of heritage."
        </p>
      </section>

      {/* Plans Matrix */}
      <section className="container mx-auto px-12 max-w-[1600px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-stretch">
          {paymentPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                "relative flex flex-col p-12 border-border shadow-luxury rounded-none transition-all duration-700 hover:border-plum group overflow-hidden",
                plan.isPopular && "bg-white scale-105 z-10 border-gold/40 shadow-2xl"
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 p-6">
                   <Badge className="bg-gold text-black border-none text-[8px] font-bold uppercase tracking-widest px-4 py-1">MOST RESONANT</Badge>
                </div>
              )}

              <div className="space-y-10 flex-1">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 group-hover:text-plum transition-colors">{plan.tier} PLATEAU</span>
                  <h3 className="text-4xl font-headline font-bold italic text-gray-900">{plan.name}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-body font-semibold tabular">${plan.price.toLocaleString()}</span>
                    <span className="text-sm font-light text-gray-400 italic">/ {plan.interval}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">Institutional Pricing Hub: {countryCode.toUpperCase()}</p>
                </div>

                <div className="space-y-6 pt-10 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Included Protocol</p>
                  <ul className="space-y-5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-4">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-[13px] text-gray-600 font-light italic leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-12">
                <Button 
                  className={cn(
                    "w-full h-16 rounded-none text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl",
                    plan.isPopular ? "bg-plum text-white hover:bg-black" : "bg-black text-white hover:bg-plum"
                  )}
                  onClick={() => router.push(`/${countryCode}/checkout?planId=${plan.id}`)}
                >
                  ENROLL IN REGISTRY
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Registry Section */}
      <section className="container mx-auto px-12 mt-40 pt-40 border-t border-border max-w-4xl text-center space-y-16">
         <div className="inline-flex items-center justify-center p-6 bg-white border border-border rounded-full shadow-lg">
            <ShieldCheck className="w-10 h-10 text-gold" />
         </div>
         <div className="space-y-8">
            <h3 className="text-5xl font-headline font-bold italic tracking-tight">Institutional Responsibility</h3>
            <p className="text-2xl text-gray-500 font-light italic leading-relaxed">
              "Every enrollment is audited against the Global Heritage Charter. We maintain absolute discretion for all private client archives."
            </p>
         </div>
         <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-12">
            <div className="flex items-center space-x-4 opacity-40">
               <Zap className="w-5 h-5 text-plum" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Instant Activation</span>
            </div>
            <div className="flex items-center space-x-4 opacity-40">
               <Star className="w-5 h-5 text-plum" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Global Resonance</span>
            </div>
         </div>
      </section>
    </div>
  );
}
