"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Globe, 
  Zap, 
  Users, 
  MessageSquare, 
  Terminal as TerminalIcon, 
  ShieldCheck,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AppButton } from '@/components/ui/AppButton';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { REGIONS, LIVE_ACTIVITY_MOCK } from '@/data/mockData';
import { useIdentity } from '@/context/identity-context';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { identity, isGlobalView, setGlobalView, isLoading } = useIdentity();

  // Personalize regions: if identified and not in global view, put the detected region first
  const displayRegions = useMemo(() => {
    if (!identity || isGlobalView) return REGIONS;
    const localized = [...REGIONS].sort((a, b) => {
      if (a.id === identity.regionId) return -1;
      if (b.id === identity.regionId) return 1;
      return 0;
    });
    return localized;
  }, [identity, isGlobalView]);

  const activeSessions = useMemo(() => {
    const sessions = LIVE_ACTIVITY_MOCK.activeSessions;
    if (!identity || isGlobalView) return sessions;
    return [...sessions].sort((a, b) => {
      if (a.regionId === identity.regionId) return -1;
      if (b.regionId === identity.regionId) return 1;
      return 0;
    });
  }, [identity, isGlobalView]);

  return (
    <div className="min-h-screen bg-[#0B0C0F]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 lg:pt-20 px-4 sm:px-6 bg-black relative overflow-hidden scanline">
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-8 lg:space-y-10 text-center lg:text-left">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {identity && !isGlobalView ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-center lg:justify-start gap-2 text-[10px] sm:text-[12px] font-bold text-brand-green uppercase tracking-[0.2em]"
                  >
                    <MapPin className="w-4 h-4" /> LOCAL NODE DETECTED: {identity.region.toUpperCase()}
                  </motion.div>
                ) : (
                  <span className="text-[10px] sm:text-[12px] font-bold text-brand-green uppercase tracking-[0.2em]">GLOBAL TRADE NETWORK ACTIVE</span>
                )}
              </AnimatePresence>
              
              <h1 className="text-[36px] sm:text-[48px] md:text-[64px] lg:text-[72px] font-bold leading-[1.1] lg:leading-[0.95] tracking-tight text-white">
                {identity && !isGlobalView ? (
                  <>The Underground <br className="hidden sm:block" /> Marketplace for <br /> <span className="text-brand-green">{identity.country}.</span></>
                ) : (
                  <>The Underground<br className="hidden sm:block" />Marketplace Where<br className="hidden sm:block" />The World <span className="text-brand-green">Trades.</span></>
                )}
              </h1>
              
              <p className="text-[#C8CDD8] text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Connect with {identity && !isGlobalView ? identity.region : "global"} experts. 
                One platform. {identity && !isGlobalView ? "Localized" : "International"} trade protocols.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <AppButton size="lg" className="w-full sm:px-12">
                  Start Trading <ArrowRight className="ml-2 w-5 h-5" />
                </AppButton>
              </Link>
              <AppButton 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto sm:px-12"
                onClick={() => setGlobalView(!isGlobalView)}
              >
                {isGlobalView ? "Focus Local Node" : "Enter Global View"}
              </AppButton>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="text-[12px] sm:text-[13px] text-[#6B7280] font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> 3,430 agents online
              </div>
              {identity && (
                <div className="hidden sm:flex items-center gap-2 text-[12px] text-brand-green font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Verified Path: {identity.ip}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:block">
            <TerminalPanel />
          </div>
        </div>
      </section>

      {/* Regions Grid */}
      <section className="py-20 lg:py-32 container mx-auto px-4 sm:px-6">
        <div className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-[10px] sm:text-[12px] font-bold text-brand-green uppercase tracking-[0.2em]">INTELLIGENCE NODES</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
              {identity && !isGlobalView ? "Your Primary Node." : "Global Regions."}
            </h2>
          </div>
          {identity && !isGlobalView && (
            <Badge variant="success" className="h-fit mx-auto md:mx-0">CONNECTED TO {identity.regionId.toUpperCase()}</Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayRegions.map((reg, idx) => (
            <Link key={reg.id} href={`/education?region=${reg.id}`}>
              <ListingCard 
                index={idx} 
                className={cn(
                  "group cursor-pointer hover:border-brand-green transition-all relative overflow-hidden",
                  identity?.regionId === reg.id && !isGlobalView && "border-brand-green bg-brand-green/5 ring-1 ring-brand-green/20"
                )}
              >
                {identity?.regionId === reg.id && !isGlobalView && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-green animate-pulse" />
                    <span className="text-[8px] font-bold text-brand-green uppercase tracking-widest">Recommended</span>
                  </div>
                )}
                <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{reg.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{reg.name}</h3>
                <div className="flex justify-between items-center pt-4 border-t border-[#252A33] mt-4">
                  <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7280] uppercase">{reg.teachers} Teachers</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-brand-green uppercase">{reg.sessions} Live</span>
                  </div>
                </div>
              </ListingCard>
            </Link>
          ))}
        </div>
      </section>

      {/* Region-Aware Live Sessions */}
      <section className="py-20 lg:py-32 bg-brand-surface/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 lg:mb-16 text-center md:text-left">
            <span className="text-[10px] sm:text-[12px] font-bold text-semantic-error uppercase tracking-[0.2em]">OPERATIONAL STREAMS</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">Live Session Intelligence.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {activeSessions.map((session, idx) => (
              <ListingCard key={session.id} index={idx} className="p-0 overflow-hidden group border-brand-border hover:border-brand-green">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                  <div className="text-brand-green opacity-20 group-hover:scale-110 transition-transform duration-1000">
                    <TerminalIcon size={120} />
                  </div>
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <Badge variant="live">LIVE</Badge>
                    {identity?.regionId === session.regionId && (
                      <Badge variant="success" className="bg-brand-green text-black">LOCAL NODE</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className="text-[11px] sm:text-xs font-bold text-white mb-1">{session.viewers} watching</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-brand-green uppercase tracking-widest">{session.region} • {session.country}</div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  <h4 className="text-lg sm:text-xl font-bold text-white line-clamp-1 group-hover:text-brand-green transition-colors">{session.title}</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-brand-void border border-brand-border flex items-center justify-center font-bold text-[10px] sm:text-xs">
                      {session.teacherName.charAt(0)}
                    </div>
                    <span className="text-[13px] sm:text-sm font-medium text-text-secondary">{session.teacherName}</span>
                  </div>
                  <AppButton className="w-full h-10 text-[9px] sm:text-[10px] uppercase font-mono tracking-widest">Connect Stream</AppButton>
                </div>
              </ListingCard>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TerminalPanel() {
  const { identity } = useIdentity();
  const [lines, setLines] = useState<string[]>([]);
  
  useEffect(() => {
    const baseLines = [
      "> platform.status()",
      "✓ All systems operational",
      "> identity.detect()",
      identity ? `✓ Remote node: ${identity.region}` : "Scanning global node...",
      identity ? `✓ Local country: ${identity.country}` : "Searching IP headers...",
      identity ? `✓ Verified IP: ${identity.ip}` : "Verifying SSL tunnel...",
      "> market.stats()",
      "Students online:    247",
      "ETH processed:  847.32",
      "> _"
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < baseLines.length) {
        setLines(prev => [...prev, baseLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [identity]);

  return (
    <div className="bg-[#111318] border border-[#252A33] rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-[#0B0C0F] border-b border-[#252A33] h-10 px-4 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-semantic-error opacity-50" />
          <div className="w-2.5 h-2.5 rounded-full bg-semantic-warning opacity-50" />
          <div className="w-2.5 h-2.5 rounded-full bg-brand-green opacity-50" />
        </div>
        <span className="font-mono text-[11px] text-text-muted uppercase tracking-widest">
          identity_engine.io — secure
        </span>
      </div>
      <div className="p-6 h-[320px] font-mono text-[13px] space-y-2 overflow-y-auto no-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className={cn(
            line && line.startsWith('>') ? "text-text-muted" : 
            line && line.includes('✓') ? "text-brand-green" : "text-text-secondary"
          )}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
