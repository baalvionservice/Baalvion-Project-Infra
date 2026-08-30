"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { getPlansByRole, createSubscription, getUserSubscription } from '@/services/subscriptions/subscriptionService';
import PlanCard from '@/components/subscription/PlanCard';
import { Award, ShieldCheck, Zap, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Membership Plans — public pricing page.
 * Publicly viewable (no auth wall) so visitors and Googlebot see real pricing
 * content; only the "upgrade" action itself requires an account. Previously
 * wrapped in ProtectedRoute + DashboardShell, which rendered nothing but a
 * spinner (then a redirect to disallowed /login) for anonymous visitors even
 * though this route is allowed in robots.ts and listed in the sitemap.
 */
export default function PlansPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const plans = getPlansByRole(role || 'client');

  useEffect(() => {
    if (!user) {
      setCurrentSub(null);
      return;
    }
    let cancelled = false;
    setSubLoading(true);
    getUserSubscription(user.userId)
      .then((sub) => {
        if (!cancelled) setCurrentSub(sub);
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      router.push('/register');
      return;
    }
    setUpgrading(true);
    try {
      await createSubscription(user.userId, planId, role || 'client');
      toast({
        title: "Standing Synchronized",
        description: "Your membership upgrade has been secured and activated.",
      });
      const sub = await getUserSubscription(user.userId);
      setCurrentSub(sub);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Unable to process subscription. Please contact support.",
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="container mx-auto px-8 pt-32 pb-24 flex-1">
        <header className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Award className="w-3.5 h-3.5" /> Professional Standing Portal
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Choose Your Tier of <span className="text-blue-600">Legal Excellence</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium italic">
            Architected for distinguished legal collaboration and high-stakes strategy.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentSub?.planId === plan.id}
              onSelect={handleUpgrade}
              isLoading={upgrading || subLoading}
            />
          ))}
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-3">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto opacity-20" />
              <h4 className="text-sm font-bold text-slate-900 uppercase">Secure Billing</h4>
              <p className="text-xs text-slate-500 font-medium">PCI-DSS compliant financial protocols ensure your data is always protected.</p>
            </div>
            <div className="space-y-3">
              <Zap className="w-8 h-8 text-blue-600 mx-auto opacity-20" />
              <h4 className="text-sm font-bold text-slate-900 uppercase">Instant Activation</h4>
              <p className="text-xs text-slate-500 font-medium">Premium capabilities are unlocked immediately upon settlement verification.</p>
            </div>
            <div className="space-y-3">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto opacity-20" />
              <h4 className="text-sm font-bold text-slate-900 uppercase">No Lock-in</h4>
              <p className="text-xs text-slate-500 font-medium">Maintain control of your professional dossier. Cancel renewal protocols at any time.</p>
            </div>
          </div>
        </footer>
      </div>

      <PublicFooter />
    </div>
  );
}
