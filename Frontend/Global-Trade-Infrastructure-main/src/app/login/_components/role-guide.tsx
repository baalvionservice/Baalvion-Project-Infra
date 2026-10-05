'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Eye, Handshake, Landmark, ShieldCheck, ShoppingCart, Store, type LucideIcon } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export interface Audience {
  id: string;
  title: string;
  who: string;
  lands: string;
  icon: LucideIcon;
  next: { label: string; href: string; external?: boolean };
}

/**
 * Who signs in here, grouped the way the platform treats them. `lands` mirrors the landing
 * consoles in core/personas.ts so the promise on this page matches what the person gets.
 */
export const AUDIENCES: readonly Audience[] = [
  {
    id: 'buyer',
    title: 'I buy goods',
    who: 'Importers and procurement teams',
    lands: 'your Buyer dashboard',
    icon: ShoppingCart,
    next: { label: 'Create a buyer account', href: PATHS.REGISTER },
  },
  {
    id: 'seller',
    title: 'I sell goods',
    who: 'Exporters and suppliers',
    lands: 'your Seller dashboard',
    icon: Store,
    next: { label: 'Create a seller account', href: PATHS.REGISTER },
  },
  {
    id: 'agent',
    title: 'I broker or move cargo',
    who: 'Trade agents, freight forwarders and carriers',
    lands: 'your Agent or Logistics console',
    icon: Handshake,
    next: { label: 'Apply to join', href: PATHS.ONBOARD },
  },
  {
    id: 'institution',
    title: 'I represent a bank, insurer or customs body',
    who: 'Banks, insurers, customs, compliance agencies',
    lands: 'your institution’s console',
    icon: Landmark,
    next: { label: 'Get verified', href: PATHS.ONBOARD },
  },
  {
    id: 'oversight',
    title: 'I am a regulator or auditor',
    who: 'Regulators, auditors and adjudicators',
    lands: 'your Oversight console',
    icon: Eye,
    next: { label: 'Request access', href: 'mailto:hello@baalvion.com?subject=Oversight%20access', external: true },
  },
  {
    id: 'team',
    title: 'I work at Baalvion',
    who: 'Platform administrators and operators',
    lands: 'Platform control',
    icon: Building2,
    next: { label: 'Contact the platform team', href: 'mailto:hello@baalvion.com?subject=Staff%20access', external: true },
  },
];

interface RoleGuideProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** `panel` for the dark brand side (desktop); `chips` for the compact mobile strip. */
  variant: 'panel' | 'chips';
}

export function RoleGuide({ selected, onSelect, variant }: RoleGuideProps) {
  const toggle = (id: string) => onSelect(selected === id ? null : id);

  if (variant === 'chips') {
    return (
      <div className="w-full max-w-[460px] space-y-3 lg:hidden">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Who are you?</p>
        <div role="radiogroup" aria-label="Who are you?" className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected === a.id}
              onClick={() => toggle(a.id)}
              className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-2 text-xs font-bold transition-colors ${
                selected === a.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <a.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {a.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Who are you?</p>
      <div role="radiogroup" aria-label="Who are you?" className="grid gap-3">
        {AUDIENCES.map((a) => {
          const on = selected === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
                on ? 'border-white bg-white text-primary' : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <a.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-base font-black leading-tight">{a.title}</span>
                <span className={`block text-xs font-medium ${on ? 'opacity-70' : 'opacity-60'}`}>{a.who}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Shown above the form once someone picks who they are. Never replaces the form. */
export function RoleHint({ id }: { id: string | null }) {
  const a = AUDIENCES.find((x) => x.id === id);
  if (!a) return null;
  const link = a.next.external ? (
    <a href={a.next.href} className="font-black uppercase tracking-widest text-primary hover:underline">
      {a.next.label}
    </a>
  ) : (
    <Link href={a.next.href} className="font-black uppercase tracking-widest text-primary hover:underline">
      {a.next.label}
    </Link>
  );
  return (
    <div role="status" className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
      <p className="flex items-start gap-2 font-bold">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Sign in below and you will land on {a.lands}.
        </span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        New here? {link} <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </p>
    </div>
  );
}
