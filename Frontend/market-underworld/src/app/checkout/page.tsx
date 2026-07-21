"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Lock, Loader2, Wallet, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { MARKET_UNDERWORLD_STORE_ID, getStorePaymentSettings, previewDiscount, type DiscountPreview } from '@/lib/api/commerce';
import { createOrder, createPaymentIntent, confirmPayment, type OrderAddressInput, type Order, type PaymentIntent } from '@/lib/api/orders';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const emptyAddress: OrderAddressInput = {
  firstName: '', lastName: '', address1: '', city: '', countryCode: 'US', phone: '', email: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, isLoading: cartLoading, clear } = useCart();
  const [address, setAddress] = useState<OrderAddressInput>(emptyAddress);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoOnly, setCryptoOnly] = useState(false);
  const [cryptoStep, setCryptoStep] = useState<{ order: Order; intent: PaymentIntent } | null>(null);
  const [gateway, setGateway] = useState<'razorpay' | 'payu'>('razorpay');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountPreview | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  useEffect(() => {
    getStorePaymentSettings().then((s) => setCryptoOnly(s.paymentMode === 'crypto_only'));
  }, []);

  // PayU bounces the browser back here (303 redirect from order-service's webhook) after the
  // shopper pays on PayU's hosted page — pick up the outcome from the query string it appended.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    const payuStatus = params.get('payu');
    if (!orderId || !payuStatus) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (payuStatus === 'success') {
      clear().finally(() => router.push(`/checkout/confirmation/${orderId}`));
    } else {
      toast({ variant: 'destructive', title: 'Payment failed', description: 'Your PayU payment was not completed. Please try again.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const currencyCode = cart?.currencyCode ?? 'USD';

  // Display-only estimate mirroring order-service's server-computed default (SHIPPING_FLAT_RATE /
  // SHIPPING_FREE_THRESHOLD in shippingService.js) — the actual charge is always computed
  // server-side in createOrder regardless of what's shown here; keep these two in sync if the
  // service's env defaults ever change.
  const SHIPPING_FLAT_RATE = 5;
  const SHIPPING_FREE_THRESHOLD = 50;
  const estimatedShipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = (cart?.totalAmount ?? subtotal) + estimatedShipping;

  const handleAddressChange = (field: keyof OrderAddressInput, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    if (!cart || items.length === 0) {
      toast({ variant: 'destructive', title: 'Your cart is empty' });
      return false;
    }
    if (!address.firstName || !address.lastName || !address.address1 || !address.city || !address.countryCode) {
      toast({ variant: 'destructive', title: 'Missing shipping details', description: 'Please fill in all required address fields.' });
      return false;
    }
    return true;
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingDiscount(true);
    try {
      const preview = await previewDiscount(discountCode.trim().toUpperCase(), subtotal);
      setAppliedDiscount(preview);
      toast({ title: 'Discount applied', description: `${preview.code} applied to your order.` });
    } catch (err) {
      setAppliedDiscount(null);
      toast({ variant: 'destructive', title: "Couldn't apply code", description: err instanceof Error ? err.message : 'Invalid discount code.' });
    } finally {
      setCheckingDiscount(false);
    }
  };

  const discountedTotal = appliedDiscount ? Math.max(0, total - appliedDiscount.amount) : total;

  const handlePayment = async () => {
    if (!validateAddress()) return;

    setIsProcessing(true);
    try {
      const order = await createOrder(MARKET_UNDERWORLD_STORE_ID, {
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, sku: i.sku, name: i.name, quantity: i.quantity })),
        currencyCode,
        shippingAddress: address,
        billingAddress: address,
        idempotencyKey: crypto.randomUUID(),
        // Client preview is UX only — order-service independently re-validates + recomputes the
        // discount server-side in createOrder (discountService.applyDiscount), so a tampered
        // client amount can never be trusted or applied.
        discountCode: appliedDiscount?.code,
        // Lets PayU/Stripe bounce the shopper back to THIS checkout page after their hosted page —
        // see order-service's paymentProvider.js/payuReturnRoutes.js.
        metadata: { returnUrl: `${window.location.origin}/checkout` },
      });

      if (cryptoOnly) {
        // Crypto never auto-captures — stop here and show wallet instructions. The order is real
        // and reserved; the buyer confirms once they've sent the transfer, and an admin verifies
        // it on-chain before the order actually moves to paid.
        const intent = await createPaymentIntent(MARKET_UNDERWORLD_STORE_ID, order.id, 'crypto');
        setCryptoStep({ order, intent });
        return;
      }

      const intent = await createPaymentIntent(MARKET_UNDERWORLD_STORE_ID, order.id, gateway);

      if (intent.formPost) {
        // PayU: browser-native form POST to their hosted page. It form-posts the result back to
        // order-service's webhook, which verifies + settles, then 303-redirects here — the
        // useEffect above picks that up. Nothing left to do on this tick; the page is navigating away.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = intent.formPost.action;
        for (const [key, value] of Object.entries(intent.formPost.fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (intent.redirectUrl) {
        // Stripe: no real API key is configured anywhere in this environment (only the commented
        // placeholder in order-service/.env.example) — fail loudly rather than silently mishandle
        // a real payment redirect built from unconfigured credentials.
        throw new Error('Card payment via Stripe is not available yet. Please try again — Razorpay and PayU are available.');
      }

      if (intent.keyId) {
        const loaded = await loadRazorpayScript();
        if (!loaded || !window.Razorpay) throw new Error('Could not load the payment widget. Please try again.');
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: intent.keyId,
            amount: intent.amount,
            currency: intent.currency,
            order_id: intent.intentId,
            name: 'Market Underworld',
            handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
              try {
                await confirmPayment(MARKET_UNDERWORLD_STORE_ID, order.id, { intentId: intent.intentId, verification: response });
                resolve();
              } catch (err) { reject(err); }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
            theme: { color: '#39FF14' },
          });
          rzp.open();
        });
      } else {
        // No provider keys configured — order-service falls back to its non-production mock
        // provider, which captures immediately with no user interaction required.
        await confirmPayment(MARKET_UNDERWORLD_STORE_ID, order.id, { intentId: intent.intentId });
      }

      await clear();
      router.push(`/checkout/confirmation/${order.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Payment failed', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoSent = async () => {
    if (!cryptoStep) return;
    setIsProcessing(true);
    try {
      // Stays 'pending' — cryptoManualProvider never auto-captures (see paymentProvider.js).
      // An admin verifies the on-chain transaction and marks it paid separately.
      await confirmPayment(MARKET_UNDERWORLD_STORE_ID, cryptoStep.order.id, { intentId: cryptoStep.intent.intentId, gateway: 'crypto' });
      await clear();
      router.push(`/checkout/confirmation/${cryptoStep.order.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Something went wrong', description: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: 'Copied' });
  };

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />

      <main className="container max-w-5xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto mb-6 border border-brand-green/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-display uppercase italic">Secure <span className="text-brand-green">Checkout.</span></h1>
          {cryptoOnly && <Badge variant="warning" className="mt-4">Crypto Payment Only</Badge>}
        </header>

        {cartLoading ? (
          <div className="text-center text-text-muted py-20">Loading your cart…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-text-muted py-20 space-y-4">
            <p>Your cart is empty.</p>
            <AppButton onClick={() => router.push('/shop')}>Browse Products</AppButton>
          </div>
        ) : cryptoStep ? (
          <div className="max-w-2xl mx-auto">
            <ListingCard className="p-10 space-y-8 border-brand-border bg-brand-surface">
              <div className="flex items-center gap-3 text-brand-green">
                <Wallet className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase font-mono tracking-widest">Send Crypto Payment</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{cryptoStep.intent.instructions}</p>
              <div className="space-y-3">
                {Object.entries(cryptoStep.intent.wallets || {}).filter(([, addr]) => addr).map(([coin, addr]) => (
                  <div key={coin} className="flex items-center justify-between gap-3 p-4 bg-brand-void border border-brand-border rounded-lg">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-text-muted uppercase">{coin}</div>
                      <div className="font-mono text-sm text-white truncate">{addr}</div>
                    </div>
                    <button onClick={() => copyAddress(addr)} className="p-2 text-text-ghost hover:text-brand-green shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {Object.values(cryptoStep.intent.wallets || {}).every((v) => !v) && (
                  <p className="text-xs text-semantic-error">No wallet addresses are configured yet — contact support to complete this order.</p>
                )}
              </div>
              <div className="pt-4 border-t border-brand-border flex justify-between items-center">
                <span className="text-xs font-bold text-text-muted uppercase">Order Total</span>
                <span className="text-2xl font-bold text-brand-green font-mono">{total.toLocaleString()} {currencyCode}</span>
              </div>
              <AppButton onClick={handleCryptoSent} isLoading={isProcessing} className="w-full h-14 font-mono text-sm uppercase tracking-widest gap-2">
                <CheckCircle2 className="w-4 h-4" /> I&apos;ve Sent the Payment
              </AppButton>
            </ListingCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <ListingCard className="p-10 space-y-6 border-brand-border bg-brand-surface">
                <h3 className="text-xl font-bold uppercase font-mono tracking-widest text-text-muted">Shipping Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input value={address.firstName} onChange={(e) => handleAddressChange('firstName', e.target.value)} placeholder="First name" className="bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />
                  <input value={address.lastName} onChange={(e) => handleAddressChange('lastName', e.target.value)} placeholder="Last name" className="bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />
                </div>
                <input value={address.address1} onChange={(e) => handleAddressChange('address1', e.target.value)} placeholder="Address" className="w-full bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />
                <div className="grid grid-cols-3 gap-4">
                  <input value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} placeholder="City" className="bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />
                  <input value={address.countryCode} onChange={(e) => handleAddressChange('countryCode', e.target.value.toUpperCase().slice(0, 2))} placeholder="Country (e.g. US)" maxLength={2} className="bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green uppercase" />
                  <input value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} placeholder="Phone" className="bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />
                </div>
                <input value={address.email} onChange={(e) => handleAddressChange('email', e.target.value)} placeholder="Email (for order confirmation)" type="email" className="w-full bg-brand-void border border-brand-border h-12 rounded px-4 text-sm text-white outline-none focus:border-brand-green" />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      disabled={!!appliedDiscount}
                      className="flex-1 bg-brand-void border border-brand-border h-11 rounded px-4 text-sm font-mono text-white outline-none focus:border-brand-green disabled:opacity-60"
                    />
                    {appliedDiscount ? (
                      <AppButton
                        type="button"
                        onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }}
                        className="bg-brand-void border border-brand-border text-white px-6 h-11 text-xs font-bold uppercase"
                      >
                        Remove
                      </AppButton>
                    ) : (
                      <AppButton type="button" onClick={handleApplyDiscount} isLoading={checkingDiscount} className="bg-brand-void border border-brand-border text-white px-6 h-11 text-xs font-bold uppercase">
                        Apply
                      </AppButton>
                    )}
                  </div>
                </div>

                {!cryptoOnly && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Payment Method</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['razorpay', 'payu'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGateway(g)}
                          className={`h-12 rounded border text-sm font-bold uppercase tracking-wide transition-all ${gateway === g ? 'bg-brand-green/10 border-brand-green text-white' : 'bg-brand-void border-brand-border text-text-muted'}`}
                        >
                          {g === 'razorpay' ? 'Razorpay' : 'PayU'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AppButton
                  onClick={handlePayment}
                  isLoading={isProcessing}
                  className="w-full h-16 font-mono text-sm uppercase tracking-[0.2em]"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : cryptoOnly ? 'Continue to Crypto Payment' : `Pay ${discountedTotal.toLocaleString()} ${currencyCode}`}
                </AppButton>
              </ListingCard>
            </div>

            <aside className="lg:col-span-5">
              <ListingCard className="p-8 space-y-8 border-brand-border bg-brand-surface">
                <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted">Order Summary</h3>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-text-muted">{item.name} × {item.quantity}</span>
                      <span className="text-white font-mono">{(item.price * item.quantity).toLocaleString()} {currencyCode}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shipping</span>
                  <span className="text-white font-mono">{estimatedShipping === 0 ? 'Free' : `${estimatedShipping.toLocaleString()} ${currencyCode}`}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-sm text-brand-green">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span className="font-mono">-{appliedDiscount.amount.toLocaleString()} {currencyCode}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-brand-border flex justify-between items-end">
                  <span className="font-bold text-white text-xs uppercase">Total</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand-green font-mono">{discountedTotal.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{currencyCode}</div>
                  </div>
                </div>
              </ListingCard>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
