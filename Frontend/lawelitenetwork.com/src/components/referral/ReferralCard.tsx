"use client";

import React from 'react';
import { Referral } from '@/types/referral';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users, Share2, ShieldCheck } from 'lucide-react';

interface ReferralCardProps {
  referral: Referral;
}

/**
 * @fileOverview ReferralCard
 * High-fidelity sharing interface for the network's growth engine.
 */
export default function ReferralCard({ referral }: ReferralCardProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referral.code);
    toast({
      title: "Protocol Copied",
      description: "Referral identifier has been synchronized to your clipboard.",
    });
  };

  return (
    <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
              <Gift className="w-4 h-4" /> Growth Program
            </CardTitle>
            <CardDescription className="italic text-[10px] mt-1">Onboard elite members to earn network credits.</CardDescription>
          </div>
          <div className="bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Active Protocol</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 space-y-8">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Your Executive Identifier</p>
          <div className="flex items-center justify-center gap-3">
            <div className="glass-panel px-6 py-4 rounded-2xl border-white/10 bg-white/5 font-mono text-2xl font-bold tracking-wider text-white shadow-inner">
              {referral.code}
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="h-14 w-14 rounded-2xl border-white/10 hover:bg-white/5 transition-all active:scale-90"
              onClick={copyToClipboard}
            >
              <Copy className="w-5 h-5 text-accent" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] flex flex-col items-center text-center group hover:bg-accent/5 transition-colors">
            <Users className="w-5 h-5 text-accent mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-2xl font-headline italic text-white">{referral.referredUsers.length}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Network Growth</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/[0.02] flex flex-col items-center text-center group hover:bg-emerald-500/5 transition-colors">
            <Gift className="w-5 h-5 text-emerald-400 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
            <p className="text-2xl font-headline italic text-emerald-400">₹{referral.rewards}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Rewards Earned</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20">
            <Share2 className="w-4 h-4 mr-2" /> Broadcast to Global Network
          </Button>
          <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
            <ShieldCheck className="w-3 h-3" />
            <p className="text-[8px] font-bold uppercase tracking-widest">Verified Referral Protocol v2.1</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
