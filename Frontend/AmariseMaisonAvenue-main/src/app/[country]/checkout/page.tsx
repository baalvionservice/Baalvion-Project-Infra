"use client";

import React, { useState, useMemo, useEffect } from "react";
import Script from "next/script";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  ArrowRight,
  ChevronRight,
  Globe,
  Zap,
  Smartphone,
  Building2,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { placeOrder } from "@/lib/checkout";
import {
  addressApi,
  orderApi,
  type SavedAddress,
  type AddressInput,
  type Order,
  type PaymentGatewaySlug,
} from "@/lib/api-client";
import { useMarket } from "@/lib/useMarkets";
import type { RazorpayHandlerResponse } from "@/types/razorpay";
import { authClient, getAccessToken, getCurrentUser } from "@/lib/auth";
import { apiOrchestrator } from "@/lib/api/orchestrator";
import { handleNotImplementedError } from "@/lib/feature-policy";
import { onMissingCheckoutDependency, revalidateCartStock } from "@/lib/checkout-policy";
import { getProductById } from "@/lib/catalog";
import { PaymentGateway, CountryCode } from "@/lib/types";
import { formatAmount, normalizeCountry } from "@/lib/i18n/countries";
import { RiskEngine } from "@/lib/fraud/risk-engine";

export default function CheckoutPage() {
  const {
    cart,
    clearCart,
    currentUser,
    paymentPlans,
    countryConfigs,
    fxRates,
    recordFraudLog,
    catalogSource,
  } = useAppStore();
  const { country } = useParams();
  const searchParams = useSearchParams();
  const countryCode = normalizeCountry(country as string);
  // Live per-market tax facts (GET /commerce/markets); falls back to the static config when offline.
  const { market: liveMarket } = useMarket(countryCode);

  // Map the UI gateway enum to the C1 contract slug (stripe|razorpay|payu|bank).
  const GATEWAY_SLUG: Record<PaymentGateway, PaymentGatewaySlug> = {
    STRIPE: "stripe",
    RAZORPAY: "razorpay",
    PAYU: "payu",
    BANK_TRANSFER: "bank",
  };
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // ── Shipping address (full, backend-validatable) ──────────────────────────
  // addressSchema requires address1 + city + countryCode; the rest are optional
  // but we collect a complete address so the order's shippingAddress JSONB is real.
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState(""); // state / province / region
  const [zip, setZip] = useState("");
  const [addrCountryCode, setAddrCountryCode] = useState(
    countryCode.toUpperCase()
  );
  const [phone, setPhone] = useState("");

  // Saved-address autofill (signed-in shoppers only). Guests keep a blank form.
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [isSignedIn, setIsSignedIn] = useState(false);
  // When the shopper has a saved address we show a "Deliver to" summary; this
  // toggle reveals the editable form (new address or override).
  const [isEnteringNewAddress, setIsEnteringNewAddress] = useState(false);
  // Save-to-account: default ON for signed-in shoppers with nothing saved yet.
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false);

  const [selectedGateway, setSelectedGateway] =
    useState<PaymentGateway>("STRIPE");
  const [isSettling, setIsSettling] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [inventoryLockId, setInventoryLockId] = useState<string | null>(null);
  const [lockedFXRate, setLockedFXRate] = useState<number | null>(null);
  const [fraudBlocked, setFraudBlocked] = useState(false);
  // Stable per-checkout idempotency key — repeated submits/retries dedupe server-side.
  const idempotencyKeyRef = React.useRef(
    `amarise-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );

  // The confirmation reference is the REAL backend order.id (set in finalizeSuccess) — never a
  // random #AM-#### placeholder.

  // Copy a saved address into the editable form fields (incl. name).
  const applyAddressToForm = (addr: SavedAddress) => {
    setFirstName(addr.firstName ?? "");
    setLastName(addr.lastName ?? "");
    setAddress1(addr.address1 ?? "");
    setAddress2(addr.address2 ?? "");
    setCity(addr.city ?? "");
    setRegion(addr.state ?? "");
    setZip(addr.zip ?? "");
    setAddrCountryCode((addr.countryCode || countryCode).toUpperCase());
    setPhone(addr.phone ?? "");
  };

  // On mount: restore the real session (httpOnly refresh cookie) and, if signed
  // in, load saved addresses and prefill from the default (or first). Guests and
  // shoppers with no saved address fall back to a blank form. Never blocks checkout.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getAccessToken()) {
        await authClient.bootstrap();
      }
      const signedIn = !!getAccessToken() && !!getCurrentUser();
      if (cancelled) return;
      setIsSignedIn(signedIn);

      if (!signedIn) {
        // Guest: blank form, no save-to-account option.
        setIsEnteringNewAddress(true);
        return;
      }

      const res = await addressApi.listMine();
      if (cancelled) return;

      if (res.ok && res.data.length > 0) {
        const preferred =
          res.data.find((a) => a.isDefault) ?? res.data[0];
        setSavedAddresses(res.data);
        setSelectedAddressId(preferred.id);
        applyAddressToForm(preferred);
        // Has a saved address → show "Deliver to" summary; don't pre-check save.
        setIsEnteringNewAddress(false);
        setShouldSaveAddress(false);
      } else {
        // Signed in but nothing saved → blank form, default to saving it.
        setIsEnteringNewAddress(true);
        setShouldSaveAddress(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // countryCode is stable per route render; intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Required-field gate for the dispatch step. Mirror the backend addressSchema requireds
  // exactly: firstName/lastName/address1/city/countryCode. state/zip are OPTIONAL (not every
  // market uses them) — requiring them here would wrongly block an otherwise-valid saved or
  // entered address from checking out.
  const isAddressComplete =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    address1.trim() !== "" &&
    city.trim() !== "" &&
    addrCountryCode.trim() !== "";

  const usingSavedSummary =
    isSignedIn && savedAddresses.length > 0 && !isEnteringNewAddress;

  // Build the immutable shippingAddress object passed to placeOrder + saved to
  // the account. Optional fields are omitted when blank to keep the JSONB clean.
  const buildShippingAddress = (): Record<string, unknown> => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    address1: address1.trim(),
    ...(address2.trim() ? { address2: address2.trim() } : {}),
    city: city.trim(),
    state: region.trim(),
    zip: zip.trim(),
    countryCode: addrCountryCode.trim().toUpperCase(),
    ...(phone.trim() ? { phone: phone.trim() } : {}),
  });

  const handleSelectSavedAddress = (id: string) => {
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) return;
    setSelectedAddressId(id);
    applyAddressToForm(addr);
  };

  const planId = searchParams.get("planId");
  const selectedPlan = useMemo(
    () => paymentPlans.find((p) => p.id === planId),
    [planId, paymentPlans]
  );
  const currentCountryConfig = useMemo(
    () => countryConfigs.find((c) => c.code === countryCode),
    [countryCode, countryConfigs]
  );

  // The active market currency comes from the cart items (FX-resolved by the storefront API);
  // a plan-only checkout has no item, so fall back to the country's own currency via formatAmount.
  const marketCurrency = cart[0]?.currencyCode;
  // Inclusive markets (UK/AE/IN/SG VAT/GST) show tax as already inside the price; the US adds it.
  const marketTaxInclusive = cart[0]?.taxInclusive ?? false;
  const renderAmount = (amount: number) =>
    formatAmount(amount, marketCurrency ?? "", countryCode);

  // Market-aware tax/total computation. Each line's money is already in the market currency
  // (item.price); tax facts (rate/type/inclusive) come from the item's market fields, NOT a
  // USD tax engine. Inclusive markets keep tax inside the price; exclusive (US) adds it on top.
  const taxCalculation = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    const breakdown = cart.map((item) => {
      const lineSubtotal = (item.price ?? item.basePrice) * item.quantity;
      const rate = item.taxRate ?? 0;
      const inclusive = item.taxInclusive ?? false;
      const lineTax = rate
        ? inclusive
          ? lineSubtotal - lineSubtotal / (1 + rate / 100)
          : lineSubtotal * (rate / 100)
        : 0;
      const lineTotal = inclusive ? lineSubtotal : lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      totalTax += lineTax;
      return {
        itemId: item.id,
        itemName: item.name,
        itemPrice: lineSubtotal,
        taxAmount: lineTax,
        taxRate: rate,
        taxType: item.taxType ?? null,
        taxInclusive: inclusive,
        lineTotal,
      };
    });

    if (selectedPlan) {
      // Subscriptions have no market FX/tax context — list at face value, no jurisdictional tax.
      subtotal += selectedPlan.price;
      breakdown.push({
        itemId: selectedPlan.id,
        itemName: selectedPlan.name,
        itemPrice: selectedPlan.price,
        taxAmount: 0,
        taxRate: 0,
        taxType: null,
        taxInclusive: false,
        lineTotal: selectedPlan.price,
      });
    }

    const totalAmount = breakdown.reduce((acc, b) => acc + b.lineTotal, 0);
    return { subtotal, totalTax, totalAmount, breakdown };
  }, [cart, selectedPlan]);

  const totalYield = taxCalculation.totalAmount;

  /**
   * 🛡️ FRAUD & INVENTORY PROTOCOL
   */
  const handleLockInventory = async () => {
    if (cart.length > 0) {
      // 0. Oversell guard — synchronous live availability re-check against the catalog's
      // server-computed `inStock`. Hard-blocks an item the catalog now reports sold out, closing
      // the pre-order window for the last unit (createOrder still atomically reserves at order time).
      const stock = await revalidateCartStock(
        cart.map((c) => ({ productId: c.id, name: c.name })),
        (productId) => getProductById(productId, countryCode as CountryCode),
      );
      if (!stock.available) {
        toast({
          variant: "destructive",
          title: "No Longer Available",
          description: `${stock.soldOut.join(", ")} just sold out. Please remove ${
            stock.soldOut.length > 1 ? "these pieces" : "this piece"
          } to continue.`,
        });
        return;
      }

      toast({
        title: "Maison Security Audit",
        description: "Evaluating acquisition risk profile...",
      });

      // 1. Evaluate Fraud Risk
      const riskAnalysis = RiskEngine.evaluateAcquisitionRisk(
        null, // No VIP session mock
        cart,
        countryCode as CountryCode,
        { attemptCount: 1, ipHub: countryCode.toUpperCase() }
      );

      recordFraudLog(
        RiskEngine.createLog(currentUser?.id || "guest", riskAnalysis)
      );

      if (riskAnalysis.action === "block") {
        setFraudBlocked(true);
        toast({
          variant: "destructive",
          title: "Institutional Hold",
          description:
            "This acquisition intent has been flagged by Maison security. Please contact a specialist.",
        });
        return;
      }

      if (riskAnalysis.action === "flag") {
        toast({
          title: "Enhanced Verification",
          description:
            "Due to acquisition magnitude, a specialist review is active.",
        });
      }

      // 2. Lock Inventory
      toast({
        title: "Securing Artifacts",
        description: "Verifying atomic availability in global registry...",
      });
      const lockRes = await apiOrchestrator.lockInventory(
        cart[0].id,
        currentUser?.id || "guest"
      );

      if (lockRes.status === "success" && lockRes.data) {
        setInventoryLockId(lockRes.data.lock_id);
        const currentHubRate =
          fxRates.find((r) => r.currencyCode === currentCountryConfig?.currency)
            ?.rate || 1;
        setLockedFXRate(currentHubRate);
        setStep(2);
      } else if (lockRes.code === 501) {
        // Inventory lock has no backend → CONTINUITY policy: proceed WITHOUT a reservation,
        // logging an explicit warning (no silent failure, no permanent hard block).
        handleNotImplementedError("inventoryLock", lockRes.error);
        const decision = onMissingCheckoutDependency("inventoryLock");
        if (decision.proceed) {
          const currentHubRate =
            fxRates.find((r) => r.currencyCode === currentCountryConfig?.currency)
              ?.rate || 1;
          setLockedFXRate(currentHubRate);
          toast({
            title: "Proceeding to Settlement",
            description: "Inventory reservation is unavailable; continuing without a hold.",
          });
          setStep(2);
        } else {
          toast({
            variant: "destructive",
            title: "Checkout Unavailable",
            description: decision.message,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Allocation Conflict",
          description: lockRes.error,
        });
      }
    } else {
      setStep(2);
    }
  };

  /**
   * Shared success routine — identical for the mock provider, the gateway
   * (Razorpay) post-capture path, and bank transfer. The backend order is the
   * single source of truth (no local invoice/transaction mirror): we record the
   * real order.id, advance to the confirmation step, clear the cart, and fire the
   * optional save-address side effect.
   */
  const finalizeSuccess = (order: Order) => {
    setOrderRef(order.id);

    setIsSettling(false);
    setStep(3);
    clearCart();

    // Fire-and-forget: persist the address to the signed-in shopper's account
    // when opted in. A failure must NOT block or scare-toast the completed
    // order — it's a soft convenience, so we log and move on.
    if (shouldSaveAddress && isSignedIn) {
      const newAddress: AddressInput = {
        addressType: "shipping",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address1: address1.trim(),
        address2: address2.trim() || null,
        city: city.trim(),
        state: region.trim() || null,
        zip: zip.trim() || null,
        countryCode: addrCountryCode.trim().toUpperCase(),
        phone: phone.trim() || null,
        isDefault: savedAddresses.length === 0, // first saved address becomes default
      };
      addressApi
        .create(newAddress)
        .then((saveRes) => {
          if (!saveRes.ok) {
            console.warn(
              "[checkout] could not save address to account:",
              saveRes.error
            );
          }
        })
        .catch((saveErr) => {
          console.warn(
            "[checkout] could not save address to account:",
            saveErr
          );
        });
    }

    toast({ title: "Order Created", description: `Order ${order.id} confirmed.` });
  };

  const handlePlaceOrder = async () => {
    setIsSettling(true);

    // Phase 4: fallback checkout is FORBIDDEN — never place a real order against an
    // offline/mock catalog (that would mix fallback products with real orders).
    if (catalogSource !== "backend") {
      setIsSettling(false);
      toast({
        variant: "destructive",
        title: "Checkout Unavailable",
        description:
          "The commerce backend is offline; orders cannot be placed against the offline catalog.",
      });
      return;
    }

    try {
      // REAL backend order is the source of truth (order-service is items-based).
      const result = await placeOrder({
        lines: cart.map((c) => ({
          id: c.id,
          productId: c.id, // backend product uuid (catalog is backend-driven; fallback checkout is blocked)
          name: c.name,
          basePrice: c.basePrice,
          quantity: c.quantity,
        })),
        currencyCode: currentCountryConfig?.currency || "USD",
        country: countryCode,
        shippingAmount: 0,
        // Chosen settlement gateway, sent to + recorded by order-service (C1). Non-prod stays mocked.
        gateway: GATEWAY_SLUG[selectedGateway],
        // Live per-market tax facts (GET /commerce/markets) so a backend rate change is honored
        // without a code change; placeOrder falls back to the static config when this is absent.
        ...(liveMarket
          ? {
              taxContext: {
                taxType: liveMarket.taxType,
                taxRate: liveMarket.taxRate,
                taxInclusive: liveMarket.taxInclusive,
              },
            }
          : {}),
        // Link to the REAL signed-in shopper (resolved inside placeOrder via the auth session,
        // not the mock store). The form name seeds the customer record on first link; guests
        // stay anonymous. Replaces the previous mock `currentUser?.id`.
        customer: { firstName, lastName },
        idempotencyKey: idempotencyKeyRef.current,
        // Full shipping address now collected (name + address1/city/state/zip/countryCode,
        // optional address2/phone) → stored as-is in the order's shippingAddress JSONB.
        shippingAddress: buildShippingAddress(),
      });

      if (!result.ok) {
        setIsSettling(false);
        // Phase 7: failure visibility — never a silent degradation.
        console.error("[checkout] backend order creation failed:", result.error);
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: result.error.message, // explicit — no fake confirmation
        });
        return;
      }

      const order = result.data.order;
      const intent = result.data.intent;

      // ── Gateway path (Razorpay): the order exists but is UNPAID. Open the
      // provider checkout and finalize only after a SERVER-VERIFIED capture.
      // Bank transfer never carries an intent → it falls through to the
      // pending/mock success path below, unchanged. ──────────────────────────
      if (
        intent?.keyId &&
        intent.amount != null &&
        intent.currency &&
        selectedGateway !== "BANK_TRANSFER"
      ) {
        if (!window.Razorpay) {
          // Script not loaded yet — never silently swallow; let the shopper retry.
          setIsSettling(false);
          toast({
            variant: "destructive",
            title: "Payment Loading",
            description:
              "Payment is still loading, please try again in a moment.",
          });
          return;
        }

        const currentUser = getCurrentUser();
        const rzp = new window.Razorpay({
          key: intent.keyId,
          order_id: intent.intentId,
          amount: intent.amount,
          currency: intent.currency,
          name: "Amarisé Maison Avenue",
          description: `Order ${order.id}`,
          prefill: {
            name: `${firstName} ${lastName}`.trim(),
            ...(currentUser?.email ? { email: currentUser.email } : {}),
          },
          theme: { color: "#5d2a4a" }, // on-brand plum
          handler: async (resp: RazorpayHandlerResponse) => {
            try {
              const confirmed = await orderApi.confirmPayment(
                order.id,
                intent.intentId,
                {
                  gateway: GATEWAY_SLUG[selectedGateway],
                  verification: {
                    razorpay_payment_id: resp.razorpay_payment_id,
                    razorpay_order_id: resp.razorpay_order_id,
                    razorpay_signature: resp.razorpay_signature,
                  },
                }
              );

              // C1: confirmPayment returns the full updated Order; PAID iff paymentStatus === 'paid'.
              if (confirmed.ok && confirmed.data.paymentStatus === "paid") {
                // SUCCESS — server verified the HMAC + captured. Show the REAL
                // order (real id + paid state) via the shared success routine.
                finalizeSuccess(confirmed.data);
                return;
              }

              // Verification/capture rejected — surface a clear reason, stay on the
              // payment step, and re-enable the settle button.
              setIsSettling(false);
              toast({
                variant: "destructive",
                title: "Settlement Failed",
                description: confirmed.ok
                  ? "Payment could not be verified. Please try again."
                  : confirmed.error.message,
              });
            } catch (confirmErr) {
              setIsSettling(false);
              toast({
                variant: "destructive",
                title: "Settlement Failed",
                description:
                  confirmErr instanceof Error
                    ? confirmErr.message
                    : "Payment confirmation failed. Please try again.",
              });
            }
          },
          modal: {
            ondismiss: () => {
              // Shopper closed the popup without paying — order stays unpaid
              // (fine for follow-up). Just return the button to an actionable state.
              setIsSettling(false);
            },
          },
        });
        rzp.open();
        return; // the rest is handled asynchronously inside the handler/dismiss.
      }

      // ── Mock / bank-transfer / auto-confirmed path — unchanged behavior. ────
      finalizeSuccess(order);
    } catch (e) {
      setIsSettling(false);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: e instanceof Error ? e.message : "Unexpected error.",
      });
    }
  };

  // Redirection logic moved to useEffect to prevent "Cannot update a component while rendering another" error.
  useEffect(() => {
    if (cart.length === 0 && !selectedPlan && step !== 3) {
      router.push(`/${countryCode}/cart`);
    }
  }, [cart.length, selectedPlan, step, router, countryCode]);

  // Phase 4: explicit unavailable state when the catalog is the offline mock fallback.
  if (catalogSource === "fallback") {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-10 animate-fade-in text-center">
        <div className="p-12 bg-amber-50 border border-amber-100 rounded-full text-amber-600">
          <AlertTriangle className="w-20 h-20" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-headline font-bold italic tracking-tight">
            Checkout Unavailable
          </h1>
          <p className="text-gray-500 font-light italic max-w-md mx-auto">
            Our acquisition registry is temporarily offline. Browsing remains available;
            settlement is disabled until the registry is restored.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${countryCode}`)}
          size="lg"
          className="rounded-none bg-black hover:bg-plum px-16 h-16 text-[10px] font-bold uppercase tracking-[0.4em]"
        >
          Return to Maison
        </Button>
      </div>
    );
  }

  if (fraudBlocked) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-12 animate-fade-in text-center">
        <div className="p-12 bg-red-50 border border-red-100 rounded-full shadow-inner text-red-600">
          <AlertTriangle className="w-20 h-20" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-headline font-bold italic tracking-tight">
            Security Hold
          </h1>
          <p className="text-gray-500 font-light italic max-w-md mx-auto">
            "Institutional protocols require a private dialogue for this
            acquisition. Please contact our global concierge."
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${countryCode}/contact`)}
          size="lg"
          className="rounded-none bg-black hover:bg-plum px-16 h-16 text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl transition-all"
        >
          CONTACT CONCIERGE
        </Button>
      </div>
    );
  }

  if (cart.length === 0 && !selectedPlan && step !== 3) {
    return null;
  }

  return (
    <div className="container mx-auto px-2 md:px-12 py-2 md:py-24 max-w-7xl animate-fade-in font-body">
      {/* Razorpay Checkout — loaded once so the provider popup is ready by the
          time the shopper reaches the settlement step. Only opened on the
          gateway path (see handlePlaceOrder). */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="hidden md:flex justify-center items-center space-x-12 mb-24">
        <ProtocolStep
          num={1}
          label="Logistics Registry"
          active={step === 1}
          completed={step > 1}
        />
        <div
          className={cn(
            "w-20 h-px transition-colors duration-1000",
            step > 1 ? "bg-plum" : "bg-border"
          )}
        />
        <ProtocolStep
          num={2}
          label="Financial Settlement"
          active={step === 2}
          completed={step > 2}
        />
        <div
          className={cn(
            "w-20 h-px transition-colors duration-1000",
            step > 2 ? "bg-plum" : "bg-border"
          )}
        />
        <ProtocolStep
          num={3}
          label="Archive Confirmation"
          active={step === 3}
          completed={step === 3}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-24 items-start">
        {step < 3 ? (
          <>
            <div className="flex-1 w-full justify-between space-y-16">
              {step === 1 && (
                <div className="space-y-12 animate-fade-in">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-headline font-bold italic tracking-tight">
                      Identity & Dispatch
                    </h2>
                    <p className="text-md text-gray-500 font-light italic">
                      Define your global delivery charter.
                    </p>
                  </div>

                  {usingSavedSummary ? (
                    /* Signed-in shopper with a saved address: tasteful summary +
                       optional selector + "use a different address" escape hatch. */
                    <div className="space-y-8 animate-fade-in">
                      <fieldset className="border border-border bg-ivory/40 p-8 space-y-6">
                        <legend className="px-3 text-[9px] font-bold uppercase tracking-[0.3em] text-plum flex items-center space-x-2">
                          <Truck className="w-3 h-3" />
                          <span>Deliver To</span>
                        </legend>

                        {savedAddresses.length > 1 && (
                          <div className="space-y-3">
                            <Label
                              htmlFor="saved-address-select"
                              className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                            >
                              Saved Dispatch Registry
                            </Label>
                            <select
                              id="saved-address-select"
                              className="w-full rounded-none border border-border bg-white h-14 px-4 text-md italic focus:border-plum focus:outline-none"
                              value={selectedAddressId ?? ""}
                              onChange={(e) =>
                                handleSelectSavedAddress(e.target.value)
                              }
                            >
                              {savedAddresses.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {`${a.address1}, ${a.city}${
                                    a.state ? `, ${a.state}` : ""
                                  } — ${a.countryCode}`}
                                  {a.isDefault ? " (Default)" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <address className="not-italic space-y-1 text-md text-gray-800 font-light">
                          <p className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                            {firstName} {lastName}
                          </p>
                          <p>{address1}</p>
                          {address2 && <p>{address2}</p>}
                          <p>
                            {[city, region, zip].filter(Boolean).join(", ")}
                          </p>
                          <p className="uppercase tracking-widest text-[11px] text-gray-500">
                            {addrCountryCode}
                          </p>
                          {phone && (
                            <p className="text-[11px] text-gray-500">{phone}</p>
                          )}
                        </address>

                        <button
                          type="button"
                          onClick={() => {
                            setIsEnteringNewAddress(true);
                            setShouldSaveAddress(true);
                          }}
                          className="text-[10px] font-bold uppercase tracking-[0.3em] text-plum hover:text-black transition-colors underline underline-offset-4"
                        >
                          Use a different address
                        </button>
                      </fieldset>
                    </div>
                  ) : (
                    /* Editable form — guests, signed-in shoppers with no saved
                       address, and the "use a different address" path. */
                    <div className="space-y-8 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-first-name"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Legal First Name
                          </Label>
                          <Input
                            id="checkout-first-name"
                            autoComplete="given-name"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="Julian"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-last-name"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Legal Last Name
                          </Label>
                          <Input
                            id="checkout-last-name"
                            autoComplete="family-name"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="Vandervilt"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <Label
                            htmlFor="checkout-address1"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Dispatch Address
                          </Label>
                          <Input
                            id="checkout-address1"
                            autoComplete="address-line1"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="730 Fifth Avenue"
                            value={address1}
                            onChange={(e) => setAddress1(e.target.value)}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <Label
                            htmlFor="checkout-address2"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Apartment / Suite{" "}
                            <span className="text-gray-300 normal-case font-light tracking-normal">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="checkout-address2"
                            autoComplete="address-line2"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="Penthouse 12B"
                            value={address2}
                            onChange={(e) => setAddress2(e.target.value)}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-city"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            City
                          </Label>
                          <Input
                            id="checkout-city"
                            autoComplete="address-level2"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="New York"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-region"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            State / Region
                          </Label>
                          <Input
                            id="checkout-region"
                            autoComplete="address-level1"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="NY"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-zip"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Postal / ZIP Code
                          </Label>
                          <Input
                            id="checkout-zip"
                            autoComplete="postal-code"
                            aria-required="true"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="10019"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label
                            htmlFor="checkout-country"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Country Code
                          </Label>
                          <Input
                            id="checkout-country"
                            autoComplete="country"
                            aria-required="true"
                            maxLength={2}
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic uppercase focus:border-plum"
                            placeholder="US"
                            value={addrCountryCode}
                            onChange={(e) =>
                              setAddrCountryCode(
                                e.target.value.toUpperCase().slice(0, 2)
                              )
                            }
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <Label
                            htmlFor="checkout-phone"
                            className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                          >
                            Contact Phone{" "}
                            <span className="text-gray-300 normal-case font-light tracking-normal">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="checkout-phone"
                            autoComplete="tel"
                            type="tel"
                            className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                            placeholder="+1 212 555 0100"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      {!isAddressComplete && (
                        <p
                          role="status"
                          className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400"
                        >
                          Complete the required dispatch fields to continue.
                        </p>
                      )}

                      {isSignedIn && (
                        <label className="flex items-center space-x-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={shouldSaveAddress}
                            onChange={(e) =>
                              setShouldSaveAddress(e.target.checked)
                            }
                            className="w-4 h-4 accent-plum border-border rounded-none"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Save this address to my account
                          </span>
                        </label>
                      )}

                      {isSignedIn && savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEnteringNewAddress(false);
                            const preferred =
                              savedAddresses.find((a) => a.isDefault) ??
                              savedAddresses[0];
                            setSelectedAddressId(preferred.id);
                            applyAddressToForm(preferred);
                          }}
                          className="block text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors underline underline-offset-4"
                        >
                          Use a saved address instead
                        </button>
                      )}
                    </div>
                  )}

                  <Button
                    className="h-20 px-16 w-full mx-auto bg-black text-white hover:bg-plum rounded-none text-[11px] font-bold tracking-[0.4em] uppercase transition-all shadow-2xl disabled:opacity-30"
                    onClick={handleLockInventory}
                    disabled={!isAddressComplete}
                  >
                    CONTINUE TO SETTLEMENT{" "}
                    <ArrowRight className="ml-4 w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-12 animate-fade-in">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-headline font-bold italic tracking-tight">
                      Vault Authorization
                    </h2>
                    <p className="text-md text-gray-500 font-light italic">
                      Select your preferred global settlement gateway.
                    </p>
                  </div>

                  {inventoryLockId && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-emerald-600">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Archive Reservation Active
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[9px] font-bold text-emerald-400">
                        <Lock className="w-3 h-3" />
                        <span>Price Locked @ {lockedFXRate?.toFixed(4)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GatewayCard
                      id="STRIPE"
                      label="Stripe Global"
                      desc="Cards, Apple Pay, Google Pay"
                      icon={<CreditCard className="w-5 h-5" />}
                      active={selectedGateway === "STRIPE"}
                      onClick={() => setSelectedGateway("STRIPE")}
                    />
                    <GatewayCard
                      id="RAZORPAY"
                      label="Razorpay India"
                      desc="UPI, Netbanking, Cards"
                      icon={<Smartphone className="w-5 h-5" />}
                      active={selectedGateway === "RAZORPAY"}
                      onClick={() => setSelectedGateway("RAZORPAY")}
                    />
                    <GatewayCard
                      id="PAYU"
                      label="PayU"
                      desc="International Cards & Wallets"
                      icon={<Globe className="w-5 h-5" />}
                      active={selectedGateway === "PAYU"}
                      onClick={() => setSelectedGateway("PAYU")}
                    />
                    <GatewayCard
                      id="BANK_TRANSFER"
                      label="Bank Transfer / ACH"
                      desc="Delayed Settlement (2-3 Days)"
                      icon={<Building2 className="w-5 h-5" />}
                      active={selectedGateway === "BANK_TRANSFER"}
                      onClick={() => setSelectedGateway("BANK_TRANSFER")}
                    />
                  </div>

                  <div className="flex flex-col space-y-6">
                    <Button
                      disabled={isSettling}
                      className="w-full h-24 bg-plum text-white hover:bg-black rounded-none text-[12px] font-bold tracking-[0.5em] uppercase transition-all shadow-2xl"
                      onClick={handlePlaceOrder}
                    >
                      {isSettling
                        ? "PROCESSING SETTLEMENT..."
                        : `AUTHORIZE SETTLEMENT — ${renderAmount(totalYield)}`}
                    </Button>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors self-center"
                    >
                      REVISE DISPATCH REGISTRY
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:w-96 shrink-0 lg:sticky lg:top-40">
              <div className="bg-ivory p-2 md:p-10 border border-border space-y-10 rounded-none shadow-sm">
                <h3 className="text-xl font-headline font-bold uppercase tracking-widest border-b border-border pb-6">
                  Acquisition Context
                </h3>

                <div className="space-y-8 max-h-80 overflow-y-auto custom-scrollbar pr-4">
                  {taxCalculation.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start group"
                    >
                      <div className="space-y-1 flex-1">
                        <span className="block font-bold text-md uppercase tracking-tight text-gray-900 group-hover:text-plum transition-colors">
                          {item.itemName}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">
                            Price: {renderAmount(item.itemPrice)}
                          </span>
                          {item.taxRate > 0 && item.taxType && (
                            <span className="text-[9px] text-plum font-bold uppercase">
                              {item.taxInclusive
                                ? `incl. ${item.taxRate}% ${item.taxType}`
                                : `+${item.taxRate}% ${item.taxType}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-md tabular pl-4">
                        {renderAmount(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t border-border space-y-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Registry Subtotal</span>
                    <span className="text-gray-900 tabular">
                      {renderAmount(taxCalculation.subtotal)}
                    </span>
                  </div>
                  {taxCalculation.totalTax > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <span>{marketTaxInclusive ? "Included Tax" : "Aggregate Tax"}</span>
                      <span className="text-plum font-bold tabular">
                        {marketTaxInclusive ? "" : "+"}
                        {renderAmount(taxCalculation.totalTax)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Dispatch Protocol</span>
                    <span className="text-emerald-600">Complimentary</span>
                  </div>
                  <div className="flex justify-between items-end pt-6 border-t border-border/10">
                    <span className="text-xl font-headline font-bold italic tracking-tight">
                      Aggregate Yield
                    </span>
                    <div className="text-right">
                      <div className="text-3xl font-bold tabular leading-none">
                        {renderAmount(totalYield)}
                      </div>
                      {taxCalculation.totalTax > 0 && (
                        <p className="text-[8px] text-gray-400 uppercase font-bold mt-1">
                          {marketTaxInclusive
                            ? "Inclusive of Jurisdictional Tax"
                            : "Plus Jurisdictional Tax"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-32 space-y-16 animate-fade-in text-center max-w-4xl mx-auto">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-xl">
                <Check className="w-16 h-16 text-emerald-500 stroke-[3px]" />
              </div>
              <div className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-2xl border border-gray-100">
                <ShieldCheck className="w-6 h-6 text-gold" />
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-plum text-[10px] font-bold tracking-[0.6em] uppercase">
                  Acquisition Successful
                </span>
                <h1 className="text-7xl font-headline font-bold italic tracking-tighter text-gray-900">
                  Settlement Registry Established
                </h1>
              </div>
              <p className="text-xl text-gray-500 font-light italic max-w-2xl mx-auto leading-relaxed">
                Thank you for your choice. Your artifacts have been secured
                within the Maison registry.{" "}
                {selectedGateway === "BANK_TRANSFER"
                  ? "Please fulfill the bank transfer instructions sent to your correspondence email to complete settlement."
                  : "A private curator from our Parisian atelier will contact you within the hour to finalize the dispatch charter."}
              </p>
            </div>

            <div className="pt-12 border-t border-border w-full max-w-lg space-y-10">
              <div className="bg-ivory p-8 border border-border flex items-center justify-between group cursor-help">
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Registry Reference
                  </span>
                  <span className="font-mono text-xl font-bold uppercase tracking-tighter text-gray-900">
                    {orderRef || "..."}
                  </span>
                </div>
                <div className="p-3 bg-white border border-border rounded-full group-hover:border-plum transition-colors">
                  <Lock className="w-5 h-5 text-plum" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Button
                  onClick={() =>
                    router.push(`/${countryCode}/account/acquisitions`)
                  }
                  variant="outline"
                  className="h-16 rounded-none border-black text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black hover:text-white"
                >
                  ACQUISITION DASHBOARD
                </Button>
                <Button
                  onClick={() => router.push(`/${countryCode}`)}
                  className="h-16 rounded-none bg-black text-white hover:bg-plum text-[10px] font-bold tracking-[0.3em] uppercase shadow-2xl"
                >
                  RETURN TO MAISON
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProtocolStep({
  num,
  label,
  active,
  completed,
}: {
  num: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center space-x-4 transition-all duration-700",
        active
          ? "text-black scale-110"
          : completed
          ? "text-plum"
          : "text-gray-300"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-700",
          active
            ? "border-black bg-black text-white shadow-xl shadow-black/10"
            : completed
            ? "border-plum bg-plum/5 text-plum"
            : "border-border bg-transparent text-gray-300"
        )}
      >
        {completed && !active ? (
          <Check className="w-5 h-5 stroke-[3px]" />
        ) : (
          num
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
        {label}
      </span>
    </div>
  );
}

function GatewayCard({
  id,
  label,
  desc,
  icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  desc: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-6 border text-left flex flex-col space-y-3 transition-all",
        active
          ? "border-plum bg-plum/5 shadow-inner"
          : "border-border bg-white hover:border-plum/20"
      )}
    >
      <div className="flex justify-between items-center">
        <div
          className={cn(
            "p-2 rounded-full",
            active ? "bg-plum text-white" : "bg-ivory text-slate-400"
          )}
        >
          {icon}
        </div>
        {active && <Check className="w-4 h-4 text-plum" />}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-900">
          {label}
        </p>
        <p className="text-[10px] text-slate-400 italic">{desc}</p>
      </div>
    </button>
  );
}
