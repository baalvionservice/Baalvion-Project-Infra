"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Play, Users, Globe, Zap, ArrowRight, Terminal } from 'lucide-react';
import { LIVE_ACTIVITY_MOCK } from '@/data/mockData';

export default function LiveSessionsPage() {
  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-20 space-y-6">
          <Badge variant="live" className="px-4 py-1">REAL-TIME BROADCASTS</Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase italic font-display">
            Operational <span className="text-semantic-error">Streams.</span>
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl font-mono uppercase text-sm tracking-widest">
            Connect to live intelligence feeds from expert operators across all global nodes.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LIVE_ACTIVITY_MOCK.activeSessions.map((session, i) => (
            <ListingCard key={session.id} index={i} className="p-0 border-brand-border bg-brand-surface overflow-hidden group hover:border-brand-green transition-all">
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                <div className="text-brand-green opacity-10 group-hover:scale-110 transition-transform duration-[20s]">
                  <Terminal size={180} />
                </div>
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <Badge variant="live">LIVE</Badge>
                  <Badge variant="info" className="font-mono text-[8px]">{session.region.toUpperCase()}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{session.viewers}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-brand-green" />
                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">{session.duration}</span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors leading-tight italic">
                    {session.title}
                  </h3>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mt-2">Operator: {session.teacherName}</p>
                </div>
                
                <div className="p-4 bg-brand-void rounded border border-brand-border flex items-center justify-between">
                  <div className="text-[9px] font-bold text-text-muted uppercase">Intelligence Segment:</div>
                  <div className="text-[9px] font-bold text-brand-green uppercase font-mono">{session.product}</div>
                </div>

                <AppButton className="w-full font-mono text-[10px] uppercase h-10 tracking-[0.2em]">
                  Join Command Channel <ArrowRight className="ml-2 w-3 h-3" />
                </AppButton>
              </div>
            </ListingCard>
          ))}
        </div>

        {/* Global Monitor Placeholder */}
        <ListingCard className="mt-20 p-12 bg-brand-void border-brand-border flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-full border-4 border-brand-green/20 border-t-brand-green animate-spin" />
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase italic">Scanning Network...</h3>
            <p className="text-text-muted font-mono text-[10px] uppercase tracking-widest">Waiting for synchronized broadcasts from EMEA and NA nodes.</p>
          </div>
        </ListingCard>
      </main>
      <Footer />
    </div>
  );
}
