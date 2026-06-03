'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  ChevronRight,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { orderApi } from '@/lib/api-client';

/**
 * Acquisitions — the authenticated shopper's REAL order history from order-service
 * (GET /orders/mine). No mock ledger; honest loading / empty / error states.
 */
const money = (amount: unknown, currency?: string) =>
  `${(currency || 'USD').toUpperCase()} ${Number(amount ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;

const STATUS_STYLE: Record<string, string> = {
  delivered: 'bg-green-50 text-green-600',
  shipped: 'bg-blue-50 text-blue-600',
  confirmed: 'bg-plum/10 text-plum',
  processing: 'bg-gold/10 text-gold',
  pending: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-50 text-red-500',
  refunded: 'bg-red-50 text-red-500',
};

export default function AcquisitionsPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await orderApi.mine({ pageSize: 50 });
      if (cancelled) return;
      if (res.ok) {
        setOrders(res.data.items ?? []);
      } else {
        setError(res.error.message || 'Could not load your acquisitions.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = orders.find((o) => o.id === selectedId);

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Detail modal — real order */}
      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="max-w-3xl bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
          {selected && (
            <div className="flex flex-col">
              <div className="bg-ivory p-10 border-b border-border flex items-start justify-between">
                <div className="space-y-3">
                  <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-plum/20 text-plum px-3 py-1">
                    {selected.status}
                  </Badge>
                  <h3 className="text-2xl font-headline font-bold italic leading-tight text-gray-900">
                    {selected.orderNumber}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">
                    {new Date(selected.createdAt).toLocaleString()} · Payment: {selected.paymentStatus}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Items</p>
                  <div className="divide-y divide-border border border-border">
                    {(selected.items ?? []).map((it: any) => (
                      <div key={it.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight text-gray-900">{it.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono">
                            {it.variantName ? `${it.variantName} · ` : ''}SKU {it.sku} · ×{it.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-bold tabular text-gray-900">
                          {money(it.total, selected.currencyCode)}
                        </span>
                      </div>
                    ))}
                    {(selected.items ?? []).length === 0 && (
                      <p className="p-4 text-[10px] text-gray-400 italic">No line items recorded.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-w-xs ml-auto">
                  <Row label="Subtotal" value={money(selected.subtotal, selected.currencyCode)} />
                  {Number(selected.discountAmount) > 0 && (
                    <Row label="Discount" value={`- ${money(selected.discountAmount, selected.currencyCode)}`} />
                  )}
                  <Row label="Shipping" value={money(selected.shippingAmount, selected.currencyCode)} />
                  <Row
                    label={`Tax${selected.taxInclusive ? ' (incl.)' : ''}`}
                    value={money(selected.taxAmount, selected.currencyCode)}
                  />
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="font-body text-plum tabular">{money(selected.totalAmount, selected.currencyCode)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">Acquisitions</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
          Acquisitions
        </h1>
        <p className="text-sm text-gray-500 font-light italic">Your Maison order history.</p>
      </header>

      <Card className="bg-white border-border shadow-luxury overflow-hidden rounded-none">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-plum" />
            <p className="text-[10px] font-bold uppercase tracking-widest italic">Loading your acquisitions…</p>
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
                <TableHead className="text-[9px] uppercase font-bold pl-8">Order</TableHead>
                <TableHead className="text-[9px] uppercase font-bold">Date</TableHead>
                <TableHead className="text-[9px] uppercase font-bold">Items</TableHead>
                <TableHead className="text-[9px] uppercase font-bold">Total</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-center">Status</TableHead>
                <TableHead className="text-[9px] uppercase font-bold text-right pr-8">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow
                  key={o.id}
                  className="hover:bg-ivory/30 transition-colors group cursor-pointer"
                  onClick={() => setSelectedId(o.id)}
                >
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-12 bg-muted rounded-sm flex items-center justify-center text-gray-400 border border-border">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">
                        {o.orderNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] text-gray-500 font-mono">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-[10px] text-gray-500">{(o.items ?? []).length}</TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-gray-900 font-body tabular">
                      {money(o.totalAmount, o.currencyCode)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn('text-[8px] uppercase tracking-tighter border-none', STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-500')}
                    >
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      {o.paymentStatus === 'paid' && <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />}
                      {o.paymentStatus}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center space-y-4">
                    <Package className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="text-sm font-bold uppercase tracking-widest italic text-gray-400">
                      No acquisitions yet
                    </p>
                    <Link
                      href={`/${countryCode}`}
                      className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
                    >
                      Explore the Maison <ChevronRight className="ml-1 w-3 h-3" />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs font-light italic text-gray-600">
      <span>{label}</span>
      <span className="font-body font-semibold tabular not-italic">{value}</span>
    </div>
  );
}
