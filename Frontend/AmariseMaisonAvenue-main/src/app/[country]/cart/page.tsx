'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { formatProductPrice, formatAmount, normalizeCountry } from '@/lib/i18n/countries';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  Lock,
  BadgeCheck,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { BrandImage } from '@/components/ui/BrandImage';
import { useToast } from '@/hooks/use-toast';
import { getProductById } from '@/lib/catalog';
import YouMayAlsoLike from '@/components/product/YouMayAlsoLike';

/**
 * Shopping Bag — Amarisé Maison Avenue.
 *
 * Luxury resale cart inspired by the clean, conversion-first layout of leading
 * maisons: a two-column composition (line items + a sticky order summary), rich
 * authenticity-forward line items, an optional gift note, trust signals, and a
 * "You may also like" rail — while keeping the storefront's real wiring intact.
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
  // Whole-bag price re-validation state before proceeding to checkout.
  const [revalidating, setRevalidating] = useState(false);

  // Optional gift note / message — persisted per market and threaded into the order
  // metadata at checkout (see checkout page → placeOrder). Honest persistence, not a stub.
  const noteKey = `amarise_order_note_${countryCode}`;
  const [orderNote, setOrderNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(noteKey);
    if (saved) {
      setOrderNote(saved);
      setShowNote(true);
    }
  }, [noteKey]);

  const handleNoteChange = (value: string) => {
    setOrderNote(value);
    if (typeof window !== 'undefined') {
      if (value.trim()) window.localStorage.setItem(noteKey, value);
      else window.localStorage.removeItem(noteKey);
    }
  };

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

  // Re-validate every line's live availability + price before checkout so a stale bag can't
  // carry a sold-out item or an outdated price forward. Blocks on a sold-out item, warns on
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
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
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
      <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-32 md:py-44 flex flex-col items-center justify-center space-y-8 sm:space-y-10 animate-fade-in">
        <div className="p-10 sm:p-14 bg-ivory border border-border rounded-full">
          <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" strokeWidth={1} />
        </div>
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">Your bag is empty</h1>
          <p className="text-sm sm:text-base text-gray-500 font-light leading-relaxed px-4">
            Every great collection begins with a single discovery. Explore our curated ateliers
            to find your next authenticated masterpiece.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${countryCode}`)}
          size="lg"
          className="rounded-none bg-black text-white hover:bg-plum px-12 sm:px-16 h-14 sm:h-16 text-[10px] font-bold uppercase tracking-[0.35em] transition-all"
        >
          Continue Shopping
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400">
          <span className="flex items-center gap-2"><BadgeCheck className="w-3.5 h-3.5 text-gold" /> 100% Authentic</span>
          <span className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-gold" /> Insured Worldwide Shipping</span>
          <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-gold" /> Secure Checkout</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="w-full md:container mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-20 animate-fade-in">
        {/* Header */}
        <header className="mb-8 sm:mb-12 md:mb-16 border-b border-border pb-6 sm:pb-8">
          <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400 mb-4">
            <Link href={`/${countryCode}`} className="hover:text-black transition-colors">Maison</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-black">Shopping Bag</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline tracking-tight leading-none">
                Shopping Bag
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-light">
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} reserved · review before checkout
              </p>
            </div>
            <Link
              href={`/${countryCode}`}
              className="hidden sm:inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors"
            >
              <ArrowRight className="w-3 h-3 rotate-180" /> Continue Shopping
            </Link>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-10 md:gap-14 lg:gap-20 items-start">
          {/* Line items */}
          <div className="w-full lg:w-[62%] space-y-8 sm:space-y-10">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-5 sm:gap-7 md:gap-10 pb-8 sm:pb-10 border-b border-border group"
              >
                {/* Product image */}
                <Link
                  href={`/${countryCode}/product/${item.id}`}
                  className="block w-full sm:w-32 md:w-44 aspect-[3/4] border border-border bg-ivory/40 flex-shrink-0 mx-auto sm:mx-0 max-w-[220px] sm:max-w-none overflow-hidden"
                >
                  <BrandImage
                    src={item.imageUrl?.[0]}
                    alt={item.name}
                    label={item.name}
                    className="w-full h-full"
                    imgClassName="object-contain p-4 sm:p-5 transition-transform duration-[1.4s] group-hover:scale-105"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-plum">
                          {item.categoryId.replace(/[-_]/g, ' ').toUpperCase()}
                        </span>
                        <h3 className="text-xl sm:text-2xl md:text-[28px] font-headline tracking-tight leading-tight group-hover:text-plum transition-colors truncate">
                          <Link href={`/${countryCode}/product/${item.id}`}>{item.name}</Link>
                        </h3>
                        <p className="text-[9px] text-gray-400 font-mono uppercase tracking-wide">
                          Ref. {item.id.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 tabular whitespace-nowrap">
                        {formatProductPrice(item, countryCode)}
                      </div>
                    </div>

                    {/* Attribute chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.condition && (
                        <span className="inline-flex items-center px-2.5 py-1 border border-border bg-ivory/60 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">
                          {item.condition}
                        </span>
                      )}
                      {item.colors?.[0] && (
                        <span className="inline-flex items-center px-2.5 py-1 border border-border bg-ivory/60 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-600">
                          {item.colors[0]}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                        <ShieldCheck className="w-3 h-3" /> Verified Authentic
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mt-5 sm:mt-7">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Qty</span>
                      <div className="flex items-center border border-border">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || checkingId === item.id}
                          className="h-9 w-9 flex items-center justify-center text-gray-600 hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="h-9 min-w-[2.75rem] flex items-center justify-center text-black tabular-nums border-x border-border text-sm">
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
                          className="h-9 w-9 flex items-center justify-center text-gray-600 hover:bg-ivory disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-red-600 transition-colors self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Gift note */}
            <div className="pt-2">
              {!showNote ? (
                <button
                  onClick={() => setShowNote(true)}
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500 hover:text-plum transition-colors"
                >
                  <Gift className="w-4 h-4" /> Add a gift note
                </button>
              ) : (
                <div className="space-y-2 max-w-xl">
                  <label
                    htmlFor="order-note"
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-gray-500"
                  >
                    <Gift className="w-4 h-4 text-plum" /> Gift note / order instructions
                  </label>
                  <textarea
                    id="order-note"
                    value={orderNote}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="A personal message to accompany your piece, or special delivery instructions…"
                    className="w-full rounded-none border border-border bg-ivory/30 p-4 text-sm font-light focus:border-plum focus:outline-none resize-none"
                  />
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                    {orderNote.length}/500 · accompanies your order
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <aside className="w-full lg:w-[38%] lg:sticky lg:top-32">
            <div className="border border-border bg-ivory/40 p-6 sm:p-8 md:p-9 space-y-7">
              <h2 className="text-lg font-headline uppercase tracking-[0.2em] border-b border-border pb-5">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({itemCount})</span>
                  <span className="font-semibold tabular text-gray-900">{renderAmount(subtotal)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {taxInclusive ? `Includes ${taxType} (${taxRate}%)` : `${taxType} (${taxRate}%)`}
                    </span>
                    <span className="font-semibold tabular text-gray-900">{renderAmount(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-bold uppercase tracking-widest text-[10px] text-plum">Complimentary</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Insurance &amp; Authentication</span>
                  <span className="font-bold uppercase tracking-widest text-[10px] text-plum">Included</span>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Estimated Total</span>
                <div className="text-3xl md:text-[34px] font-semibold tabular leading-none">
                  {renderAmount(total)}
                </div>
              </div>

              <Button
                onClick={handleProceed}
                disabled={revalidating}
                className="w-full bg-black text-white hover:bg-plum h-14 sm:h-16 rounded-none text-[11px] font-bold tracking-[0.35em] uppercase transition-all disabled:opacity-60"
              >
                {revalidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-3 animate-spin" /> Verifying availability…
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Taxes &amp; duties finalized at checkout. By continuing you agree to our&nbsp;
                <Link href={`/${countryCode}/terms-of-service`} className="underline underline-offset-2 hover:text-black">
                  Terms
                </Link>
                .
              </p>

              {/* Trust signals */}
              <div className="pt-6 space-y-4 border-t border-border">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-white border border-border rounded-full text-gold"><BadgeCheck className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-800">100% Authentic Guaranteed</p>
                    <p className="text-[9px] text-gray-400">Every piece verified by our atelier</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-white border border-border rounded-full text-gold"><Lock className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-800">Secure 256-bit Checkout</p>
                    <p className="text-[9px] text-gray-400">Encrypted, bank-grade settlement</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-white border border-border rounded-full text-gold"><Truck className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-800">Insured Worldwide Delivery</p>
                    <p className="text-[9px] text-gray-400">Tracked, white-glove dispatch</p>
                  </div>
                </div>
              </div>

              {/* Accepted payments */}
              <div className="pt-5 border-t border-border space-y-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gray-400 text-center">We Accept</p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {['Visa', 'Mastercard', 'Amex', 'UPI', 'Bank'].map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 border border-border bg-white text-[8px] font-bold uppercase tracking-[0.15em] text-gray-500"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Recommendations */}
        {cart[0]?.id && (
          <div className="mt-16 md:mt-24 border-t border-border">
            <YouMayAlsoLike productId={cart[0].id} country={countryCode} />
          </div>
        )}
      </div>
    </div>
  );
}
