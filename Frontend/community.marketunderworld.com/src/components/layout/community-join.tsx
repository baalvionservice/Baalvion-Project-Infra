"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Gamepad2, MessageCircle, Send, Users } from 'lucide-react';
import { COMMUNITY_LINKS, type CommunityLink } from '@/lib/community-links';

const ICONS: Record<CommunityLink['id'], React.ComponentType<{ className?: string }>> = {
  telegram: Send,
  whatsapp: MessageCircle,
  potato: Users,
  discord: Gamepad2,
};

const linkProps = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** One slim row for the homepage. */
export function CommunityJoinSection() {
  return (
    <section className="px-4 sm:px-6 py-5 border-y border-white/5" style={{ background: '#08090c' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-center gap-3 sm:gap-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#cc2200] text-center sm:text-left">Join the community</span>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {COMMUNITY_LINKS.map((l) => {
            const Icon = ICONS[l.id];
            return (
              <a
                key={l.id}
                href={l.href}
                {...linkProps}
                className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] sm:min-h-[38px] rounded text-xs font-bold text-white hover:opacity-85 transition-opacity"
                style={{ background: l.color }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {l.label}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type Invite = { title: string; text: string; cta: string; href: string; external?: boolean };

const INVITES: Invite[] = [
  {
    title: 'Club and event ticket sellers',
    text: 'Selling tickets in Dubai, India, pool parties, rooftop nights and more? List your events here and reach buyers who are already looking.',
    cta: 'Start selling tickets',
    href: '/seller/onboarding',
  },
  {
    title: 'Marketplace sellers',
    text: 'Physical goods, digital products, vouchers and services. Open a seller account, list what you sell and get paid through the wallet.',
    cta: 'Open a seller account',
    href: '/seller/onboarding',
  },
  {
    title: 'Hosts and venue investors',
    text: 'Back a night out at a club or pub and host it yourself. You sponsor the table and the evening, you are the named host, and you answer for your venue and your guests.',
    cta: 'Become a host',
    href: '/clubs/elite-host',
  },
  {
    title: 'Women: free to join',
    text: 'Joining is free. You get a private profile under a display name of your choice, so you decide how much of yourself is shown. Go to the nights you like, skip the ones you do not.',
    cta: 'Create a free profile',
    href: '/auth/registration',
  },
  {
    title: 'Red teams and bug hunters',
    text: 'Security researchers who test things properly. Find a flaw in our platform and tell us first. Bring your methods and trade notes with others who do the same.',
    cta: 'Report or join on Discord',
    href: COMMUNITY_LINKS.find((l) => l.id === 'discord')!.href,
    external: true,
  },
];

/** Who we want to hear from, with one clear next step each. */
export function InviteSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: '#0a0a0a' }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#cc2200] mb-3">By invitation, open to those who qualify</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Who we want in the room.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INVITES.map((i) => (
            <div key={i.title} className="p-6 rounded-lg border border-white/10 bg-white/[0.02] flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">{i.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5 flex-1">{i.text}</p>
              <a
                href={i.href}
                {...(i.external ? linkProps : {})}
                className="inline-flex items-center gap-2 self-start min-h-[44px] sm:min-h-[40px] text-sm font-bold text-white hover:text-[#cc2200] transition-colors"
              >
                {i.cta}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Compact icon row, used in the footer. */
export function CommunityJoinLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {COMMUNITY_LINKS.map((l) => {
        const Icon = ICONS[l.id];
        return (
          <a
            key={l.id}
            href={l.href}
            {...linkProps}
            aria-label={`Join Hell Road on ${l.label}`}
            className="inline-flex items-center gap-1.5 px-3 min-h-[40px] md:min-h-[32px] rounded border border-white/10 text-[11px] font-bold uppercase tracking-wide text-gray-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{l.label}</span>
          </a>
        );
      })}
    </div>
  );
}

const DASHBOARD_ROOTS = new Set(['dashboard', 'admin', 'seller', 'student', 'teacher']);

function isDashboardPath(pathname: string | null) {
  if (!pathname) return false;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;
  return DASHBOARD_ROOTS.has(segments[0]) || segments.some((s) => s.endsWith('dashboard'));
}

/** Persistent join bar shown on every dashboard route. */
export function DashboardCommunityBar() {
  const pathname = usePathname();
  if (!isDashboardPath(pathname)) return null;

  return (
    <>
      <div aria-hidden className="h-28 sm:h-14 shrink-0" />
      <aside
        aria-label="Join the Hell Road community"
        className="fixed z-[9990] left-3 right-3 bottom-24 sm:bottom-3 sm:left-3 sm:right-72 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 rounded-lg border border-white/10 bg-[#0B0C0F]/95 backdrop-blur"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#cc2200]">Join the community</span>
        <div className="flex flex-wrap gap-2">
          {COMMUNITY_LINKS.map((l) => {
            const Icon = ICONS[l.id];
            return (
              <a
                key={l.id}
                href={l.href}
                {...linkProps}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold text-white hover:opacity-80 transition-opacity"
                style={{ background: l.color }}
              >
                <Icon className="w-3.5 h-3.5" />
                {l.label}
              </a>
            );
          })}
        </div>
      </aside>
    </>
  );
}
