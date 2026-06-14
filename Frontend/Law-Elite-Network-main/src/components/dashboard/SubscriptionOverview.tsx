"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, ShieldCheck, Calendar, Zap, Loader2, ArrowUpRight } from 'lucide-react';
import { getUserSubscription } from '@/services/subscriptions/subscriptionService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * @fileOverview SubscriptionOverview
 * High-fidelity audit module for current professional tier.
 */
export default function SubscriptionOverview() {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getUserSubscription(user.userId);
        setSub(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 opacity-20" />
      </Card>
    );
  }

  const planName = sub?.planId?.toUpperCase() || 'BASIC';
  const isActive = sub?.status === 'active';

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden h-full group hover:border-blue-200 transition-all duration-300">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Professional Standing
          </CardTitle>
          <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest ${
            isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
          }`}>
            {isActive ? "Verified Active" : "Standard"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Current Tier</p>
            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{planName}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
            {planName === 'ELITE' ? <Award className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
          </div>
        </div>

        {sub ? (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
              <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Anniversary</span>
              <span className="text-slate-900">{format(new Date(sub.startDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
              <span className="text-slate-400 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Next Protocol</span>
              <span className="text-slate-900">{format(new Date(sub.expiryDate), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            <p className="text-[11px] text-slate-500 font-medium italic">
              "Upgrade to Professional or Elite to unlock advanced network intelligence."
            </p>
            <Button asChild variant="outline" className="w-full h-9 text-[10px] font-bold uppercase tracking-widest border-blue-100 text-blue-600 hover:bg-blue-50">
              <Link href="/plans">
                Explore Tiers <ArrowUpRight className="ml-1.5 w-3 h-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
