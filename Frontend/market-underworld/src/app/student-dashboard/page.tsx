"use client"

import React from 'react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { GraduationCap, Wallet, Zap, Clock, Calendar, ArrowRight, Play, Star, TrendingUp } from 'lucide-react';
import { LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function StudentDashboardOverview() {
  return (
    <div className="p-10 space-y-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white uppercase italic font-display">Student <span className="text-semantic-info">Interface.</span></h1>
          <p className="text-text-muted font-mono text-xs uppercase tracking-widest">Node Path: South Asia • Identity Verified</p>
        </div>
        <div className="flex gap-4">
          <AppButton variant="secondary" className="h-12 px-8 font-bold font-mono text-[11px] uppercase border-brand-border">
            <Wallet className="w-4 h-4 mr-2" /> Top Up Wallet
          </AppButton>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Learning', val: '12 hrs', icon: Clock, color: 'text-semantic-info' },
          { label: 'Wallet Balance', val: '0.842 ETH', icon: Wallet, color: 'text-brand-green' },
          { label: 'Reward Tier', val: 'Gold', icon: Star, color: 'text-semantic-warning' },
          { label: 'Sessions Joined', val: '24', icon: GraduationCap, color: 'text-white' },
        ].map((stat, i) => (
          <ListingCard key={i} variant="stats">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <TrendingUp className="w-4 h-4 text-text-muted" />
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
            <div className="text-2xl font-bold text-white mt-1 font-mono">{stat.val}</div>
          </ListingCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Learning Hub */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <Zap className="w-4 h-4 text-semantic-info" /> Recommended Intellectual Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIVE_ACTIVITY_MOCK.activeSessions.map((session) => (
              <ListingCard key={session.id} className="p-6 border-brand-border bg-brand-surface group hover:border-semantic-info transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Play size={80} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge variant="live">LIVE</Badge>
                    <div className="text-[9px] font-mono text-text-muted">{session.duration} remaining</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white group-hover:text-semantic-info transition-colors italic">{session.title}</h4>
                    <p className="text-xs text-text-muted font-mono uppercase tracking-widest">Operator: {session.teacherName}</p>
                  </div>
                  <AppButton className="w-full h-10 font-mono text-[9px] uppercase tracking-widest">Connect Intelligence Stream</AppButton>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <ListingCard className="p-8 border-brand-border bg-brand-void/50 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Protocol Quick Links</h3>
            <div className="space-y-3">
              {[
                { name: 'Apply Intelligence Code', icon: Zap },
                { name: 'Verify Trade History', icon: Clock },
                { name: 'Market Intel Access', icon: Calendar },
              ].map(link => (
                <button key={link.name} className="w-full p-4 rounded bg-brand-surface border border-brand-border flex items-center justify-between group hover:border-brand-green transition-all">
                  <div className="flex items-center gap-3">
                    <link.icon className="w-4 h-4 text-text-ghost group-hover:text-brand-green transition-colors" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{link.name}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-text-ghost group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </ListingCard>

          <ListingCard className="p-8 border-semantic-warning/20 bg-semantic-warning/5 space-y-4">
            <div className="flex items-center gap-3 text-semantic-warning">
              <Star className="w-5 h-5" />
              <h4 className="font-bold text-xs uppercase tracking-widest">Elite Rewards Active</h4>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono uppercase">
              You have 0.005 ETH in claimable intellectual rewards. Verify next session to unlock.
            </p>
            <AppButton variant="secondary" className="w-full h-9 font-mono text-[9px] uppercase border-semantic-warning/20 text-semantic-warning">Claim Protocol</AppButton>
          </ListingCard>
        </div>
      </div>
    </div>
  );
}
