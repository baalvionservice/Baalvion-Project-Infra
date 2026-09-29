'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  consignmentApi,
  type ConsignmentItemInput,
  type ConsignmentSubmitPayload,
} from '@/lib/api-client';
import type { Consignment, ConditionGrade } from '@/lib/types';

/**
 * SellPage — REAL consignment intake.
 *
 * Replaces the former fake "enter email → simulated auth → /admin/vendor" redirect with a
 * genuine consignment request form that POSTs to consignmentApi.submit (guest-capable). On
 * success the seller sees the returned reference; errors are surfaced inline.
 */

const CONDITION_OPTIONS: { value: ConditionGrade; label: string }[] = [
  { value: 'pristine', label: 'Pristine' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];

interface ItemDraft {
  brand: string;
  model: string;
  category: string;
  color: string;
  material: string;
  conditionGrade: ConditionGrade | '';
  askingPrice: string;
  serialNumber: string;
  description: string;
  photoUrls: string;
  accessories: string;
}

function emptyItem(): ItemDraft {
  return {
    brand: '',
    model: '',
    category: '',
    color: '',
    material: '',
    conditionGrade: '',
    askingPrice: '',
    serialNumber: '',
    description: '',
    photoUrls: '',
    accessories: '',
  };
}

/** Split a newline/comma separated list into a clean string array (drops empties). */
function toList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const FIELD =
  'h-12 rounded-none border-gray-300 bg-white text-sm font-light placeholder:text-gray-300 focus:ring-0 focus:border-black transition-all';
const FIELD_LABEL =
  'text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500';

export default function SellPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Consignment | null>(null);

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  };
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const validate = (): string | null => {
    if (!contactEmail.trim()) return 'Please provide a contact email so our curators can reach you.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      return 'That email address does not look valid.';
    }
    if (items.length === 0) return 'Add at least one piece to consign.';
    const missingBrand = items.findIndex((it) => !it.brand.trim());
    if (missingBrand >= 0) return `Piece ${missingBrand + 1}: a brand is required.`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = validate();
    if (problem) {
      setFieldError(problem);
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);

    const payloadItems: ConsignmentItemInput[] = items.map((it) => {
      const item: ConsignmentItemInput = { brand: it.brand.trim() };
      if (it.model.trim()) item.model = it.model.trim();
      if (it.category.trim()) item.category = it.category.trim();
      if (it.color.trim()) item.color = it.color.trim();
      if (it.material.trim()) item.material = it.material.trim();
      if (it.conditionGrade) item.conditionGrade = it.conditionGrade;
      const price = Number(it.askingPrice);
      if (it.askingPrice.trim() && Number.isFinite(price) && price > 0) {
        item.askingPrice = price;
      }
      if (it.serialNumber.trim()) item.serialNumber = it.serialNumber.trim();
      if (it.description.trim()) item.description = it.description.trim();
      const photos = toList(it.photoUrls);
      if (photos.length) item.photoUrls = photos;
      const accessories = toList(it.accessories);
      if (accessories.length) item.accessories = accessories;
      return item;
    });

    const payload: ConsignmentSubmitPayload = {
      contactEmail: contactEmail.trim(),
      items: payloadItems,
    };
    if (contactName.trim()) payload.contactName = contactName.trim();
    if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();
    if (notes.trim()) payload.notes = notes.trim();

    const res = await consignmentApi.submit(payload);
    setIsSubmitting(false);

    if (res.ok) {
      setSubmitted(res.data);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(res.error.message || 'We could not submit your consignment. Please try again.');
    }
  };

  return (
    <div className="bg-white min-h-screen font-body text-gray-900">
      <header className="h-20 border-b border-gray-100 px-6 md:px-12 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex-1">
          <Link
            href={`/${countryCode}`}
            className="text-[10px] font-bold tracking-[0.1em] text-gray-500 hover:text-black transition-colors flex items-center"
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Shopping
          </Link>
        </div>
        <div className="text-center">
          <Link href={`/${countryCode}`} className="group">
            <span className="font-headline text-2xl md:text-3xl font-medium tracking-[0.05em] text-black">
              AMARISÉ{' '}
              <span className="text-xs font-bold tracking-[0.2em] ml-2 uppercase opacity-60 font-body italic">
                Maison Avenue
              </span>
            </span>
          </Link>
        </div>
        <div className="flex-1" />
      </header>

      <main className="container mx-auto px-6 py-16 md:py-24 max-w-3xl">
        {submitted ? (
          <ConsignmentSuccess consignment={submitted} countryCode={countryCode} />
        ) : (
          <>
            <div className="text-center space-y-4 mb-14">
              <span className="text-plum text-[10px] font-bold tracking-[0.5em] uppercase">
                Sell &amp; Consign
              </span>
              <h1 className="text-4xl md:text-5xl font-headline font-medium tracking-tight">
                Consign with the Maison
              </h1>
              <p className="text-[13px] text-gray-500 font-light italic leading-relaxed max-w-xl mx-auto">
                Tell us about the pieces you wish to sell. Our specialists will review your
                submission and respond with a private valuation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-14">
              {/* Contact */}
              <section className="space-y-6">
                <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-gray-900 border-b border-gray-100 pb-3">
                  Your Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className={FIELD_LABEL}>Full Name</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your name"
                      className={FIELD}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className={FIELD_LABEL}>Email Address *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={FIELD}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contactPhone" className={FIELD_LABEL}>Phone (optional)</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className={FIELD}
                    />
                  </div>
                </div>
              </section>

              {/* Items */}
              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-gray-900">
                    Pieces to Consign
                  </h2>
                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    className="rounded-none border-gray-900 h-10 px-5 text-[9px] font-bold tracking-[0.2em] uppercase"
                  >
                    <Plus className="w-3 h-3 mr-2" /> Add Piece
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-100 p-6 md:p-8 space-y-6 bg-ivory/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-plum">
                        Piece {String(index + 1).padStart(2, '0')}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove piece ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Brand *</Label>
                        <Input
                          value={item.brand}
                          onChange={(e) => updateItem(index, { brand: e.target.value })}
                          placeholder="e.g. Hermès"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Model</Label>
                        <Input
                          value={item.model}
                          onChange={(e) => updateItem(index, { model: e.target.value })}
                          placeholder="e.g. Birkin 30"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Category</Label>
                        <Input
                          value={item.category}
                          onChange={(e) => updateItem(index, { category: e.target.value })}
                          placeholder="e.g. Handbag"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Condition</Label>
                        <Select
                          value={item.conditionGrade || undefined}
                          onValueChange={(v) =>
                            updateItem(index, { conditionGrade: v as ConditionGrade })
                          }
                        >
                          <SelectTrigger className="rounded-none border-gray-300 bg-white h-12 text-sm">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-border shadow-luxury rounded-none">
                            {CONDITION_OPTIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-xs">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Color</Label>
                        <Input
                          value={item.color}
                          onChange={(e) => updateItem(index, { color: e.target.value })}
                          placeholder="e.g. Noir"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Material</Label>
                        <Input
                          value={item.material}
                          onChange={(e) => updateItem(index, { material: e.target.value })}
                          placeholder="e.g. Togo leather"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Asking Price (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={item.askingPrice}
                          onChange={(e) => updateItem(index, { askingPrice: e.target.value })}
                          placeholder="Optional"
                          className={FIELD}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={FIELD_LABEL}>Serial Number</Label>
                        <Input
                          value={item.serialNumber}
                          onChange={(e) => updateItem(index, { serialNumber: e.target.value })}
                          placeholder="Optional"
                          className={FIELD}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={FIELD_LABEL}>Photo URLs (one per line)</Label>
                      <Textarea
                        value={item.photoUrls}
                        onChange={(e) => updateItem(index, { photoUrls: e.target.value })}
                        placeholder="https://…/front.jpg&#10;https://…/back.jpg"
                        rows={2}
                        className="rounded-none border-gray-300 bg-white text-sm font-light"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={FIELD_LABEL}>Accessories (comma separated)</Label>
                      <Input
                        value={item.accessories}
                        onChange={(e) => updateItem(index, { accessories: e.target.value })}
                        placeholder="Dust bag, box, authenticity card"
                        className={FIELD}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={FIELD_LABEL}>Description / Notes</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="Provenance, history, condition details…"
                        rows={3}
                        className="rounded-none border-gray-300 bg-white text-sm font-light"
                      />
                    </div>
                  </div>
                ))}
              </section>

              {/* Submission notes */}
              <section className="space-y-2">
                <Label htmlFor="notes" className={FIELD_LABEL}>Anything else we should know?</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred contact times, additional context…"
                  rows={3}
                  className="rounded-none border-gray-300 bg-white text-sm font-light"
                />
              </section>

              {(fieldError || error) && (
                <div
                  role="alert"
                  className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-[12px] text-red-600"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{fieldError || error}</span>
                </div>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full max-w-xs h-14 bg-black text-white hover:bg-plum rounded-none text-[10px] font-bold tracking-[0.3em] uppercase transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                    </>
                  ) : (
                    'Submit for Valuation'
                  )}
                </Button>
              </div>
              <p className="text-center text-[11px] text-gray-400 font-light italic">
                Read about{' '}
                <Link
                  href={`/${countryCode}/how-to-sell`}
                  className="underline underline-offset-4 text-gray-600 hover:text-black transition-colors"
                >
                  how consignment works
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function ConsignmentSuccess({
  consignment,
  countryCode,
}: {
  consignment: Consignment;
  countryCode: string;
}) {
  return (
    <div className="text-center space-y-8 py-10">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-headline font-medium tracking-tight">
          Submission Received
        </h1>
        <p className="text-[13px] text-gray-500 font-light italic max-w-md mx-auto leading-relaxed">
          Thank you — a Maison specialist will review your pieces and reach out with a private
          valuation. Please keep your reference for any correspondence.
        </p>
      </div>

      <div className="inline-flex flex-col items-center gap-2 border border-gray-200 px-10 py-6">
        <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-gray-400">
          Your Reference
        </span>
        <span className="text-2xl font-headline font-medium tracking-widest text-plum">
          {consignment.reference}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Status: {String(consignment.status).replace(/_/g, ' ')}
        </span>
      </div>

      {consignment.items?.length > 0 && (
        <div className="max-w-md mx-auto text-left border-t border-gray-100 pt-6 space-y-3">
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-gray-400 text-center">
            Pieces Submitted
          </p>
          <ul className="divide-y divide-gray-100 border border-gray-100">
            {consignment.items.map((it, i) => (
              <li key={it.id ?? i} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-900">
                  {it.brand}
                  {it.model ? ` · ${it.model}` : ''}
                </span>
                {it.conditionGrade && (
                  <span className="text-[9px] uppercase tracking-widest text-gray-400">
                    {String(it.conditionGrade).replace(/_/g, ' ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link href={`/${countryCode}/account/consignments`}>
          <Button
            variant="outline"
            className="rounded-none border-gray-900 h-12 px-10 text-[10px] font-bold tracking-[0.2em] uppercase"
          >
            View My Consignments
          </Button>
        </Link>
        <Link href={`/${countryCode}`}>
          <Button className="rounded-none bg-black text-white hover:bg-plum h-12 px-10 text-[10px] font-bold tracking-[0.2em] uppercase">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
