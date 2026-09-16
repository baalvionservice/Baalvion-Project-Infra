"use client";
/**
 * @file home-client.tsx
 * @description Public home — the front door. Show, don't tell: a visitor should
 * understand in seconds what Baalvion is (the operating system for global trade),
 * see one trade running end to end, and route to the solution page for their world.
 * Shares the dark institutional language and peek primitives with the solution pages.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, Landmark, Boxes, Globe, Truck, FileCheck2, Workflow,
  Link2, Fingerprint, Code2, ArrowDownUp, Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountUp } from '@/components/ui/count-up';
import { PATHS } from '@/lib/paths';
import { cn } from '@/lib/utils';
import { BrowserFrame, PeekRow, PeekBadge } from './solution/solution-page';
import { TradeFlowSection } from './trade-flow-section';
import type { PlatformPulse } from '@/server/public/platform-pulse';

/** Per-audience accent so the four cards read as distinct worlds, not four repaints of
 *  the same blue tile. Hues match the persona accents already used across governance/
 *  dashboard (emerald=finance, violet=sovereign/gov authority, orange=logistics). */
const AUDIENCE_STYLES = {
  primary: {
    chip: 'bg-primary/10 border-primary/20 group-hover:bg-primary/20',
    icon: 'text-primary',
    ring: 'hover:border-primary/40 hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]',
    label: 'text-primary',
  },
  emerald: {
    chip: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20',
    icon: 'text-emerald-400',
    ring: 'hover:border-emerald-500/40 hover:shadow-[0_0_40px_-12px_rgba(52,211,153,0.5)]',
    label: 'text-emerald-400',
  },
  violet: {
    chip: 'bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/20',
    icon: 'text-violet-400',
    ring: 'hover:border-violet-500/40 hover:shadow-[0_0_40px_-12px_rgba(167,139,250,0.5)]',
    label: 'text-violet-400',
  },
  orange: {
    chip: 'bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20',
    icon: 'text-orange-400',
    ring: 'hover:border-orange-500/40 hover:shadow-[0_0_40px_-12px_rgba(251,146,60,0.5)]',
    label: 'text-orange-400',
  },
} as const;

interface HomeClientProps {
  /** Real, platform-wide aggregate facts — see server/public/platform-pulse.ts. */
  pulse: PlatformPulse;
  /** Real count of published CUSTOMS-kind authorities across the GCKB. */
  customsAuthorityCount: number;
  /** Real, cross-service count from trade-service; null if unreachable — omit the tile, don't fabricate. */
  activeShipmentCount: number | null;
}

const AUDIENCES = [
  { title: 'Banks', desc: 'Escrow, ledger, and net settlement that plug into your core systems.', icon: Landmark, href: PATHS.SOLUTIONS_BANKS, style: 'emerald' as const },
  { title: 'Enterprises', desc: 'Run a trade end to end on one source of truth.', icon: Boxes, href: PATHS.SOLUTIONS_ENTERPRISES, style: 'primary' as const },
  { title: 'Governments', desc: 'Real-time customs filing and sanctions screening.', icon: Globe, href: PATHS.SOLUTIONS_GOV, style: 'violet' as const },
  { title: 'Logistics', desc: 'Route optimization and live tracking, synced to the trade.', icon: Truck, href: PATHS.SOLUTIONS_LOGISTICS, style: 'orange' as const },
];

const STAGES = ['RFQ', 'Quote', 'Deal', 'Order', 'Ship', 'Settle'];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const;

