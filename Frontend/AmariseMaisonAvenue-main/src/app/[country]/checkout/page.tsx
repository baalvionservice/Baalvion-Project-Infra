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
  Globe,
  Smartphone,
  Building2,
  AlertTriangle,
  Gift,
  BadgeCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { placeOrder } from "@/lib/checkout";
import { BrandImage } from "@/components/ui/BrandImage";
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
  // Contact email — REQUIRED for both guest and signed-in checkout. It is persisted on the order's
  // shippingAddress so the order-confirmation email can reach a guest AND so a guest can later track
  // the order (email + order number) without an account. Prefilled from the account for signed-in users.
  const [email, setEmail] = useState("");

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
  // The human-readable order number (ORD-…) shown on the confirmation + used for guest tracking.
  const [orderNumberRef, setOrderNumberRef] = useState("");
  const [inventoryLockId, setInventoryLockId] = useState<string | null>(null);
  const [lockedFXRate, setLockedFXRate] = useState<number | null>(null);
  const [fraudBlocked, setFraudBlocked] = useState(false);
  // Optional gift note captured on the cart page (per market) → threaded into the order metadata.
  const [giftNote, setGiftNote] = useState("");
  // Bank-transfer / concierge: wire instructions shown on the confirmation step (order reserved, unpaid).
  const [bankInstructions, setBankInstructions] = useState<string | null>(null);
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
      // Prefill the contact email for signed-in shoppers (still editable).
      const signedInEmail = getCurrentUser()?.email;
      if (signedIn && signedInEmail) setEmail(signedInEmail);

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

  // Restore the gift note left on the cart page (per market) so it can be shown + persisted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(`amarise_order_note_${countryCode}`);
    if (saved) setGiftNote(saved);
  }, [countryCode]);

  // Required-field gate for the dispatch step. Mirror the backend addressSchema requireds
  // exactly: firstName/lastName/address1/city/countryCode. state/zip are OPTIONAL (not every
  // market uses them) — requiring them here would wrongly block an otherwise-valid saved or
  // entered address from checking out.
  // A valid contact email is required (guest confirmation + order tracking depend on it).
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isAddressComplete =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isEmailValid &&
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
    // Contact email — drives the order-confirmation email + guest order tracking.
    ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
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
        itemImage: item.imageUrl?.[0] as string | undefined,
        itemQty: item.quantity,
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
        itemImage: undefined,
        itemQty: 1,
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
        title: "Security Check",
        description: "Verifying your order…",
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
          title: "Order on Hold",
          description:
            "This order has been flagged by our security team. Please contact a specialist.",
        });
        return;
      }

      if (riskAnalysis.action === "flag") {
        toast({
          title: "Enhanced Verification",
          description:
            "Due to the value of this order, a specialist review is active.",
        });
      }

      // 2. Lock Inventory
      toast({
        title: "Reserving Your Pieces",
        description: "Confirming availability in our global registry…",
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
            title: "Proceeding to Payment",
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
          title: "Availability Conflict",
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
    setOrderNumberRef(order.orderNumber ?? "");

    setIsSettling(false);
    setStep(3);
    clearCart();
    // The gift note has been persisted onto the order — clear the per-market draft.
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(`amarise_order_note_${countryCode}`);
    }

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

    toast({ title: "Order Confirmed", description: `Order ${order.id} confirmed.` });
  };

  // Stripe (hosted Checkout) return: the shopper lands back on
  // /checkout?stripe_session=cs_...&order=<id>. We restore the session, then verify the Checkout
  // Session against Stripe SERVER-SIDE (confirmPayment) — success shows only on a real 'paid'.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const session = params.get("stripe_session");
    const orderId = params.get("order");
    const cancelled = params.get("stripe_cancelled");
    const cleanUrl = () =>
      window.history.replaceState({}, "", `/${countryCode}/checkout`);

    if (cancelled) {
      cleanUrl();
      toast({
        variant: "destructive",
        title: "Payment Cancelled",
        description: "Your card payment was cancelled. The order is unpaid — you can try again.",
      });
      return;
    }

    // PayU return: the order-service already verified the SHA-512 reverse hash and settled the order
    // before redirecting here. We re-fetch to confirm 'paid' (restore the session first) before showing
    // success — never trust the URL flag alone.
    const payu = params.get("payu");
    if (payu) {
      cleanUrl();
      if (payu === "success" && orderId) {
        setIsSettling(true);
        authClient
          .bootstrap()
          .catch(() => {})
          .then(() => orderApi.get(orderId))
          .then((r) => {
            if (r.ok && r.data.paymentStatus === "paid") {
              finalizeSuccess(r.data);
            } else {
              setIsSettling(false);
              toast({
                variant: "destructive",
                title: "Payment Pending",
                description:
                  "We haven't confirmed your PayU payment yet. If you were charged, your order will update shortly — check My Orders.",
              });
            }
          })
          .catch(() => {
            setIsSettling(false);
            toast({ variant: "destructive", title: "Payment Error", description: "Could not verify your PayU payment." });
          });
      } else {
        toast({
          variant: "destructive",
          title: payu === "cancelled" ? "Payment Cancelled" : "Payment Failed",
          description: "Your PayU payment did not complete. The order is unpaid — you can try again.",
        });
      }
      return;
    }

    if (!session || !orderId) return;

    setIsSettling(true);
    // The in-memory access token is lost across the full-page Stripe redirect — restore it from the
    // httpOnly refresh cookie so the ownership check on confirm passes for a signed-in shopper.
    authClient
      .bootstrap()
      .catch(() => {})
      .then(() => orderApi.confirmPayment(orderId, session, { gateway: "stripe" }))
      .then((confirmed) => {
        cleanUrl();
        if (confirmed.ok && confirmed.data.paymentStatus === "paid") {
          finalizeSuccess(confirmed.data);
        } else {
          setIsSettling(false);
          toast({
            variant: "destructive",
            title: "Payment Not Completed",
            description: confirmed.ok
              ? "We couldn't confirm your Stripe payment. If you were charged, contact our concierge."
              : confirmed.error.message,
          });
        }
      })
      .catch((err) => {
        cleanUrl();
        setIsSettling(false);
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: err instanceof Error ? err.message : "Could not verify the Stripe payment.",
        });
      });
    // Runs once on mount to handle the Stripe return; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Optional gift note / instructions → persisted on the order metadata.
        ...(giftNote.trim() ? { note: giftNote.trim() } : {}),
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

      // ── Stripe (hosted Checkout): the order exists but is UNPAID. Redirect to the Stripe-hosted
      // card page; on return we verify the session against Stripe SERVER-SIDE (see the stripe-return
      // effect) and only then show success. Never a client-trusted "paid". ──────────────────────────
      if (intent?.redirectUrl) {
        window.location.href = intent.redirectUrl;
        return;
      }

      // ── PayU (international cards): the order is UNPAID. Build the signed form and POST it to PayU's
      // hosted page. PayU posts the result back to the order-service return route (SHA-512 reverse-hash
      // verified) which settles the order and redirects here with ?payu=success|failed. ──────────────
      if (intent?.formPost) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = intent.formPost.action;
        Object.entries(intent.formPost.fields).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      // ── Bank transfer / concierge: the order is PLACED + RESERVED but intentionally UNPAID. Show the
      // real wire instructions; finance confirms the transfer out-of-band. Never auto-confirm. This is
      // also the clean path for high-value pieces that exceed a card gateway's limit. ────────────────
      if (intent?.instructions || selectedGateway === "BANK_TRANSFER") {
        setBankInstructions(
          intent?.instructions ||
            "Your order is reserved. Our concierge will email you the bank-transfer details and your payment reference shortly."
        );
        finalizeSuccess(order);
        return;
      }

      // ── Gateway path (Razorpay): the order exists but is UNPAID. Open the
      // provider checkout and finalize only after a SERVER-VERIFIED capture.
      // Bank transfer never carries an intent → it falls through to the
      // pending/mock success path below, unchanged. ──────────────────────────
      if (intent?.keyId && intent.amount != null && intent.currency) {
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
          theme: { color: "#7E3F98" }, // on-brand plum
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
                title: "Payment Failed",
                description: confirmed.ok
                  ? "Payment could not be verified. Please try again."
                  : confirmed.error.message,
              });
            } catch (confirmErr) {
              setIsSettling(false);
              toast({
                variant: "destructive",
                title: "Payment Failed",
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
          <AlertTriangle className="w-16 h-16" strokeWidth={1.25} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-headline tracking-tight">
            Checkout Unavailable
          </h1>
          <p className="text-gray-500 font-light max-w-md mx-auto">
            Our catalog is temporarily offline. Browsing remains available;
            checkout is disabled until the registry is restored.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${countryCode}`)}
          size="lg"
          className="rounded-none bg-black hover:bg-plum px-16 h-14 text-[10px] font-bold uppercase tracking-[0.35em]"
        >
          Return to Maison
        </Button>
      </div>
    );
  }

  if (fraudBlocked) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-10 animate-fade-in text-center">
        <div className="p-12 bg-red-50 border border-red-100 rounded-full text-red-600">
          <AlertTriangle className="w-16 h-16" strokeWidth={1.25} />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-headline tracking-tight">
            Order on Hold
          </h1>
          <p className="text-gray-500 font-light max-w-md mx-auto">
            For your security, this order requires a private conversation with
            our concierge before it can be completed.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${countryCode}/contact`)}
          size="lg"
          className="rounded-none bg-black hover:bg-plum px-16 h-14 text-[10px] font-bold uppercase tracking-[0.35em] transition-all"
        >
          Contact Concierge
        </Button>
      </div>
    );
  }

  if (cart.length === 0 && !selectedPlan && step !== 3) {
    return null;
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 md:px-12 py-8 md:py-20 max-w-7xl animate-fade-in font-body">
        {/* Razorpay Checkout — loaded once so the provider popup is ready by the
            time the shopper reaches the payment step. Only opened on the
            gateway path (see handlePlaceOrder). */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* Step indicator */}
        <div className="flex justify-center items-center gap-4 md:gap-10 mb-12 md:mb-20">
          <ProtocolStep num={1} label="Shipping" active={step === 1} completed={step > 1} />
          <div className={cn("w-10 md:w-20 h-px transition-colors duration-700", step > 1 ? "bg-plum" : "bg-border")} />
          <ProtocolStep num={2} label="Payment" active={step === 2} completed={step > 2} />
          <div className={cn("w-10 md:w-20 h-px transition-colors duration-700", step > 2 ? "bg-plum" : "bg-border")} />
          <ProtocolStep num={3} label="Confirmation" active={step === 3} completed={step === 3} />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {step < 3 ? (
            <>
              <div className="flex-1 w-full space-y-12">
                {step === 1 && (
                  <div className="space-y-10 animate-fade-in">
                    <div className="space-y-2">
                      <h2 className="text-3xl md:text-4xl font-headline tracking-tight">
                        Shipping Details
                      </h2>
                      <p className="text-sm text-gray-500 font-light">
                        Where shall we deliver your pieces?
                      </p>
                    </div>

                    {usingSavedSummary ? (
                      /* Signed-in shopper with a saved address: tasteful summary +
                         optional selector + "use a different address" escape hatch. */
                      <div className="space-y-8 animate-fade-in">
                        <fieldset className="border border-border bg-ivory/40 p-7 space-y-6">
                          <legend className="px-3 text-[9px] font-bold uppercase tracking-[0.3em] text-plum flex items-center gap-2">
                            <Truck className="w-3 h-3" />
                            <span>Deliver To</span>
                          </legend>

                          {savedAddresses.length > 1 && (
                            <div className="space-y-3">
                              <Label
                                htmlFor="saved-address-select"
                                className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                              >
                                Saved Addresses
                              </Label>
                              <select
                                id="saved-address-select"
                                className="w-full rounded-none border border-border bg-white h-12 px-4 py-3 text-sm focus:border-plum focus:outline-none"
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

                          <address className="not-italic space-y-1 text-sm text-gray-800 font-light">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label
                              htmlFor="checkout-first-name"
                              className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                            >
                              First Name
                            </Label>
                            <Input
                              id="checkout-first-name"
                              autoComplete="given-name"
                              aria-required="true"
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="Julian"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label
                              htmlFor="checkout-last-name"
                              className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                            >
                              Last Name
                            </Label>
                            <Input
                              id="checkout-last-name"
                              autoComplete="family-name"
                              aria-required="true"
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="Vandervilt"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2.5">
                            <Label
                              htmlFor="checkout-email"
                              className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                            >
                              Email Address
                            </Label>
                            <Input
                              id="checkout-email"
                              type="email"
                              inputMode="email"
                              autoComplete="email"
                              aria-required="true"
                              aria-invalid={email.trim() !== "" && !isEmailValid}
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className="text-[11px] text-gray-400 font-light">
                              {email.trim() !== "" && !isEmailValid
                                ? "Please enter a valid email address."
                                : "For your order confirmation and tracking — no account required."}
                            </p>
                          </div>

                          <div className="md:col-span-2 space-y-2.5">
                            <Label
                              htmlFor="checkout-address1"
                              className="text-[10px] uppercase font-bold tracking-widest text-slate-500"
                            >
                              Address
                            </Label>
                            <Input
                              id="checkout-address1"
                              autoComplete="address-line1"
                              aria-required="true"
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="730 Fifth Avenue"
                              value={address1}
                              onChange={(e) => setAddress1(e.target.value)}
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="Penthouse 12B"
                              value={address2}
                              onChange={(e) => setAddress2(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="New York"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="NY"
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                            />
                          </div>

                          <div className="space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
                              placeholder="10019"
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm uppercase focus:border-plum"
                              placeholder="US"
                              value={addrCountryCode}
                              onChange={(e) =>
                                setAddrCountryCode(
                                  e.target.value.toUpperCase().slice(0, 2)
                                )
                              }
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2.5">
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
                              className="rounded-none border-border bg-ivory/30 h-12 py-3 text-sm focus:border-plum"
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
                            Complete the required fields to continue.
                          </p>
                        )}

                        {isSignedIn && (
                          <label className="flex items-center gap-3 cursor-pointer select-none">
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
                      className="h-16 px-16 w-full bg-black text-white hover:bg-plum rounded-none text-[11px] font-bold tracking-[0.35em] uppercase transition-all disabled:opacity-30"
                      onClick={handleLockInventory}
                      disabled={!isAddressComplete}
                    >
                      Continue to Payment{" "}
                      <ArrowRight className="ml-4 w-4 h-4" />
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-10 animate-fade-in">
                    <div className="space-y-2">
                      <h2 className="text-3xl md:text-4xl font-headline tracking-tight">
                        Payment
                      </h2>
                      <p className="text-sm text-gray-500 font-light">
                        Choose how you'd like to pay. All transactions are encrypted.
                      </p>
                    </div>

                    {inventoryLockId && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-emerald-600">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Your pieces are reserved
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-400">
                          <Lock className="w-3 h-3" />
                          <span>Rate locked @ {lockedFXRate?.toFixed(4)}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <GatewayCard
                        id="STRIPE"
                        label="Card"
                        desc="Visa, Mastercard, Amex, Apple Pay"
                        icon={<CreditCard className="w-5 h-5" />}
                        active={selectedGateway === "STRIPE"}
                        onClick={() => setSelectedGateway("STRIPE")}
                      />
                      <GatewayCard
                        id="RAZORPAY"
                        label="UPI & Netbanking"
                        desc="Razorpay · UPI, Netbanking, Cards"
                        icon={<Smartphone className="w-5 h-5" />}
                        active={selectedGateway === "RAZORPAY"}
                        onClick={() => setSelectedGateway("RAZORPAY")}
                      />
                      <GatewayCard
                        id="PAYU"
                        label="International"
                        desc="PayU · Cards & wallets worldwide"
                        icon={<Globe className="w-5 h-5" />}
                        active={selectedGateway === "PAYU"}
                        onClick={() => setSelectedGateway("PAYU")}
                      />
                      <GatewayCard
                        id="BANK_TRANSFER"
                        label="Bank Transfer"
                        desc="Wire / ACH · settles in 2–3 days"
                        icon={<Building2 className="w-5 h-5" />}
                        active={selectedGateway === "BANK_TRANSFER"}
                        onClick={() => setSelectedGateway("BANK_TRANSFER")}
                      />
                    </div>

                    <div className="flex flex-col gap-5">
                      <Button
                        disabled={isSettling}
                        className="w-full h-16 bg-plum text-white hover:bg-black rounded-none text-[11px] font-bold tracking-[0.35em] uppercase transition-all disabled:opacity-60"
                        onClick={handlePlaceOrder}
                      >
                        {isSettling
                          ? "Processing…"
                          : `Place Order — ${renderAmount(totalYield)}`}
                      </Button>
                      <button
                        onClick={() => setStep(1)}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors self-center"
                      >
                        ← Back to Shipping
                      </button>
                      <p className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                        <Lock className="w-3 h-3" /> Secured with 256-bit SSL encryption
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <aside className="lg:w-[380px] w-full shrink-0 lg:sticky lg:top-32">
                <div className="bg-ivory/40 p-6 md:p-8 border border-border space-y-7 rounded-none">
                  <h3 className="text-lg font-headline uppercase tracking-[0.2em] border-b border-border pb-5">
                    Order Summary
                  </h3>

                  <div className="space-y-5 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {taxCalculation.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 group">
                        <div className="relative w-16 h-20 border border-border bg-white shrink-0 overflow-hidden">
                          {item.itemImage ? (
                            <BrandImage
                              src={item.itemImage}
                              alt={item.itemName}
                              variant="compact"
                              className="w-full h-full"
                              imgClassName="object-contain p-1.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gold">
                              <BadgeCheck className="w-5 h-5" />
                            </div>
                          )}
                          {item.itemQty > 1 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-plum text-white text-[9px] font-bold flex items-center justify-center">
                              {item.itemQty}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1 py-0.5">
                          <span className="block font-semibold text-sm text-gray-900 group-hover:text-plum transition-colors truncate">
                            {item.itemName}
                          </span>
                          {item.taxRate > 0 && item.taxType && (
                            <span className="block text-[9px] text-plum font-bold uppercase tracking-wide">
                              {item.taxInclusive
                                ? `incl. ${item.taxRate}% ${item.taxType}`
                                : `+${item.taxRate}% ${item.taxType}`}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-sm tabular whitespace-nowrap pl-2">
                          {renderAmount(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {giftNote.trim() && (
                    <div className="border border-border bg-white p-4 space-y-1.5">
                      <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-plum">
                        <Gift className="w-3 h-3" /> Gift Note
                      </p>
                      <p className="text-xs text-gray-600 font-light leading-relaxed line-clamp-3">
                        {giftNote.trim()}
                      </p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-border space-y-3.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900 font-semibold tabular">
                        {renderAmount(taxCalculation.subtotal)}
                      </span>
                    </div>
                    {taxCalculation.totalTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{marketTaxInclusive ? "Included Tax" : "Tax"}</span>
                        <span className="text-gray-900 font-semibold tabular">
                          {marketTaxInclusive ? "" : "+"}
                          {renderAmount(taxCalculation.totalTax)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-plum font-bold uppercase tracking-widest text-[10px]">Complimentary</span>
                    </div>
                    <div className="flex justify-between items-end pt-5 border-t border-border">
                      <span className="text-lg font-headline tracking-tight">Total</span>
                      <div className="text-right">
                        <div className="text-3xl font-semibold tabular leading-none">
                          {renderAmount(totalYield)}
                        </div>
                        {taxCalculation.totalTax > 0 && (
                          <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                            {marketTaxInclusive ? "Inclusive of tax" : "Plus tax"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trust footer */}
                  <div className="pt-5 border-t border-border flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3 text-gold" /> Authentic</span>
                    <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-gold" /> Secure</span>
                    <span className="flex items-center gap-1.5"><Truck className="w-3 h-3 text-gold" /> Insured</span>
                  </div>
                </div>
              </aside>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-20 md:py-28 space-y-12 animate-fade-in text-center max-w-3xl mx-auto">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Check className="w-14 h-14 text-emerald-500 stroke-[2.5px]" />
                </div>
                <div className="absolute -top-3 -right-3 bg-white p-2.5 rounded-full shadow-lg border border-gray-100">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-plum text-[10px] font-bold tracking-[0.5em] uppercase">
                    Thank You
                  </span>
                  <h1 className="text-5xl md:text-6xl font-headline tracking-tight text-gray-900">
                    Order Confirmed
                  </h1>
                </div>
                <p className="text-lg text-gray-500 font-light max-w-xl mx-auto leading-relaxed">
                  Your pieces have been secured.{" "}
                  {bankInstructions
                    ? "Your order is reserved — complete the bank transfer below to finalize it."
                    : "A private curator from our atelier will be in touch shortly to arrange your white-glove delivery."}
                </p>
              </div>

              <div className="pt-10 border-t border-border w-full max-w-lg space-y-8">
                <div className="bg-ivory/50 p-7 border border-border flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Order Number
                    </span>
                    <span className="font-mono text-lg font-bold uppercase tracking-tight text-gray-900">
                      {orderNumberRef || orderRef || "…"}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-border rounded-full text-plum">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                </div>

                {bankInstructions && (
                  <div className="bg-plum/5 border border-plum/20 p-7 text-left space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-plum flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Bank Transfer Instructions
                    </span>
                    <p className="text-sm text-gray-700 font-light leading-relaxed whitespace-pre-line">
                      {bankInstructions}
                    </p>
                    <p className="text-[11px] text-gray-400 italic">
                      Your pieces remain reserved until we confirm your transfer.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() =>
                      router.push(`/${countryCode}/account/acquisitions`)
                    }
                    variant="outline"
                    className="h-14 rounded-none border-black text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black hover:text-white"
                  >
                    View My Orders
                  </Button>
                  <Button
                    onClick={() => router.push(`/${countryCode}`)}
                    className="h-14 rounded-none bg-black text-white hover:bg-plum text-[10px] font-bold tracking-[0.3em] uppercase"
                  >
                    Continue Shopping
                  </Button>
                </div>

                {/* Guest-friendly: track this order anytime with the order number + email (no account). */}
                {orderNumberRef && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/${countryCode}/track-order?order=${encodeURIComponent(orderNumberRef)}&email=${encodeURIComponent(email)}`
                      )
                    }
                    className="mx-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 hover:text-plum transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" /> Track Your Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
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
        "flex items-center gap-3 transition-all duration-500",
        active ? "text-black" : completed ? "text-plum" : "text-gray-300"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-500",
          active
            ? "border-black bg-black text-white"
            : completed
            ? "border-plum bg-plum/5 text-plum"
            : "border-border bg-transparent text-gray-300"
        )}
      >
        {completed && !active ? <Check className="w-4 h-4 stroke-[3px]" /> : num}
      </div>
      <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.25em]">
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
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-5 border text-left flex flex-col gap-3 transition-all",
        active
          ? "border-plum bg-plum/5"
          : "border-border bg-white hover:border-plum/40"
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
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
    </button>
  );
}
