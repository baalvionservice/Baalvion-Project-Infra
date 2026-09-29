'use client';

import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { returnApi, type ReturnRecord, type ReturnRecordItem } from '@/lib/api-client';

/**
 * Returns — the authenticated shopper's REAL return/RMA history from order-service
 * (GET /returns/mine). Mirrors the Acquisitions page: honest loading / empty / error
 * states, no fabricated records. The auth redirect is owned by the account layout
 * (AccountShell), exactly as the sibling account pages rely on it.
 */
const money = (amount: unknown, currency?: string) =>
  `${(currency || 'USD').toUpperCase()} ${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;

const STATUS_STYLE: Record<ReturnRecord['status'], string> = {
  requested: 'bg-slate-100 text-slate-500',
  approved: 'bg-plum/10 text-plum',
  received: 'bg-slate-100 text-slate-500',
  refunded: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-500',
  closed: 'bg-slate-100 text-slate-400',
};

export default function ReturnsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { user } = useAuth();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await returnApi.mine({ pageSize: 50 });
      if (cancelled) return;
      if (res.ok) {
        setReturns(res.data.items ?? []);
      } else {
        setError(res.error.message || 'Could not load your returns.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <Link href={`/${countryCode}/account/acquisitions`}>Acquisitions</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">Returns</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
          Returns
        </h1>
        <p className="text-sm text-gray-500 font-light italic">
          Your Maison return requests and their progress.
        </p>
      </header>

      {loading ? (
        <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
          <div className="py-32 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-plum" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading your returns…</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
          <div className="py-32 flex flex-col items-center justify-center text-red-500 space-y-3">
            <AlertCircle className="w-8 h-8" />
            <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
          </div>
        </Card>
      ) : returns.length === 0 ? (
        <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <RotateCcw className="w-12 h-12 text-gray-300" />
            <p className="text-sm font-bold uppercase tracking-widest italic text-gray-400">
              You haven&apos;t requested any returns
            </p>
            <Link
              href={`/${countryCode}/account/acquisitions`}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
            >
              View your acquisitions <ChevronRight className="ml-1 w-3 h-3" />
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {returns.map((r) => (
            <ReturnCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReturnCard({ record }: { record: ReturnRecord }) {
  const isRefunded = record.status === 'refunded';
  // The return record carries no currency code; refund amounts default to USD formatting.
  return (
    <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
      <div className="bg-ivory p-8 border-b border-border flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-4 h-4 text-plum" />
            <h3 className="text-xl font-headline font-bold italic leading-tight text-gray-900">
              {record.returnNumber}
            </h3>
          </div>
          <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
            Requested {new Date(record.createdAt).toLocaleDateString()} · Order {record.orderId.slice(0, 8)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-[8px] uppercase tracking-tighter border-none px-3 py-1',
            STATUS_STYLE[record.status],
          )}
        >
          {record.status}
        </Badge>
      </div>

      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Reason</p>
          <p className="text-sm font-light italic text-gray-700">{record.reason}</p>
          {record.notes && (
            <p className="text-[11px] font-light text-gray-400 italic pt-1">{record.notes}</p>
          )}
        </div>

        {record.items && record.items.length > 0 && (
          <div className="space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Items</p>
            <div className="divide-y divide-border border border-border">
              {record.items.map((it: ReturnRecordItem) => (
                <div key={it.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-tight text-gray-900 font-mono">
                      Item {it.orderItemId.slice(0, 8)}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono">
                      ×{it.quantity}
                      {it.condition ? ` · ${it.condition}` : ''}
                      {it.reason ? ` · ${it.reason}` : ''}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold tabular text-gray-700">
                    {money(it.refundAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            {isRefunded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600">
                  Refunded{record.refundMethod ? ` · ${record.refundMethod}` : ''}
                </span>
              </>
            ) : (
              <span className="text-gray-400">Updated {new Date(record.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
              {isRefunded ? 'Refund' : 'Estimated refund'}
            </p>
            <p className="text-sm font-body font-bold text-plum tabular">
              {money(record.totalRefund)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
