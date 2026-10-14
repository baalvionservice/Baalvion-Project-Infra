"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { Lock, Loader2, Wallet, Copy, CheckCircle2, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useIdentity } from '@/context/identity-context';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/cart-context';
import { MARKET_UNDERWORLD_STORE_ID, getStorePaymentSettings, previewDiscount, type DiscountPreview } from '@/lib/api/commerce';
import { getPointsWallet, payOrderWithPoints, usdToPoints, type PointsWallet } from '@/lib/api/points';
import Link from 'next/link';
import { createOrder, createPaymentIntent, confirmPayment, type OrderAddressInput, type Order, type PaymentIntent } from '@/lib/api/orders';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const num = (v: unknown) => Number(v) || 0;

// Cart amounts can arrive as decimal strings; format from numbers so they never get concatenated.
function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

const COUNTRY_CODES = ['US', 'GB', 'CA', 'AU', 'IN', 'AE', 'SG', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'CH', 'IE', 'NZ', 'JP', 'KR', 'CN', 'HK', 'TH', 'VN', 'PH', 'ID', 'MY', 'PK', 'BD', 'LK', 'NP', 'SA', 'QA', 'EG', 'TR', 'ZA', 'NG', 'KE', 'GH', 'BR', 'MX', 'AR', 'CO', 'CL', 'PL', 'PT', 'RU', 'UA'];

function buildCountryOptions(extra?: string) {
  const codes = extra && !COUNTRY_CODES.includes(extra) ? [extra, ...COUNTRY_CODES] : COUNTRY_CODES;
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* fall back to codes */ }
  return codes.map((code) => ({ code, name: names?.of(code) ?? code }));
}

