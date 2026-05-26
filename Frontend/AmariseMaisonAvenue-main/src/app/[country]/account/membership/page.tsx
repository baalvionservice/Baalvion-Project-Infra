'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Crown, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Zap, 
  ArrowRight,
  Gem,
  Award,
  Lock,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Maison Membership Hub: Subscription Lifecycle Management.
 * Optimized for high-trust institutional oversight of client status.
 */
export default function MembershipPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { subscriptions, activeVip } = useAppStore();

  const activeSub = subscriptions.find(s => s.userId === 'u-client-1');

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
             <Link href={`/${countryCode}/account`}>Dashboard</Link>
             <ChevronRight className="w-2.5 h-2.5" />
             <span className="text-plum">Maison Membership</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">Membership</h1>
          <p className="text-sm text-gray-500 font-light italic">Managing your institutional status and elite benefits.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Status Panel */}
        <div className="lg:col-span-8 space-y-12">
           <Card className="bg-black text-white p-12 shadow-2xl relative overflow-hidden rounded-none border-none">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Crown className="w-64 h-64" /></div>
              <div className="relative z-10 space-y-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                       <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase">Active Status</span>
                       <h2 className="text-5xl font-headline font-bold italic tracking-tighter">{activeSub?.planName || 'Standard Member'}</h2>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none h-10 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest">
                       {activeSub?.status || 'VERIFIED'}
                    </Badge>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/10">
                    <StatusDetail icon={<Calendar className="w-4 h-4 text-gold" />} label="Renewal Date" value={activeSub?.currentPeriodEnd ? new Date(activeSub.currentPeriodEnd).toLocaleDateString() : 'N/A'} />
                    <StatusDetail icon={<Star className="w-4 h-4 text-gold" />} label="Heritage Points" value={(activeVip?.loyaltyPoints || 0).toLocaleString()} />
                    <StatusDetail icon={<ShieldCheck className="w-4 h-4 text-gold" />} label="Jurisdiction" value={countryCode.toUpperCase()} />
                 </div>
              </div>
           </Card>

           <div className="space-y-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">BENEFIT ARCHIVE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <BenefitCard title="Private Salon Access" desc="Direct entry to jurisdictional viewing rooms for rare artifacts." icon={<Lock className="w-5 h-5" />} />
                 <BenefitCard title="Curatorial Priority" desc="Strategic briefs reviewed within 2 business hours by senior curators." icon={<Zap className="w-5 h-5" />} />
                 <BenefitCard title="Provenance Reports" desc="Complimentary ISO-certified digital reports for all acquisitions." icon={<Award className="w-5 h-5" />} />
                 <BenefitCard title="Elite Logistics" desc="Global white-glove dispatch with absolute replacement insurance." icon={<Gem className="w-5 h-5" />} />
              </div>
           </div>
        </div>

        {/* Upgrade / Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
           <Card className="bg-ivory border-border p-8 space-y-8 rounded-none">
              <div className="flex items-center space-x-3 text-plum">
                 <TrendingUp className="w-5 h-5" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Next Plateau</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-[9px] font-bold uppercase">
                    <span className="text-gray-400">Progress to Heritage Master</span>
                    <span className="text-plum">84%</span>
                 </div>
                 <Progress value={84} className="h-1 bg-white" />
                 <p className="text-[10px] text-gray-400 italic">"Nearing absolute tier synchronization."</p>
              </div>
              <Button className="w-full h-14 bg-black text-white hover:bg-plum rounded-none text-[9px] font-bold uppercase tracking-[0.4em] font-bold transition-all shadow-xl">
                 UPGRADE PLAN <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
           </Card>

           <div className="p-8 border border-border bg-white space-y-6">
              <div className="flex items-center space-x-3 text-gold">
                 <Clock className="w-4 h-4" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Billing Traces</h4>
              </div>
              <div className="space-y-4">
                 {activeSub && (
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 pb-3">
                      <span className="text-gray-400">{activeSub.planName} Annual</span>
                      <span className="text-gray-900">${activeSub.amount.toLocaleString()}</span>
                   </div>
                 )}
                 <Link href={`/${countryCode}/account/wallet`} className="block">
                    <Button variant="ghost" className="w-full h-10 text-[8px] font-bold uppercase text-plum hover:text-gold p-0">VIEW FISCAL LEDGER</Button>
                 </Link>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

function StatusDetail({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-2">
       <div className="flex items-center space-x-2">
          {icon}
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">{label}</span>
       </div>
       <p className="text-lg font-headline font-bold italic">{value}</p>
    </div>
  );
}

function BenefitCard({ title, desc, icon }: { title: string, desc: string, icon: any }) {
  return (
    <Card className="bg-white border-border shadow-sm p-8 space-y-4 group hover:border-plum transition-all">
       <div className="p-3 bg-ivory rounded-full w-fit text-plum group-hover:bg-plum group-hover:text-white transition-colors">
          {icon}
       </div>
       <div className="space-y-1">
          <h4 className="text-sm font-bold uppercase tracking-tight text-gray-900">{title}</h4>
          <p className="text-[11px] text-gray-500 font-light italic leading-relaxed">{desc}</p>
       </div>
    </Card>
  );
}
