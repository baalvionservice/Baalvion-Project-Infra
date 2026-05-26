
'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/mock-data';

/**
 * Maison Cart Drawer: Elite Acquisition Overlay.
 * Provides immediate feedback when an item is added to the shopping bag.
 */
export function CartSheet() {
  const { cart, removeFromCart, isCartOpen, setCartOpen } = useAppStore();
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();

  const subtotal = cart.reduce((acc, item) => acc + (item.basePrice * item.quantity), 0);

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-[90%] md:w-[25%] p-6 border-none rounded-none duration-300 transition-all ease-in-out shadow-2xl flex flex-col bg-white font-body">
        <SheetHeader className="space-y-2 border-b  border-gray-50 bg-[#fcfcfc] shrink-0">
          <div className="flex justify-end">

            <SheetClose asChild>
              <button className="flex text-neutral-500 gap-2 items-center rounded-full  border-none bg-transparent outline-none cursor-pointer">
                <X className="w-5 h-5 mb-1 " /><span className='tracking-wide text-lg '>Close</span>
              </button>
            </SheetClose>
          </div>
          <div className="space-y-1 pt-6  flex justify-start">
            <h3 className="text-2xl tracking-wide text-gray-900">Shopping Bag</h3>
          </div>
        </SheetHeader>

        <div className="flex-1 mt-4 overflow-y-auto space-y-2 custom-scrollbar">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="flex space-x-6 pb-8 border-b border-gray-200 group">
                <div className="relative w-24 aspect-[3/4] overflow-hidden shrink-0">
                  <Image src={item.imageUrl[0]} alt={item.name} fill className="object-contain p-2" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold tracking-widest text-gray-900  transition-colors leading-relaxed">
                      <Link href={`/${countryCode}/product/${item.id}`} onClick={() => setCartOpen(false)}>{item.name}</Link>
                    </h4>
                    <p className="text-xs font-bold tracking-widest text-gray-900   leading-relaxed">{item.colors}</p>
                  </div>
                  <div className="flex flex-col items-start mt-4">
                    <span className="text-sm font-bold tabular-nums text-gray-900">{formatPrice(item.basePrice, countryCode)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500  bg-transparent border-none outline-none cursor-pointer">
                      <span className="text-xs underline font-bold tracking-widest text-gray-900   leading-relaxed">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-30 text-center py-20">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <p className="text-xs uppercase font-bold tracking-widest italic text-gray-400">Archive currently empty</p>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className=" bg-[#fcfcfc] border-t pt-4 border-gray-300 space-y-6 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-black">Total:</span>
              <span className="text-2xl font-bold tabular-nums text-gray-900">{formatPrice(subtotal, countryCode)}</span>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => { setCartOpen(false); router.push(`/${countryCode}/cart`); }}
                className="w-full h-14 bg-black text-white text-[10px] font-bold tracking-[0.4em] uppercase transition-all shadow-2xl"
              >
                View Bag and Checkout <ArrowRight className="w-3 h-3 ml-3" />
              </Button>
            </div>

          
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
