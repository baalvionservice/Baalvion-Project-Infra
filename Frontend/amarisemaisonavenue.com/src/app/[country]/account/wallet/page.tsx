'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Star,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { addressApi, type SavedAddress } from '@/lib/api-client';

/**
 * Wallet & Addresses — HONEST account utilities. The previous fictional "Treasury
 * balance" ledger, top-up form, and hardcoded saved card had no backing service and
 * have been removed. We surface only what's real today:
 *  - Saved Cards: an honest empty state (card vaulting happens at checkout once
 *    card payments are enabled — we never fabricate a card).
 *  - Addresses: a live summary of the default address from order-service, with a
 *    link to the full Address Book.
 */
export default function WalletPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await addressApi.listMine();
      if (cancelled) return;
      // A missing customer profile simply means no addresses yet — an honest empty state.
      setAddresses(res.ok ? res.data : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="space-y-2">
        <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
          <Link href={`/${countryCode}/account`}>Dashboard</Link>
          <ChevronRight className="w-2.5 h-2.5" />
          <span className="text-plum">Wallet &amp; Addresses</span>
        </nav>
        <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
          Wallet &amp; Addresses
        </h1>
        <p className="text-sm text-gray-500 font-light italic">
          Your payment methods and delivery details.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          {/* Saved Cards — honest empty state, no fabricated card */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3 text-plum">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                Saved Cards
              </h3>
            </div>

            <Card className="bg-white border-border shadow-sm rounded-none p-12 text-center space-y-5">
              <div className="w-14 h-14 mx-auto bg-ivory border border-border flex items-center justify-center text-gray-300">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest italic text-gray-400">
                No saved cards yet
              </p>
              <p className="text-[12px] text-gray-500 font-light italic leading-relaxed max-w-sm mx-auto">
                You can add a card securely at checkout once card payments are
                enabled. The Maison never stores card details outside the payment
                processor.
              </p>
              <div className="inline-flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 pt-2">
                <Lock className="w-3 h-3 text-plum" />
                <span>PCI-compliant tokenization</span>
              </div>
            </Card>
          </section>

          {/* Addresses — live default summary + link to the Address Book */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-plum">
                <MapPin className="w-5 h-5" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">
                  Default Address
                </h3>
              </div>
              <Link
                href={`/${countryCode}/account/addresses`}
                className="text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors inline-flex items-center"
              >
                Manage <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
            </div>

            <Card className="bg-white border-border shadow-sm rounded-none p-8">
              {loading ? (
                <div className="py-10 flex items-center justify-center space-x-3 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-plum" />
                  <span className="text-[10px] font-bold uppercase tracking-widest italic">
                    Loading…
                  </span>
                </div>
              ) : defaultAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-tight text-gray-900">
                      {defaultAddress.firstName} {defaultAddress.lastName}
                    </p>
                    {defaultAddress.isDefault && (
                      <Badge className="bg-plum/10 text-plum border-none text-[8px] uppercase tracking-widest inline-flex items-center">
                        <Star className="w-2.5 h-2.5 mr-1 fill-plum" /> Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-600 font-light leading-relaxed">
                    {defaultAddress.company && (
                      <>
                        {defaultAddress.company}
                        <br />
                      </>
                    )}
                    {defaultAddress.address1}
                    {defaultAddress.address2 ? (
                      <>
                        <br />
                        {defaultAddress.address2}
                      </>
                    ) : null}
                    <br />
                    {[
                      defaultAddress.city,
                      defaultAddress.state,
                      defaultAddress.zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    <br />
                    <span className="font-mono uppercase text-[10px] text-gray-400 tracking-widest">
                      {defaultAddress.countryCode}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="py-10 text-center space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest italic text-gray-400">
                    No saved addresses yet
                  </p>
                  <Link
                    href={`/${countryCode}/account/addresses`}
                    className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-plum hover:text-gold transition-colors"
                  >
                    Add an address <ChevronRight className="ml-1 w-3 h-3" />
                  </Link>
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Informational sidebar — honest framing of the maison protocol */}
        <aside className="lg:col-span-5 space-y-8">
          <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Wallet className="w-40 h-40" />
            </div>
            <div className="relative z-10 space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                Maison Payments
              </h4>
              <p className="text-[12px] text-white/70 font-light italic leading-relaxed">
                Payment is taken securely at the point of acquisition. We do not
                operate a stored balance — every settlement is direct and
                processor-backed.
              </p>
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3 text-[9px] font-bold uppercase tracking-widest text-white/50">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>Processor-backed checkout</span>
                </div>
                <div className="flex items-center space-x-3 text-[9px] font-bold uppercase tracking-widest text-white/50">
                  <Lock className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>No card details stored on our servers</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-ivory border-border p-8 space-y-4 rounded-none">
            <div className="flex items-center space-x-3 text-plum">
              <MapPin className="w-5 h-5" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                Address Book
              </h4>
            </div>
            <p className="text-[11px] text-gray-500 italic font-light leading-relaxed">
              Add and manage your shipping and billing addresses, and choose a
              default for faster checkout.
            </p>
            <Link href={`/${countryCode}/account/addresses`}>
              <Button
                variant="outline"
                className="w-full border-plum/30 text-plum hover:bg-plum hover:text-white h-11 rounded-none text-[9px] font-bold uppercase tracking-widest"
              >
                Open Address Book <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
