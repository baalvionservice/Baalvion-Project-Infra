'use client';
/**
 * @file trade-flow-section.tsx
 * @description Public homepage section — the trade lifecycle as clickable
 * stops, each routing to the real (auth-gated) workspace that runs it. "Quote"
 * has no dedicated destination page in PATHS today, so it renders as a
 * non-clickable intermediate label rather than an invented route.
 */
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, FileSignature, ArrowDownUp, Truck, Globe, ShieldCheck, BadgeCheck } from 'lucide-react';
import { PATHS } from '@/lib/paths';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
} as const;

interface Stage {
  label: string;
  desc: string;
  icon: typeof FileText;
  href?: string;
}

const STAGES: Stage[] = [
  { label: 'RFQ', desc: 'Post sourcing needs to the marketplace.', icon: FileText, href: PATHS.MARKETPLACE },
  { label: 'Quote', desc: 'Suppliers respond inside the RFQ workflow.', icon: FileText },
  { label: 'Contract', desc: 'Terms are negotiated and locked in.', icon: FileSignature, href: PATHS.DEALS },
  { label: 'Escrow', desc: 'Payment is held, released on milestone.', icon: ArrowDownUp, href: PATHS.ESCROW },
  { label: 'Shipment', desc: 'Freight is booked and tracked live.', icon: Truck, href: PATHS.LOGISTICS_SHIPMENT },
  { label: 'Customs', desc: 'Declarations filed with the destination authority.', icon: Globe, href: PATHS.CUSTOMS_DECLARATIONS },
  { label: 'Compliance', desc: 'Sanctions and regulatory rules are enforced.', icon: ShieldCheck, href: PATHS.COMPLIANCE_RULES },
  { label: 'Settlement', desc: 'Funds move; the ledger closes the trade.', icon: BadgeCheck, href: PATHS.FINANCE_SETTLEMENT },
];

export function TradeFlowSection() {
  return (
    <section className="px-4 md:px-10 py-28 border-y border-white/5 bg-slate-900/20">
      <div className="max-w-7xl mx-auto space-y-14">
        <div className="max-w-2xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">One Trade, Start To Finish</p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">
            Every Stage. One System.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Each stage below is a real, live workspace — sign in to see it running.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage, i) => {
            const card = (
              <div
                className={`h-full p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-3 transition-all ${
                  stage.href ? 'hover:border-primary/40 hover:bg-slate-950/70' : 'opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 w-fit">
                    <stage.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 tabular-nums">0{i + 1}</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-tight text-white">{stage.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{stage.desc}</p>
                </div>
                {stage.href && (
                  <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                )}
              </div>
            );
            return (
              <motion.div key={stage.label} {...fadeUp} transition={{ delay: i * 0.05 }}>
                {stage.href ? (
                  <Link href={stage.href} className="group block h-full">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
