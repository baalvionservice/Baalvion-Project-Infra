'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Truck,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  orderApi,
  type Shipment,
  type ShipmentEvent,
} from '@/lib/api-client';

/**
 * ShipmentTracking — the order's REAL shipment timeline (GET /orders/:id/shipments)
 * from order-service. Extracted verbatim from the Acquisitions detail modal to keep
 * the page under the 800-line file limit; behavior and props are unchanged.
 */

const SHIPMENT_STATUS_LABEL: Record<Shipment['status'], string> = {
  pending: 'Preparing',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery issue',
  returned: 'Returned',
};

export function ShipmentTracking({ orderId }: { orderId: string }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const res = await orderApi.shipments(orderId);
      if (cancelled) return;
      if (res.ok) {
        setShipments(res.data ?? []);
      } else {
        setError(res.error.message || 'Could not load tracking.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <section className="space-y-4 pt-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
        <Truck className="w-3.5 h-3.5 text-plum" /> Shipment Tracking
      </p>

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-3 text-gray-400 border border-border">
          <Loader2 className="w-4 h-4 animate-spin text-plum" />
          <span className="text-[10px] font-bold uppercase tracking-widest italic">Loading tracking…</span>
        </div>
      ) : error ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-red-500 border border-border">
          <AlertCircle className="w-6 h-6" />
          <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="py-8 px-6 text-center border border-dashed border-border bg-ivory/40">
          <p className="text-[11px] text-gray-400 font-light italic">
            No tracking yet — we&apos;ll update you when your order ships.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {shipments.map((s) => (
            <ShipmentBlock key={s.id} shipment={s} />
          ))}
        </div>
      )}
    </section>
  );
}

function ShipmentBlock({ shipment }: { shipment: Shipment }) {
  const events = useMemo(
    () =>
      [...(shipment.events ?? [])].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      ),
    [shipment.events],
  );

  return (
    <div className="border border-border">
      <div className="bg-ivory/60 p-5 flex flex-wrap items-start justify-between gap-3 border-b border-border">
        <div className="space-y-1">
          <Badge
            variant="outline"
            className={cn(
              'text-[8px] uppercase tracking-tighter border-none px-3 py-1',
              shipment.status === 'delivered'
                ? 'bg-green-50 text-green-600'
                : shipment.status === 'failed'
                  ? 'bg-red-50 text-red-500'
                  : shipment.status === 'returned'
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-blue-50 text-blue-600',
            )}
          >
            {SHIPMENT_STATUS_LABEL[shipment.status] ?? shipment.status}
          </Badge>
          {shipment.carrier && (
            <p className="text-[10px] font-bold uppercase tracking-tight text-gray-900">{shipment.carrier}</p>
          )}
          {shipment.trackingNumber && (
            <p className="text-[9px] text-gray-400 font-mono">
              {shipment.trackingUrl ? (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-plum hover:text-gold transition-colors"
                >
                  {shipment.trackingNumber}
                  <ExternalLink className="ml-1 w-2.5 h-2.5" />
                </a>
              ) : (
                shipment.trackingNumber
              )}
            </p>
          )}
        </div>
        <div className="text-right space-y-0.5">
          {shipment.deliveredAt ? (
            <p className="text-[9px] font-bold uppercase tracking-widest text-green-600">
              Delivered {new Date(shipment.deliveredAt).toLocaleDateString()}
            </p>
          ) : shipment.estimatedDelivery ? (
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
              Est. {new Date(shipment.estimatedDelivery).toLocaleDateString()}
            </p>
          ) : null}
          {shipment.shippedAt && (
            <p className="text-[9px] text-gray-400 font-mono">
              Shipped {new Date(shipment.shippedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <p className="p-5 text-[10px] text-gray-400 italic">No tracking events recorded yet.</p>
      ) : (
        <ol className="p-6 space-y-0">
          {events.map((ev: ShipmentEvent, idx: number) => {
            const isLatest = idx === 0;
            const isLast = idx === events.length - 1;
            return (
              <li key={`${ev.status}-${ev.at}-${idx}`} className="relative flex gap-4 pb-6 last:pb-0">
                {/* connector line */}
                {!isLast && (
                  <span
                    className="absolute left-[5px] top-3 bottom-0 w-px bg-border"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 mt-1 w-[11px] h-[11px] rounded-full border-2 shrink-0',
                    isLatest ? 'bg-plum border-plum' : 'bg-white border-gray-300',
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 -mt-0.5">
                  <p
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-tight',
                      isLatest ? 'text-plum' : 'text-gray-700',
                    )}
                  >
                    {SHIPMENT_STATUS_LABEL[ev.status as Shipment['status']] ?? ev.status}
                  </p>
                  {ev.message && <p className="text-[11px] text-gray-500 font-light italic">{ev.message}</p>}
                  <p className="text-[9px] text-gray-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{new Date(ev.at).toLocaleString()}</span>
                    {ev.location && (
                      <span className="inline-flex items-center">
                        <MapPin className="w-2.5 h-2.5 mr-0.5" />
                        {ev.location}
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