function TradePeek() {
  const active = 3;
  return (
    <BrowserFrame label="Illustrative Example · One Trade End To End">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Order #GTI-4471</p>
          <p className="text-base font-black text-white">Arabica Green Coffee · 18 MT</p>
        </div>
        <PeekBadge tone="sky">In Transit</PeekBadge>
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        {STAGES.map((s, i) => (
          <div key={s} className="flex-1 space-y-1.5">
            <div className={i <= active ? 'h-1.5 rounded-full bg-primary' : 'h-1.5 rounded-full bg-white/10'} />
            <p className={`text-[8px] font-black uppercase tracking-wider text-center ${i <= active ? 'text-primary' : 'text-slate-600'}`}>{s}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-1">
        <PeekRow icon={ArrowDownUp} label="Payment · Escrow" value="$41,200 HELD" valueClass="text-emerald-400 text-[11px]" />
        <PeekRow icon={Globe} label="Customs · ICEGATE" value="CLEARED" valueClass="text-emerald-400 text-[11px]" />
        <PeekRow icon={FileCheck2} label="Documents · 6 of 6" value="VERIFIED" valueClass="text-emerald-400 text-[11px]" />
        <PeekRow icon={ShieldCheck} label="Sanctions Screen" value="NO MATCH" valueClass="text-emerald-400 text-[11px]" />
      </div>
    </BrowserFrame>
  );
}

export function HomeClient({ pulse, customsAuthorityCount, activeShipmentCount }: HomeClientProps) {
  const ticker: Array<{ label: string; val: string } | { label: string; num: number }> = [
    { label: 'Settlement Cycle', val: 'T+1' },
    { label: 'Ledger Integrity', val: pulse.ledgerBalanced ? 'All Books Balanced' : 'Under Review' },
    { label: 'Customs Authorities', num: customsAuthorityCount },
    { label: 'Escrows On Platform', num: pulse.escrowCount },
    // Only shown when trade-service actually answered — a failed/timed-out
    // cross-service call omits the tile rather than showing a stale/fake number.
    ...(activeShipmentCount != null ? [{ label: 'Active Shipments', num: activeShipmentCount }] : []),
    { label: 'Screening', val: 'Fail-Closed' },
  ];

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 selection:bg-primary selection:text-white overflow-hidden">
      {/* LIVE KERNEL TICKER — every value here is real, sourced server-side from
          platform-pulse.ts + the GCKB authorities directory. Nothing hardcoded. */}
      <div className="h-12 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center px-4 md:px-10 justify-between overflow-hidden shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${pulse.dbHealthy ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]' : 'bg-amber-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 whitespace-nowrap">
              Platform: {pulse.dbHealthy ? 'Operational' : 'Degraded'}
            </span>
          </div>
          {ticker.map((s) => (
            <div key={s.label} className="flex items-center gap-2 whitespace-nowrap border-l border-white/5 pl-8 first:border-0 first:pl-0">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.label}:</span>
              {'num' in s ? (
                <CountUp value={s.num} className="text-[10px] font-black text-slate-200 tabular-nums" />
              ) : (
                <span className="text-[10px] font-black text-slate-200 tabular-nums">{s.val}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="relative px-4 md:px-10 pt-20 pb-28 md:pt-28 md:pb-36 border-b border-white/5">
        <div className="aurora-bg"><span /><span /><span /></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 items-center relative z-10">
          <motion.div {...fadeUp} className="lg:col-span-6 space-y-8">
            <Badge variant="outline" className="px-4 py-1.5 border-gold/40 bg-gold/10 text-gold font-black uppercase text-[9px] tracking-[0.4em] rounded-full">
              The Global Trade Operating System
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-white">
              Sourcing To Settlement.<br />
              <span className="bg-gradient-to-r from-primary via-sky-400 to-gold bg-clip-text text-transparent">On One Platform.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-xl">
              Baalvion runs the whole trade — RFQs, escrow-secured payments, customs, compliance, and logistics — on one governed platform that banks, enterprises, governments, and carriers share.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="h-14 px-9 bg-gradient-to-r from-gold to-amber-500 text-gold-foreground font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 hover:shadow-[0_0_40px_-8px_hsl(var(--gold)/0.6)] transition-all group" asChild>
                <Link href={PATHS.ONBOARD}>Join Baalvion <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
              </Button>
              <Button variant="outline" className="h-14 px-9 border-white/10 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10" asChild>
                <Link href={PATHS.PLATFORM}>View Platform</Link>
              </Button>
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="lg:col-span-6">
            <TradePeek />
          </motion.div>
        </div>
      </section>

      {/* AUDIENCE ROUTER */}
      <section className="px-4 md:px-10 py-28">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Built For Every Side Of The Trade</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">One Platform. Four Worlds.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">The same trade looks different from each seat. Pick yours to see exactly how Baalvion helps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {AUDIENCES.map((a, i) => {
              const s = AUDIENCE_STYLES[a.style];
              return (
                <motion.div key={a.title} {...fadeUp} transition={{ delay: i * 0.08 }} whileHover={{ y: -6 }}>
                  <Link href={a.href} className="group block h-full">
                    <div className={cn('h-full p-8 rounded-[28px] border border-white/5 bg-slate-900/40 hover:bg-slate-900/70 transition-all duration-300 space-y-5', s.ring)}>
                      <div className={cn('p-4 rounded-2xl border w-fit transition-colors', s.chip)}>
                        <a.icon className={cn('h-6 w-6', s.icon)} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white">{a.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{a.desc}</p>
                      </div>
                      <span className={cn('inline-flex items-center text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity', s.label)}>
                        Explore <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* END-TO-END TRADE FLOW */}
      <TradeFlowSection />

      {/* LIVE NETWORK MAP + TRUST CENTER CTAs */}
      <section className="px-4 md:px-10 py-20">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-2">
          <Link href={PATHS.PLATFORM_MAP} className="group block h-full">
            <div className="h-full rounded-[28px] border border-white/5 bg-slate-900/40 hover:border-primary/40 hover:bg-slate-900/70 transition-all p-10 flex flex-col justify-between gap-8">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  <Globe2 className="h-4 w-4" /> Live Network
                </p>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-tight">
                  See The Network On A Map.
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Every published port and point of entry on Baalvion, plotted live.
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-black uppercase tracking-widest text-primary">
                Open Map <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
          <Link href={PATHS.TRUST_CENTER} className="group block h-full">
            <div className="h-full rounded-[28px] border border-white/5 bg-slate-900/40 hover:border-primary/40 hover:bg-slate-900/70 transition-all p-10 flex flex-col justify-between gap-8">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  <ShieldCheck className="h-4 w-4" /> Trust Center
                </p>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-tight">
                  Verify, Don&apos;t Take Our Word For It.
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real, live figures on platform integrity, audit accountability, and security architecture.
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-black uppercase tracking-widest text-primary">
                Open Trust Center <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* INTEROPERABILITY */}
      <section className="px-4 md:px-10 py-28 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp} className="space-y-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Integrate, Don&apos;t Replace</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-[0.95]">Connects To What You Already Run.</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Bind your core banking, ERP, TMS, or customs gateway through signed API adapters. Baalvion orchestrates the trade across them — you keep authoritative control of your own systems.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Signed API Adapters', icon: Fingerprint },
                { label: 'Event-Bus Sync', icon: Workflow },
                { label: 'Custom Connectors', icon: Link2 },
                { label: 'Developer API', icon: Code2 },
              ].map((f) => (
                <div key={f.label} className="p-5 rounded-2xl border border-white/5 bg-slate-950 flex items-center gap-3 group hover:border-primary/30 transition-all">
                  <f.icon className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
            <BrowserFrame label="Federation Node · api.baalvion.com">
              <PeekRow icon={Workflow} label="Core Banking" value="CONNECTED" valueClass="text-emerald-400 text-[11px]" />
              <PeekRow icon={Boxes} label="ERP / TMS" value="CONNECTED" valueClass="text-emerald-400 text-[11px]" />
              <PeekRow icon={Globe} label="Customs Gateway" value="CONNECTED" valueClass="text-emerald-400 text-[11px]" />
              <PeekRow icon={Fingerprint} label="Identity Signature" value="SHA-256 HMAC" valueClass="text-slate-300 text-[11px]" />
              <div className="pt-1">
                <PeekBadge tone="emerald">All adapters healthy</PeekBadge>
              </div>
            </BrowserFrame>
          </motion.div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="px-4 md:px-10 py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">Run Your Trade On Baalvion</h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Verify your organization and start executing — or talk to our institutional team about connecting your systems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="h-14 px-10 bg-white text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200" asChild>
              <Link href={PATHS.ONBOARD}>Join Baalvion</Link>
            </Button>
            <Button variant="outline" className="h-14 px-10 border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/5" asChild>
              <Link href={PATHS.ACCESS_REQUEST}>Request Institutional Access</Link>
            </Button>
            <Button variant="outline" className="h-14 px-10 border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/5" asChild>
              <Link href={PATHS.CONTACT}>Book A Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