const emptyAddress: OrderAddressInput = {
  firstName: '', lastName: '', address1: '', city: '', countryCode: 'US', phone: '', email: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { cart, isLoading: cartLoading, clear, updateItemQuantity, removeItem } = useCart();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { identity } = useIdentity();
  const [itemBusy, setItemBusy] = useState<string | null>(null);
  const [address, setAddress] = useState<OrderAddressInput>(emptyAddress);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cryptoOnly, setCryptoOnly] = useState(false);
  const [pointsMode, setPointsMode] = useState(false);
  const [wallet, setWallet] = useState<PointsWallet | null>(null);
  const [cryptoStep, setCryptoStep] = useState<{ order: Order; intent: PaymentIntent } | null>(null);
  const [gateway, setGateway] = useState<'razorpay' | 'payu'>('razorpay');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountPreview | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  useEffect(() => {
    getStorePaymentSettings().then((s) => {
      setCryptoOnly(s.paymentMode === 'crypto_only');
      setPointsMode(s.paymentMode === 'points');
    });
  }, []);

  useEffect(() => {
    if (pointsMode && isAuthenticated) getPointsWallet().then(setWallet).catch(() => setWallet(null));
  }, [pointsMode, isAuthenticated]);

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
  const subtotal = num(cart?.subtotal);
  const currencyCode = cart?.currencyCode ?? 'USD';

  // Display-only estimate mirroring order-service's server-computed default (SHIPPING_FLAT_RATE /
  // SHIPPING_FREE_THRESHOLD in shippingService.js) — the actual charge is always computed
  // server-side in createOrder regardless of what's shown here; keep these two in sync if the
  // service's env defaults ever change.
  const SHIPPING_FLAT_RATE = 5;
  const SHIPPING_FREE_THRESHOLD = 50;
  const estimatedShipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = (cart?.totalAmount != null ? num(cart.totalAmount) : subtotal) + estimatedShipping;

  const countryOptions = buildCountryOptions(identity?.countryCode);

  // Fill in what we already know once, without overwriting anything the shopper has typed.
  useEffect(() => {
    setAddress((prev) => ({
      ...prev,
      email: prev.email || user?.email || '',
      countryCode: prev.countryCode !== 'US' || prev.firstName || prev.address1 ? prev.countryCode : (identity?.countryCode || prev.countryCode),
      city: prev.city || identity?.city || '',
    }));
  }, [user?.email, identity?.countryCode, identity?.city]);

  const changeQty = async (rowId: string, key: { variantId?: string | null; productId?: string | null }, qty: number) => {
    if (qty < 1) return;
    setItemBusy(rowId);
    try { await updateItemQuantity(key, qty); } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't update the quantity", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally { setItemBusy(null); }
  };

  const dropItem = async (rowId: string, key: { variantId?: string | null; productId?: string | null }) => {
    setItemBusy(rowId);
    try { await removeItem(key); } catch (err) {
      toast({ variant: 'destructive', title: "Couldn't remove the item", description: err instanceof Error ? err.message : 'Please try again.' });
    } finally { setItemBusy(null); }
  };

  const goSignIn = () => router.push(`/auth/signin?redirect=${encodeURIComponent('/checkout')}`);

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

  const discountedTotal = appliedDiscount ? Math.max(0, total - num(appliedDiscount.amount)) : total;
  const pointsNeeded = wallet && currencyCode === 'USD' ? usdToPoints(discountedTotal, wallet.pointsPerUsd) : null;
  const pointsShort = wallet && pointsNeeded != null ? Math.max(0, pointsNeeded - wallet.points) : 0;

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

      if (pointsMode) {
        // Pay from the wallet: the points are debited and the order marked paid in one step on the server.
        try {
          await payOrderWithPoints(MARKET_UNDERWORLD_STORE_ID, order.id);
        } catch (err) {
          const e = err as Error & { code?: string; details?: { short?: number } };
          if (e.code === 'INSUFFICIENT_POINTS') {
            toast({ variant: 'destructive', title: 'Not enough points', description: `${e.message}. Load your wallet, then pay this order from your dashboard.` });
            getPointsWallet().then(setWallet).catch(() => {});
            return;
          }
          throw err;
        }
        await clear();
        router.push(`/checkout/confirmation/${order.id}`);
        return;
      }

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
        // The intent carried no hosted-checkout handle: no redirect URL, no form-post, no
        // Razorpay key. This branch used to confirm the order anyway, which reached
        // order-service's mock provider and marked a REAL order paid without a payment. Refuse
        // instead — an order that cannot be charged must not become an order that looks settled.
        throw new Error('Payment could not be started. Please choose another method or try again shortly.');
      }

      await clear();
      router.push(`/checkout/confirmation/${order.id}`);
    } catch (err) {
      // Investment listings need a one-time identity check; send the buyer to complete it.
      if ((err as { code?: string }).code === 'KYC_REQUIRED') {
        toast({ title: 'Identity verification needed', description: 'This item can only be bought by verified people. Taking you to verification.' });
        router.push('/kyc?next=/checkout');
        return;
      }
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

  const field = 'w-full bg-brand-void border border-brand-border h-12 rounded-lg px-4 text-base sm:text-sm text-white placeholder:text-text-ghost outline-none focus:border-brand-green';
  const label = 'block text-xs font-semibold text-text-muted mb-1.5';
  const payLabel = pointsMode
    ? (pointsNeeded != null ? `Pay ${pointsNeeded.toLocaleString()} points` : 'Pay with points')
    : cryptoOnly ? 'Continue to crypto payment' : `Pay ${formatMoney(discountedTotal, currencyCode)}`;
  const nothingPriced = items.length > 0 && subtotal <= 0;

  return (
    <div className="min-h-screen bg-brand-base text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Checkout</h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-text-muted">
            <Lock className="w-4 h-4 text-brand-green shrink-0" /> Secure checkout. Review your order, add your details, pay.
          </p>
          {cryptoOnly && <Badge variant="warning" className="mt-3">Crypto payment only</Badge>}
        </header>

        {cartLoading ? (
          <div className="text-center text-text-muted py-20">Loading your cart…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-text-muted py-16 space-y-5 border border-brand-border rounded-xl bg-brand-surface">
            <ShoppingBag className="w-10 h-10 mx-auto text-text-ghost" />
            <p className="text-white font-semibold">Your cart is empty</p>
            <p className="text-sm">Add something from the marketplace and it will show up here.</p>
            <AppButton onClick={() => router.push('/marketplace')}>Browse the marketplace</AppButton>
          </div>
        ) : cryptoStep ? (
          <div className="max-w-2xl mx-auto">
            <div className="p-6 sm:p-8 space-y-6 rounded-xl border border-brand-border bg-brand-surface">
              <div className="flex items-center gap-3 text-brand-green">
                <Wallet className="w-6 h-6 shrink-0" />
                <h2 className="text-lg font-bold text-white">Send your crypto payment</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{cryptoStep.intent.instructions}</p>
              <div className="space-y-3">
                {Object.entries(cryptoStep.intent.wallets || {}).filter(([, addr]) => addr).map(([coin, addr]) => (
                  <div key={coin} className="flex items-center justify-between gap-3 p-4 bg-brand-void border border-brand-border rounded-lg">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-text-muted uppercase">{coin}</div>
                      <div className="font-mono text-sm text-white break-all">{addr}</div>
                    </div>
                    <button onClick={() => copyAddress(addr)} aria-label={`Copy ${coin} address`} className="p-3 text-text-ghost hover:text-brand-green shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {Object.values(cryptoStep.intent.wallets || {}).every((v) => !v) && (
                  <p className="text-xs text-semantic-error">No wallet addresses are configured yet. Contact support to complete this order.</p>
                )}
              </div>
              <div className="pt-4 border-t border-brand-border flex justify-between items-center">
                <span className="text-sm text-text-muted">Order total</span>
                <span className="text-2xl font-bold text-brand-green font-mono">{formatMoney(total, currencyCode)}</span>
              </div>
              <AppButton onClick={handleCryptoSent} isLoading={isProcessing} className="w-full h-14 gap-2">
                <CheckCircle2 className="w-4 h-4" /> I&apos;ve sent the payment
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            {/* Order summary: first on phones so people see what they are paying for, sticky beside the form on desktop */}
            <aside className="lg:col-span-5 lg:order-2 lg:sticky lg:top-28">
              <div className="rounded-xl border border-brand-border bg-brand-surface p-5 sm:p-6 space-y-5">
                <h2 className="text-base font-bold text-white">Your order</h2>
                <ul className="divide-y divide-brand-border">
                  {items.map((item) => {
                    const key = { variantId: item.variantId, productId: item.productId };
                    const rowId = item.variantId ?? item.productId ?? item.sku;
                    return (
                      <li key={rowId} className="py-3 first:pt-0 last:pb-0 flex gap-3 justify-between">
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium break-words">{item.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">{formatMoney(num(item.price), currencyCode)} each</p>
                          <div className="mt-2 inline-flex items-center rounded-lg border border-brand-border">
                            <button type="button" aria-label="Decrease quantity" disabled={itemBusy === rowId || item.quantity <= 1} onClick={() => changeQty(rowId, key, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-white disabled:opacity-40"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center text-sm text-white font-mono">{item.quantity}</span>
                            <button type="button" aria-label="Increase quantity" disabled={itemBusy === rowId} onClick={() => changeQty(rowId, key, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-white disabled:opacity-40"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between shrink-0">
                          <span className="text-sm text-white font-mono">{formatMoney(num(item.price) * item.quantity, currencyCode)}</span>
                          <button type="button" aria-label={`Remove ${item.name}`} disabled={itemBusy === rowId} onClick={() => dropItem(rowId, key)} className="p-2 -mr-2 text-text-ghost hover:text-semantic-error disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <dl className="space-y-2 pt-4 border-t border-brand-border text-sm">
                  <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd className="text-white font-mono">{formatMoney(subtotal, currencyCode)}</dd></div>
                  <div className="flex justify-between"><dt className="text-text-muted">Shipping</dt><dd className="text-white font-mono">{estimatedShipping === 0 ? 'Free' : formatMoney(estimatedShipping, currencyCode)}</dd></div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-brand-green"><dt>Discount ({appliedDiscount.code})</dt><dd className="font-mono">-{formatMoney(num(appliedDiscount.amount), currencyCode)}</dd></div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 border-t border-brand-border">
                    <dt className="font-bold text-white">Total</dt>
                    <dd className="text-2xl font-bold text-brand-green font-mono">{formatMoney(discountedTotal, currencyCode)}</dd>
                  </div>
                </dl>
              </div>
            </aside>

            <div className="lg:col-span-7 lg:order-1 space-y-6">
              {!isAuthenticated && !authLoading && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <p className="text-sm text-amber-100">You need to be signed in to pay. Your cart is saved and will be waiting when you come back.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/auth/signin?redirect=${encodeURIComponent('/checkout')}`} className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-white text-black text-sm font-bold hover:bg-gray-200">Sign in</Link>
                    <Link href="/auth/registration" className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-white/20 text-white text-sm font-bold hover:bg-white/5">Create an account</Link>
                  </div>
                </div>
              )}

              {nothingPriced && (
                <div className="rounded-xl border border-semantic-error/30 bg-semantic-error/5 p-5 text-sm text-red-100">
                  The items in your cart don&apos;t have a price yet, so they can&apos;t be paid for. Remove them or check back soon.
                </div>
              )}

              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 sm:p-6 space-y-5" aria-labelledby="co-details">
                <h2 id="co-details" className="text-base font-bold text-white">Your details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="co-first" className={label}>First name</label><input id="co-first" autoComplete="given-name" value={address.firstName} onChange={(e) => handleAddressChange('firstName', e.target.value)} className={field} /></div>
                  <div><label htmlFor="co-last" className={label}>Last name</label><input id="co-last" autoComplete="family-name" value={address.lastName} onChange={(e) => handleAddressChange('lastName', e.target.value)} className={field} /></div>
                </div>
                <div><label htmlFor="co-email" className={label}>Email (we send your confirmation here)</label><input id="co-email" type="email" inputMode="email" autoComplete="email" value={address.email} onChange={(e) => handleAddressChange('email', e.target.value)} className={field} /></div>
                <div><label htmlFor="co-address" className={label}>Address</label><input id="co-address" autoComplete="street-address" value={address.address1} onChange={(e) => handleAddressChange('address1', e.target.value)} className={field} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="co-city" className={label}>City</label><input id="co-city" autoComplete="address-level2" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} className={field} /></div>
                  <div>
                    <label htmlFor="co-country" className={label}>Country</label>
                    <select id="co-country" autoComplete="country" value={address.countryCode} onChange={(e) => handleAddressChange('countryCode', e.target.value)} className={field}>
                      {countryOptions.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label htmlFor="co-phone" className={label}>Phone</label><input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" value={address.phone} onChange={(e) => handleAddressChange('phone', e.target.value)} className={field} /></div>
              </section>

              <section className="rounded-xl border border-brand-border bg-brand-surface p-5 sm:p-6 space-y-5" aria-labelledby="co-pay">
                <h2 id="co-pay" className="text-base font-bold text-white">Payment</h2>

                <div>
                  <label htmlFor="co-code" className={label}>Discount code (optional)</label>
                  <div className="flex gap-2">
                    <input id="co-code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} disabled={!!appliedDiscount} className={`${field} flex-1 min-w-0 font-mono disabled:opacity-60`} />
                    {appliedDiscount ? (
                      <AppButton type="button" onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }} className="h-12 px-5 shrink-0 bg-brand-void border border-brand-border text-white text-sm font-bold">Remove</AppButton>
                    ) : (
                      <AppButton type="button" onClick={handleApplyDiscount} isLoading={checkingDiscount} className="h-12 px-5 shrink-0 bg-brand-void border border-brand-border text-white text-sm font-bold">Apply</AppButton>
                    )}
                  </div>
                </div>

                {pointsMode && (
                  <div className="space-y-3 p-4 rounded-lg bg-brand-void border border-brand-border">
                    <p className="text-sm font-semibold text-white">Pay with wallet points</p>
                    {wallet ? (
                      <>
                        <div className="flex justify-between text-sm"><span className="text-text-muted">Your wallet</span><span className="text-white font-mono">{wallet.points.toLocaleString()} pts</span></div>
                        {pointsNeeded != null && <div className="flex justify-between text-sm"><span className="text-text-muted">This order</span><span className="text-white font-mono">{pointsNeeded.toLocaleString()} pts</span></div>}
                        {pointsNeeded != null && (pointsShort > 0
                          ? <p className="text-sm text-amber-300">You need {pointsShort.toLocaleString()} more points. <Link href="/wallet" className="underline text-white">Load your wallet</Link>, then come back.</p>
                          : <div className="flex justify-between text-sm"><span className="text-text-muted">Left after paying</span><span className="text-emerald-400 font-mono">{(wallet.points - pointsNeeded).toLocaleString()} pts</span></div>)}
                      </>
                    ) : isAuthenticated ? <p className="text-sm text-text-muted">Loading your wallet…</p> : <p className="text-sm text-text-muted">Sign in to see your wallet.</p>}
                  </div>
                )}

                {!cryptoOnly && !pointsMode && (
                  <fieldset>
                    <legend className={label}>Payment method</legend>
                    <div className="grid grid-cols-2 gap-3">
                      {(['razorpay', 'payu'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={gateway === g}
                          onClick={() => setGateway(g)}
                          className={`h-12 rounded-lg border text-sm font-bold transition-colors ${gateway === g ? 'bg-brand-green/10 border-brand-green text-white' : 'bg-brand-void border-brand-border text-text-muted hover:text-white'}`}
                        >
                          {g === 'razorpay' ? 'Razorpay' : 'PayU'}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <AppButton
                  onClick={isAuthenticated ? handlePayment : goSignIn}
                  isLoading={isProcessing}
                  disabled={nothingPriced || (isAuthenticated && pointsMode && (!wallet || pointsShort > 0))}
                  className="w-full h-14 text-base font-bold"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isAuthenticated ? payLabel : 'Sign in to pay'}
                </AppButton>
                <p className="text-xs text-text-muted text-center">You can change quantities or remove items above before you pay.</p>
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
