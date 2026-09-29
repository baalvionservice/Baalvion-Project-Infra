'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronRight,
  Gem,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { consignmentApi } from '@/lib/api-client';
import type { Consignment } from '@/lib/types';

/**
 * My Consignments — the authenticated seller's REAL consignment requests
 * (consignmentApi.listMine). Mirrors the acquisitions page pattern: honest
 * loading / empty / error states, no mock data.
 */
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

function itemSummary(c: Consignment): string {
  const items = c.items ?? [];
  if (items.length === 0) return '—';
  const first = items[0];
  const head = [first.brand, first.model].filter(Boolean).join(' ');
  return items.length > 1 ? `${head} +${items.length - 1} more` : head || '—';
}

export default function MyConsignmentsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await consignmentApi.listMine({ pageSize: 50 });
      if (cancelled) return;
      if (res.ok) {
        setConsignments(res.data.items ?? []);
      } else {
        setError(res.error.message || 'Could not load your consignments.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">Consignments</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
          Consignments
        </h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-light italic">
            Pieces you have submitted to the Maison for sale.
          </p>
          <Link
            href={`/${countryCode}/sell`}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors shrink-0"
          >
            <Plus className="mr-2 w-3 h-3" /> New consignment
          </Link>
        </div>
      </header>

      <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-plum" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">
              Loading your consignments…
            </p>
          </div>
        ) : error ? (
          <div className="py-32 flex flex-col items-center justify-center text-red-500 space-y-3">
            <AlertCircle className="w-8 h-8" />
            <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-ivory/50">
              <TableRow>
                <TableHead className="text-[9px] uppercase font-bold pl-8">Reference</TableHead>
                <TableHead className="text-[9px] uppercase font-bold">Pieces</TableHead>
                <TableHead className="text-[9px] uppercase font-bold">Submitted</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consignments.map((c) => (
                <TableRow key={c.id} className="hover:bg-ivory/30 transition-colors group">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-12 bg-muted rounded-sm flex items-center justify-center text-gray-400 border border-border">
                        <Gem className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-tight text-gray-900 font-mono">
                        {c.reference}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] text-gray-600">{itemSummary(c)}</TableCell>
                  <TableCell className="text-[10px] text-gray-500 font-mono">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[8px] uppercase tracking-tighter border-none',
                        STATUS_STYLE[String(c.status)] || 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {String(c.status).replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {consignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-32 text-center space-y-4">
                    <Gem className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="text-sm font-bold uppercase tracking-widest italic text-gray-400">
                      No consignments yet
                    </p>
                    <Link
                      href={`/${countryCode}/sell`}
                      className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
                    >
                      Consign a piece <ChevronRight className="ml-1 w-3 h-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
