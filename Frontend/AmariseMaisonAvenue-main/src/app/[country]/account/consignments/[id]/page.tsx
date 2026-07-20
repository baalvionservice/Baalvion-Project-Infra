'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronRight,
  Gem,
  Loader2,
  AlertCircle,
  PackageCheck,
  ShieldCheck,
  Award,
  XCircle,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { consignmentApi } from '@/lib/api-client';
import type { Consignment, ItemTimeline, TimelineEvent } from '@/lib/types';
import { BrandImage } from '@/components/ui/BrandImage';

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-500',
  under_review: 'bg-gold/10 text-gold',
  quoted: 'bg-plum/10 text-plum',
  accepted: 'bg-blue-50 text-blue-600',
  received: 'bg-blue-50 text-blue-600',
  listed: 'bg-indigo-50 text-indigo-600',
  sold: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-500',
  withdrawn: 'bg-red-50 text-red-500',
};

const EVENT_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  consignor_submission: { label: 'Submitted for consignment', icon: User },
  platform_custody: { label: 'Received by the Maison', icon: PackageCheck },
  prior_ownership: { label: 'Prior ownership', icon: User },
  sold: { label: 'Sold', icon: Gem },
  returned: { label: 'Returned to seller', icon: PackageCheck },
  authentication_authenticated: { label: 'Authenticated', icon: ShieldCheck },
  authentication_rejected: { label: 'Authentication declined', icon: XCircle },
  certificate_issued: { label: 'Certificate of authenticity issued', icon: Award },
};

function ItemTimelineView({ requestId, itemId }: { requestId: string; itemId: string }) {
  const [timeline, setTimeline] = useState<ItemTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    consignmentApi.getItemTimeline(requestId, itemId).then((res) => {
      if (!active) return;
      if (res.ok) setTimeline(res.data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [requestId, itemId]);

  if (loading) {
    return (
      <div className="py-6 flex items-center text-gray-400 space-x-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Loading timeline…</span>
      </div>
    );
  }

  const events: TimelineEvent[] = timeline?.events ?? [];
  if (events.length === 0) {
    return <p className="text-[11px] text-gray-400 italic py-4">No authenticity milestones recorded yet.</p>;
  }

  return (
    <ol className="space-y-5 pt-2">
      {events.map((event, idx) => {
        const meta = EVENT_META[event.type] || { label: event.type.replace(/_/g, ' '), icon: PackageCheck };
        const Icon = meta.icon;
        return (
          <li key={idx} className="flex items-start space-x-4">
            <div className="w-8 h-8 rounded-full bg-ivory border border-border flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-plum" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-900">{meta.label}</p>
                <span className="text-[10px] text-gray-400 font-mono shrink-0">
                  {event.date ? new Date(event.date).toLocaleDateString() : '—'}
                </span>
              </div>
              {event.label && <p className="text-[11px] text-gray-500 mt-0.5">{event.label}</p>}
              {event.confidence && (
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                  {event.confidence} confidence
                </p>
              )}
              {event.code && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{event.code}</p>}
              {event.notes && <p className="text-[11px] text-gray-500 italic mt-1">{event.notes}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ConsignmentDetailPage() {
  const { country, id } = useParams();
  const countryCode = (country as string) || 'us';
  const requestId = id as string;

  const [consignment, setConsignment] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await consignmentApi.get(requestId);
      if (cancelled) return;
      if (res.ok) {
        setConsignment(res.data);
      } else {
        setError(res.error.message || 'Could not load this consignment.');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [requestId]);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <Link href={`/${countryCode}/account/consignments`}>Consignments</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">{consignment?.reference || requestId}</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
          Consignment {consignment?.reference || ''}
        </h1>
        {consignment && (
          <Badge
            variant="outline"
            className={cn('text-[9px] uppercase tracking-tighter border-none', STATUS_STYLE[String(consignment.status)] || 'bg-slate-100 text-slate-500')}
          >
            {String(consignment.status).replace(/_/g, ' ')}
          </Badge>
        )}
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-gray-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-plum" />
          <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading…</p>
        </div>
      ) : error || !consignment ? (
        <div className="py-32 flex flex-col items-center justify-center text-red-500 space-y-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-[11px] font-bold uppercase tracking-widest">{error || 'Consignment not found.'}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {(consignment.items ?? []).map((item) => {
            const artifactName = [item.brand, item.model].filter(Boolean).join(' ') || item.brand;
            if (!item.id) return null;
            return (
              <Card key={item.id} className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                  <div className="aspect-square md:aspect-auto relative bg-muted">
                    <BrandImage
                      src={item.photoUrls?.[0]}
                      alt={artifactName}
                      className="absolute inset-0"
                      imgClassName="object-contain p-6"
                      label={artifactName}
                    />
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <h2 className="text-xl font-headline font-bold italic text-gray-900">{artifactName}</h2>
                      {item.serialNumber && (
                        <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">S/N {item.serialNumber}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Authenticity Timeline</p>
                      <ItemTimelineView requestId={requestId} itemId={item.id} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
