'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatProductPrice, formatAmount, normalizeCountry } from '@/lib/i18n/countries';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { Trash2, ShoppingBag, ShieldCheck, Truck, ChevronRight, Minus, Plus, Loader2 } from 'lucide-react';
import { BrandImage } from '@/components/ui/BrandImage';
import { useToast } from '@/hooks/use-toast';
import { getProductById } from '@/lib/catalog';

/**
 * Bank-Grade Cart Page: Tactical Acquisition Ledger.
 * Optimized for high-fidelity transactional review.
 *
 * The bag persists across reloads (store localStorage). Quantities are editable with a live
 * server stock check, and line prices are re-validated against the live catalog before checkout.
 */
export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity } = useAppStore();
  const { country } = useParams();
  const countryCode = normalizeCountry(country as string);
  const router = useRouter();
  const { toast } = useToast();

  // Per-line "checking stock" flag for the quantity stepper.
  const [checkingId, setCheckingId] = useState<string | null>(null);
  // Whole-bag price re-validation state before proceeding to settlement.
  const [revalidating, setRevalidating] = useState(false);

  // Increase a line quantity only after confirming live availability covers the new amount.
  const handleQuantityChange = async (id: string, nextQty: number) => {
    if (nextQty < 1) return;
    const line = cart.find((c) => c.id === id);
    if (!line) return;
    // Decreasing never needs a stock check.
    if (nextQty <= line.quantity) {
      updateCartQuantity(id, nextQty);
      return;
    }
    setCheckingId(id);
    try {
      const live = await getProductById(id, countryCode);
      // inStock === false → sold out; numeric stock caps the max when tracked.
      const cap = typeof live?.stock === 'number' && live.stock > 0 ? live.stock : undefined;
      if (live?.inStock === false || (cap !== undefined && nextQty > cap)) {
        toast({
          variant: 'destructive',
          title: 'Limited Availability',
          description:
            cap !== undefined
              ? `Only ${cap} of ${line.name} ${cap === 1 ? 'is' : 'are'} available.`
              : `${line.name} is currently unavailable.`,
        });
        return;
      }
      updateCartQuantity(id, nextQty);
    } catch {
      // Fail-open: a transient catalog error shouldn't block a quantity bump.
      updateCartQuantity(id, nextQty);
    } finally {
      setCheckingId(null);
    }
  };

  // Re-validate every line's live availability + price before settlement so a stale bag can't
  // carry a sold-out item or an outdated price into checkout. Blocks on a sold-out item, warns on
  // a price change (order-service re-derives all money server-authoritatively at order time), and
  // only then routes to checkout.
  const handleProceed = async () => {
    setRevalidating(true);
    try {
      const results = await Promise.all(
        cart.map((item) => getProductById(item.id, countryCode).catch(() => null))
      );
      const soldOut: string[] = [];
      let priceDrift = false;
      results.forEach((live, i) => {
        const item = cart[i];
        if (!live) return;
        if (live.inStock === false) {
          soldOut.push(item.name);
          return;
        }
        const livePrice = live.price ?? live.basePrice;
        const cartPrice = item.price ?? item.basePrice;
        if (typeof livePrice === 'number' && Math.abs(livePrice - cartPrice) > 0.01) {
          priceDrift = true;
        }
      });
      if (soldOut.length > 0) {
        toast({
          variant: 'destructive',
          title: 'No Longer Available',
          description: `${soldOut.join(', ')} just sold out. Please remove ${
            soldOut.length > 1 ? 'these pieces' : 'this piece'
          } to continue.`,
        });
        return;
      }
      if (priceDrift) {
        toast({
          title: 'Pricing Updated',
          description:
            'Some prices changed since you added these items. Your order total will reflect the latest pricing.',
        });
      }
      router.push(`/${countryCode}/checkout`);
    } finally {
      setRevalidating(false);
    }
  };

  // Subtotal in the MARKET currency — price is already FX-converted by the storefront API;
  // basePrice (USD) is only a fallback when no country pricing was returned.
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price ?? item.basePrice) * item.quantity,
    0
  );
  // Market context is shared across the bag, so the first item carries currency + tax facts.
  const currencyCode = cart[0]?.currencyCode;
  const taxRate = cart[0]?.taxRate ?? 0;
  const taxType = cart[0]?.taxType;
  const taxInclusive = cart[0]?.taxInclusive ?? false;
  // Inclusive markets (UK/AE/IN/SG): tax is already inside the price → break it out for display.
  // Exclusive markets (US SALES_TAX): tax is added on top of the subtotal.
  const taxAmount = taxRate
    ? taxInclusive
      ? subtotal - subtotal / (1 + taxRate / 100)
      : subtotal * (taxRate / 100)
    : 0;
  const total = taxInclusive ? subtotal : subtotal + taxAmount;
  const renderAmount = (amount: number) =>
    formatAmount(amount, currencyCode ?? '', countryCode);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-40 flex flex-col items-center justify-center space-y-8 sm:space-y-12 animate-fade-in">
        <div className="p-8 sm:p-12 bg-ivory border border-border rounded-full shadow-inner">
          <ShoppingBag className="w-14 h-14 sm:w-20 sm:h-20 text-gray-200" />
        </div>
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold italic tracking-tight">Your Archive is Empty</h1>
          <p className="text-sm sm:text-base text-gray-500 font-light italic max-w-md mx-auto px-4">
            &ldquo;Discovery is the foundation of any significant collection. Explore our curated ateliers to find your next masterpiece.&rdquo;
          </p>
        </div>
        <Button onClick={() => router.push(`/${countryCode}`)} size="lg" className="rounded-none bg-white hover:bg-black/20 px-8 sm:px-16 h-12 sm:h-16 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl transition-all">
          START DISCOVERY
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full md:container mx-auto px-4 sm:px-6 md:px-12 py-4 md:py-24 animate-fade-in">
      <header className="space-y-3 sm:space-y-4 mb-10 sm:mb-14 md:mb-20 border-b border-border pb-6 sm:pb-8 md:pb-12">
        <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-2 sm:mb-4">
          <Link href={`/${countryCode}`} className="hover:text-black">Maison</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-black">Shopping Bag</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-headline font-bold italic tracking-tighter">Acquisition Ledger</h1>
        <p className="text-xs sm:text-sm text-gray-500 font-light italic">Reviewing artifacts reserved for global settlement.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-10 sm:gap-14 md:gap-16 lg:gap-24 items-start">
        {/* Artifact List */}
        <div className="w-full lg:w-2/3 space-y-8 sm:space-y-10 md:space-y-12">
          {cart.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row gap-5 sm:gap-8 md:gap-12 pb-8 sm:pb-10 md:pb-12 border-b border-border group relative">
              {/* Product Image */}
              <BrandImage
                src={item.imageUrl?.[0]}
                alt={item.name}
                label={item.name}
                className="w-full sm:w-36 md:w-48 aspect-[3/4] border border-border shadow-sm flex-shrink-0 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none"
                imgClassName="object-contain p-4 sm:p-6 transition-transform duration-[1.5s] group-hover:scale-105"
              />

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between py-1 sm:py-2">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-plum">{item.categoryId.toUpperCase()} Registry</span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold italic group-hover:text-plum transition-colors leading-none">
                        <Link href={`/${countryCode}/product/${item.id}`}>{item.name}</Link>
                      </h3>
                      <p className="text-[9px] text-gray-400 font-mono uppercase tracking-tighter">REF: {item.id.toUpperCase()}</p>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tabular">
                      {formatProductPrice(item, countryCode)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-0 sm:space-x-8 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    <div className="flex items-center space-x-3">
                      <span className="opacity-60">Quantity:</span>
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || checkingId === item.id}
                          className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="h-8 min-w-[2.5rem] flex items-center justify-center text-black tabular-nums border-x border-border">
                          {checkingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={checkingId === item.id}
                          className="h-8 w-8 flex items-center justify-center text-gray-600 hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Provenance Audited</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mt-6 sm:mt-8 md:mt-10">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from ledger</span>
                  </button>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gold italic">Ready for Dispatch</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tactical Summary Sidebar */}
        <aside className="w-full lg:w-1/3 lg:sticky lg:top-40">
          <Card className="bg-ivory border-border shadow-luxury p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 md:space-y-10 rounded-none">
            <h2 className="text-lg sm:text-xl font-headline font-bold uppercase tracking-widest border-b border-border pb-4 sm:pb-6">Settlement Summary</h2>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between text-xs font-light italic">
                <span className="text-gray-500">Registry Subtotal</span>
                <span className="font-bold tabular">{renderAmount(subtotal)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs font-light italic">
                  <span className="text-gray-500">
                    {taxInclusive
                      ? `Includes ${taxType} (${taxRate}%)`
                      : `${taxType} (${taxRate}%)`}
                  </span>
                  <span className="font-bold tabular">{renderAmount(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-light italic">
                <span className="text-gray-500">Global Logistics</span>
                <span className="text-plum font-bold uppercase tracking-widest text-[10px] sm:text-xs">Complimentary</span>
              </div>
              <div className="flex justify-between text-xs font-light italic">
                <span className="text-gray-500">Insurance & Certification</span>
                <span className="text-plum font-bold uppercase tracking-widest text-[10px] sm:text-xs">Included</span>
              </div>

              <div className="pt-6 sm:pt-8 border-t border-border flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">Total Yield</span>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-body font-bold tabular leading-none">
                    {renderAmount(total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 sm:pt-6">
              <Button
                onClick={handleProceed}
                disabled={revalidating}
                className="w-full bg-black text-white hover:bg-plum h-14 sm:h-16 md:h-20 rounded-none text-[10px] sm:text-[11px] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase shadow-2xl transition-all disabled:opacity-60"
              >
                {revalidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-3 animate-spin" /> VERIFYING AVAILABILITY…
                  </>
                ) : (
                  'PROCEED TO SETTLEMENT'
                )}
              </Button>
              <p className="text-[9px] text-gray-400 text-center italic leading-relaxed">
                &ldquo;By proceeding, you authorize the Maison to begin curatorial audit and logistical preparation for your artifacts.&rdquo;
              </p>
            </div>

            <div className="pt-6 sm:pt-8 md:pt-10 space-y-4 sm:space-y-6 border-t border-border">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2.5 sm:p-3 bg-white rounded-full shadow-sm text-gold"><ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <div className="space-y-0.5">
                  <p className="text-10px font-bold uppercase tracking-widest">256-Bit SSL SECURE</p>
                  <p className="text-[8px] text-gray-400 italic">Institutional Encryption Standard</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2.5 sm:p-3 bg-white rounded-full shadow-sm text-gold"><Truck className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                <div className="space-y-0.5">
                  <p className="text-10px font-bold uppercase tracking-widest">Global White-Glove</p>
                  <p className="text-[8px] text-gray-400 italic">Tracked Dispatch via Maison Logistics</p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
