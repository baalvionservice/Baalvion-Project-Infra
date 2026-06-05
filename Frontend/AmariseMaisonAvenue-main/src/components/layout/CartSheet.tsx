'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, ArrowRight, Lock, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { BrandImage } from '@/components/ui/BrandImage';
import { useParams, useRouter } from 'next/navigation';
import { formatProductPrice, formatAmount, normalizeCountry } from '@/lib/i18n/countries';

/**
 * Cart drawer — the mini-bag overlay opened from the header.
 * Mirrors the full Shopping Bag page styling: clean line items, an authenticity-forward
 * footer, and a clear path to the bag / checkout.
 */
export function CartSheet() {
  const { cart, removeFromCart, isCartOpen, setCartOpen } = useAppStore();
  const { country } = useParams();
  const countryCode = normalizeCountry(country as string);
  const router = useRouter();

  // Sum line totals in the MARKET currency (price already FX-converted by the API; fall
  // back to basePrice only when the API gave no country pricing). Never sum USD then relabel.
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.price ?? item.basePrice) * item.quantity,
    0
  );
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  // All cart items share the active market, so the first item carries the market currency.
  const currencyCode = cart[0]?.currencyCode;

  const goTo = (path: string) => {
    setCartOpen(false);
    router.push(`/${countryCode}${path}`);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-[92%] sm:w-[440px] max-w-full p-0 border-none rounded-none duration-300 transition-all ease-in-out shadow-2xl flex flex-col bg-white font-body">
        <SheetHeader className="px-6 pt-6 pb-5 border-b border-border shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-headline tracking-tight text-gray-900">
              Shopping Bag{itemCount > 0 && <span className="text-gray-400 text-base font-body font-light"> · {itemCount}</span>}
            </SheetTitle>
            <SheetClose asChild>
              <button
                aria-label="Close"
                className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors bg-transparent border-none outline-none cursor-pointer"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Close</span>
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          {cart.length > 0 ? (
            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 py-5 group">
                  <Link
                    href={`/${countryCode}/product/${item.id}`}
                    onClick={() => setCartOpen(false)}
                    className="block w-20 aspect-[3/4] border border-border bg-ivory/40 shrink-0 overflow-hidden"
                  >
                    <BrandImage
                      src={item.imageUrl?.[0]}
                      alt={item.name}
                      variant="compact"
                      className="w-full h-full"
                      imgClassName="object-contain p-2"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-plum">
                        {item.categoryId.replace(/[-_]/g, ' ').toUpperCase()}
                      </span>
                      <h4 className="text-sm font-headline tracking-tight text-gray-900 leading-snug line-clamp-2">
                        <Link href={`/${countryCode}/product/${item.id}`} onClick={() => setCartOpen(false)}>
                          {item.name}
                        </Link>
                      </h4>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Qty {item.quantity}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold tabular-nums text-gray-900">
                        {formatProductPrice(item, countryCode)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-red-500 underline underline-offset-2 bg-transparent border-none outline-none cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-24">
              <ShoppingBag className="w-12 h-12 text-gray-200" strokeWidth={1} />
              <p className="text-[11px] uppercase font-bold tracking-[0.25em] text-gray-400">Your bag is empty</p>
              <Button
                onClick={() => goTo('')}
                className="rounded-none bg-black text-white hover:bg-plum px-10 h-12 text-[10px] font-bold tracking-[0.3em] uppercase"
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border bg-ivory/30 px-6 py-5 space-y-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">Subtotal</span>
              <span className="text-2xl font-semibold tabular-nums text-gray-900">
                {formatAmount(subtotal, currencyCode ?? '', countryCode)}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">Shipping &amp; taxes calculated at checkout.</p>

            <div className="space-y-2.5">
              <Button
                onClick={() => goTo('/checkout')}
                className="w-full h-14 bg-black text-white hover:bg-plum rounded-none text-[10px] font-bold tracking-[0.35em] uppercase transition-all"
              >
                Checkout <ArrowRight className="w-3 h-3 ml-3" />
              </Button>
              <Button
                onClick={() => goTo('/cart')}
                variant="outline"
                className="w-full h-12 rounded-none border-black text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black hover:text-white"
              >
                View Bag
              </Button>
            </div>

            <div className="flex items-center justify-center gap-5 pt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-gold" /> Authentic</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-gold" /> Secure Checkout</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
