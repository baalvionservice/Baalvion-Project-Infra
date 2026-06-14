'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  returnApi,
  type OrderLineItem,
  type ReturnItemInput,
  type ReturnRecord,
} from '@/lib/api-client';

/**
 * ReturnRequest — lets the shopper request a return on a shipped/delivered order
 * (POST /returns), backed by order-service. Extracted verbatim from the Acquisitions
 * detail modal to keep the page under the 800-line file limit; behavior and props
 * are unchanged.
 */

const RETURN_REASONS = [
  'Did not meet expectations',
  'Sizing or fit',
  'Arrived damaged',
  'Incorrect item received',
  'Changed my mind',
  'Other',
] as const;

type ReturnCondition = NonNullable<ReturnItemInput['condition']>;
const CONDITIONS: ReturnCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];

interface ReturnLineState {
  selected: boolean;
  quantity: number;
  condition: ReturnCondition | '';
}

export function ReturnRequest({
  orderId,
  items,
  countryCode,
}: {
  orderId: string;
  items: OrderLineItem[];
  countryCode: string;
}) {
  // Only line items that carry an orderItemId can be returned.
  const returnable = useMemo(() => items.filter((it) => !!it.id), [items]);

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Record<string, ReturnLineState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ReturnRecord | null>(null);

  const toggleForm = () => {
    setFormError(null);
    if (!open) {
      // Seed line state from the returnable items.
      const seeded: Record<string, ReturnLineState> = {};
      for (const it of returnable) {
        if (it.id) seeded[it.id] = { selected: false, quantity: 1, condition: '' };
      }
      setLines(seeded);
    }
    setOpen((v) => !v);
  };

  const updateLine = (id: string, patch: Partial<ReturnLineState>) => {
    setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const selectedLines: ReturnItemInput[] = Object.entries(lines)
    .filter(([, st]) => st.selected)
    .map(([orderItemId, st]) => ({
      orderItemId,
      quantity: st.quantity,
      ...(st.condition ? { condition: st.condition } : {}),
    }));

  const effectiveReason = reason === 'Other' ? otherReason.trim() : reason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!effectiveReason) {
      setFormError('Please choose a reason for the return.');
      return;
    }
    if (selectedLines.length === 0) {
      setFormError('Select at least one item to return.');
      return;
    }

    // Optimistic: lock the form while the request is in flight; roll back on failure.
    setSubmitting(true);
    const res = await returnApi.create({
      orderId,
      reason: effectiveReason,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      items: selectedLines,
    });

    if (res.ok) {
      setConfirmation(res.data);
      setOpen(false);
    } else if (res.error.code === 409) {
      setFormError(res.error.message || 'Returns can only be requested for delivered or shipped orders.');
    } else {
      setFormError(res.error.message || 'Could not submit your return. Please try again.');
    }
    setSubmitting(false);
  };

  if (confirmation) {
    return (
      <section className="space-y-3 pt-2">
        <div className="border border-green-200 bg-green-50/60 p-6 space-y-3">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-[11px] font-bold uppercase tracking-widest">Return requested</p>
          </div>
          <p className="text-[12px] text-gray-600 font-light italic">
            Your return{' '}
            <span className="font-body font-semibold not-italic text-gray-900">{confirmation.returnNumber}</span>{' '}
            has been received. We&apos;ll be in touch with next steps.
          </p>
          <Link
            href={`/${countryCode}/account/returns`}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
          >
            Track this return <ChevronRight className="ml-1 w-3 h-3" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 pt-2 border-t border-border">
      {!open ? (
        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-[11px] text-gray-400 font-light italic">
            Not quite right? You may request a return on this order.
          </p>
          <Button
            variant="outline"
            onClick={toggleForm}
            className="rounded-none border-plum/30 text-plum hover:bg-plum hover:text-white h-10 px-6 text-[9px] font-bold uppercase tracking-widest transition-all shrink-0"
          >
            <RotateCcw className="w-3 h-3 mr-2" /> Request Return
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-plum" /> Request a Return
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={toggleForm}
              className="h-8 px-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-plum rounded-none"
            >
              Cancel
            </Button>
          </div>

          {returnable.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic border border-dashed border-border p-4">
              This order&apos;s items can&apos;t be returned online. Please contact the Maison.
            </p>
          ) : (
            <>
              {/* Reason */}
              <div className="space-y-3">
                <Label htmlFor="return-reason" className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Reason for return <span className="text-red-400">*</span>
                </Label>
                <select
                  id="return-reason"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-12 rounded-none border border-slate-200 bg-white px-4 text-sm font-light text-gray-700 focus:outline-none focus:ring-2 focus:ring-plum/30"
                >
                  <option value="" disabled>
                    Select a reason…
                  </option>
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {reason === 'Other' && (
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Tell us more…"
                    aria-label="Other reason"
                    className="w-full h-12 rounded-none border border-slate-200 bg-white px-4 text-sm font-light text-gray-700 focus:outline-none focus:ring-2 focus:ring-plum/30"
                  />
                )}
              </div>

              {/* Items */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Items to return <span className="text-red-400">*</span>
                </Label>
                <div className="divide-y divide-border border border-border">
                  {returnable.map((it) => {
                    const id = it.id as string;
                    const st = lines[id] ?? { selected: false, quantity: 1, condition: '' };
                    const maxQty = Math.max(1, Number(it.quantity ?? 1));
                    return (
                      <div key={id} className="p-4 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={st.selected}
                            onChange={(e) => updateLine(id, { selected: e.target.checked })}
                            className="w-4 h-4 accent-plum"
                          />
                          <span className="text-xs font-bold uppercase tracking-tight text-gray-900">
                            {it.name ?? 'Item'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono ml-auto">×{maxQty} ordered</span>
                        </label>

                        {st.selected && (
                          <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`qty-${id}`}
                                className="text-[8px] uppercase font-bold tracking-widest text-slate-400"
                              >
                                Quantity
                              </Label>
                              <select
                                id={`qty-${id}`}
                                value={st.quantity}
                                onChange={(e) => updateLine(id, { quantity: Number(e.target.value) })}
                                className="w-full h-10 rounded-none border border-slate-200 bg-white px-3 text-xs font-light text-gray-700 focus:outline-none focus:ring-2 focus:ring-plum/30"
                              >
                                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label
                                htmlFor={`cond-${id}`}
                                className="text-[8px] uppercase font-bold tracking-widest text-slate-400"
                              >
                                Condition (optional)
                              </Label>
                              <select
                                id={`cond-${id}`}
                                value={st.condition}
                                onChange={(e) =>
                                  updateLine(id, {
                                    condition: e.target.value as ReturnCondition | '',
                                  })
                                }
                                className="w-full h-10 rounded-none border border-slate-200 bg-white px-3 text-xs font-light text-gray-700 focus:outline-none focus:ring-2 focus:ring-plum/30"
                              >
                                <option value="">—</option>
                                {CONDITIONS.map((c) => (
                                  <option key={c} value={c}>
                                    {c.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="return-notes" className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Additional notes (optional)
                </Label>
                <Textarea
                  id="return-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know…"
                  className="rounded-none border-slate-200 text-sm font-light min-h-[80px]"
                />
              </div>

              {formError && (
                <p className="text-[12px] text-red-600 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-none bg-black text-white hover:bg-plum h-12 px-10 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Submitting…
                    </>
                  ) : (
                    'Submit Return Request'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </section>
  );
}
