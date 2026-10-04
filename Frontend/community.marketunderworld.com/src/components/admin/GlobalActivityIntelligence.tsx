"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/ui/ListingCard';
import { Activity, Loader2 } from 'lucide-react';
import { adminOverview, type AdminOverview } from '@/lib/api/admin-overview';

const QUEUES: { key: keyof AdminOverview['queues']; label: string; href: string }[] = [
  { key: 'pendingBookings', label: 'Guest list & VIP requests', href: '/admin/clubs/bookings' },
  { key: 'pendingApplications', label: 'Locals applications', href: '/admin/locals/applications' },
  { key: 'pendingProfiles', label: 'Candidate profiles to verify', href: '/nightlife/verify' },
  { key: 'pendingEmployers', label: 'Employers to verify', href: '/nightlife/verify' },
  { key: 'submittedReports', label: 'Bounty reports to review', href: '/admin/bounty' },
  { key: 'unreadThreads', label: 'Bounty chats with new messages', href: '/admin/bounty' },
];

const INVENTORY: { key: keyof AdminOverview['inventory']; label: string }[] = [
  { key: 'clubs', label: 'Clubs listed' },
  { key: 'upcomingEvents', label: 'Upcoming events' },
  { key: 'listings', label: 'Open Locals listings' },
  { key: 'activeGigs', label: 'Open staffing gigs' },
  { key: 'hunters', label: 'Bounty participants' },
];

// Real counts from community-service (COUNT(*) over live tables). Replaces the former
// simulated activity feed, whose figures were generated from the clock.
export const GlobalActivityIntelligence = () => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminOverview().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load the overview'));
  }, []);

  if (error) return <p role="alert" className="text-sm text-red-400 py-10 text-center">{error}</p>;
  if (!data) {
    return <div className="h-[300px] flex items-center justify-center gap-3 text-text-muted text-xs uppercase font-mono tracking-widest"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2"><Activity className="w-4 h-4 text-brand-green" /> Needs attention</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUEUES.map((q) => (
            <Link key={q.key} href={q.href}>
              <ListingCard className={`p-6 space-y-2 hover:border-brand-green transition-all ${data.queues[q.key] > 0 ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/5'}`}>
                <div className="text-4xl font-bold text-white font-mono">{data.queues[q.key].toLocaleString()}</div>
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{q.label}</div>
              </ListingCard>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white">Inventory</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {INVENTORY.map((i) => (
            <ListingCard key={i.key} className="p-6 space-y-2 border-white/5">
              <div className="text-3xl font-bold text-white font-mono">{data.inventory[i.key].toLocaleString()}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{i.label}</div>
            </ListingCard>
          ))}
        </div>
      </section>
    </div>
  );
};
