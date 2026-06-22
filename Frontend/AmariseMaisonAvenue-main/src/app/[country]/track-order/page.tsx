"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Loader2,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { orderApi, type OrderTrackingView, type OrderStatus } from "@/lib/api-client";
import { normalizeCountry, formatAmount } from "@/lib/i18n/countries";
import type { CountryCode } from "@/lib/types";

// The fulfilment journey, in order. cancelled / refunded are handled separately (not on the rail).
const FLOW: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Preparing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: ShieldCheck },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Only allow http(s) carrier tracking links — never a javascript:/data: scheme in an href.
function safeHttpUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

function PaymentBadge({ status }: { status: OrderTrackingView["paymentStatus"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    authorized: { label: "Authorized", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Awaiting Payment", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    partially_paid: { label: "Partially Paid", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    failed: { label: "Payment Failed", cls: "bg-red-50 text-red-700 border-red-200" },
    refunded: { label: "Refunded", cls: "bg-gray-100 text-gray-600 border-gray-200" },
    voided: { label: "Voided", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-3 py-1 border text-[9px] font-bold uppercase tracking-[0.2em]", s.cls)}>
      {s.label}
    </span>
  );
}

function StatusRail({ view }: { view: OrderTrackingView }) {
  const terminal = view.status === "cancelled" || view.status === "refunded";
  if (terminal) {
    const isCancelled = view.status === "cancelled";
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-6 border",
          isCancelled ? "bg-red-50/60 border-red-100" : "bg-gray-50 border-gray-200"
        )}
      >
        <XCircle className={cn("w-8 h-8 shrink-0", isCancelled ? "text-red-500" : "text-gray-400")} />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900">
            {isCancelled ? "Order Cancelled" : "Order Refunded"}
          </p>
          <p className="text-xs text-gray-500 font-light mt-1">
            {isCancelled
              ? "This order was cancelled. Any authorized payment has been released."
              : "This order has been refunded. Please allow a few business days for funds to settle."}
          </p>
        </div>
      </div>
    );
  }

  const activeIndex = FLOW.findIndex((s) => s.key === view.status);
  return (
    <div className="flex items-start justify-between gap-1">
      {FLOW.map((step, i) => {
        const done = i <= activeIndex;
        const current = i === activeIndex;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                  done ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-300",
                  current && "ring-4 ring-gold/20"
                )}
              >
                <StepIcon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-center",
                  done ? "text-gray-900" : "text-gray-300"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div className={cn("h-px flex-1 mt-5", i < activeIndex ? "bg-black" : "bg-gray-200")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function TrackOrderPage() {
  const { country } = useParams();
  const searchParams = useSearchParams();
  const countryCode = normalizeCountry(country as string) as CountryCode;

  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<OrderTrackingView | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const orderValid = orderNumber.trim().length >= 3;
  const canSubmit = emailValid && orderValid && !isLoading;

  const runLookup = useCallback(async (lookupEmail: string, lookupOrder: string) => {
    setIsLoading(true);
    setError(null);
    setView(null);
    const res = await orderApi.lookup(lookupEmail.trim(), lookupOrder.trim());
    if (res.ok) {
      setView(res.data);
    } else {
      // A wrong email / unknown number returns a uniform 404 — present one calm, non-leaky message.
      setError(
        res.error.code === 404
          ? "We couldn't find an order matching that email and order number. Please double-check both and try again."
          : "Something went wrong looking up your order. Please try again in a moment."
      );
    }
    setIsLoading(false);
  }, []);

  // Deep-link prefill (e.g. from the confirmation page): /track-order?order=ORD-...&email=...
  useEffect(() => {
    const qOrder = searchParams.get("order") || searchParams.get("orderNumber") || "";
    const qEmail = searchParams.get("email") || "";
    if (qOrder) setOrderNumber(qOrder);
    if (qEmail) setEmail(qEmail);
    if (qOrder && qEmail && EMAIL_RE.test(qEmail.trim())) {
      runLookup(qEmail, qOrder);
    }
    // Run once on mount from the URL; subsequent lookups are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    runLookup(email, orderNumber);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <span className="text-plum text-[10px] font-bold tracking-[0.5em] uppercase">Order Tracking</span>
          <h1 className="text-4xl md:text-5xl font-headline tracking-tight text-gray-900">Track Your Order</h1>
          <p className="text-base text-gray-500 font-light max-w-xl mx-auto leading-relaxed">
            Enter the email you used at checkout and the order number from your confirmation to follow your
            acquisition — no account required.
          </p>
        </div>

        {/* Lookup form */}
        <form onSubmit={handleSubmit} className="bg-ivory/40 border border-border p-6 sm:p-8 space-y-6" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="track-email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Email Address
              </Label>
              <Input
                id="track-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={touched && !emailValid}
                className="h-12 rounded-none border-gray-300 focus-visible:ring-gold"
              />
              {touched && !emailValid && (
                <p className="text-[11px] text-red-500">Please enter the email used at checkout.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="track-order" className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                Order Number
              </Label>
              <Input
                id="track-order"
                type="text"
                autoComplete="off"
                placeholder="ORD-XXXX-XXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                aria-invalid={touched && !orderValid}
                className="h-12 rounded-none border-gray-300 font-mono uppercase tracking-tight focus-visible:ring-gold"
              />
              {touched && !orderValid && (
                <p className="text-[11px] text-red-500">Enter the order number from your confirmation.</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-14 rounded-none bg-black text-white hover:bg-plum text-[10px] font-bold tracking-[0.3em] uppercase disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Track Order
              </span>
            )}
          </Button>

          {error && (
            <div className="flex items-start gap-3 bg-red-50/60 border border-red-100 p-4" role="alert">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-light">{error}</p>
            </div>
          )}
        </form>

        {/* Result */}
        {view && (
          <section className="mt-12 space-y-8 animate-fade-in" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-border">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Order Number</span>
                <p className="font-mono text-xl font-bold uppercase tracking-tight text-gray-900">{view.orderNumber}</p>
                <p className="text-xs text-gray-400 font-light">Placed {formatDate(view.placedAt)}</p>
              </div>
              <PaymentBadge status={view.paymentStatus} />
            </div>

            <StatusRail view={view} />

            {/* Parcel tracking — shown once a shipment exists */}
            {view.shipment && (
              <div className="border border-border bg-ivory/40 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gold" /> Parcel Tracking
                  </span>
                  {view.shipment.estimatedDelivery && (
                    <span className="text-[11px] text-gray-500 font-light">
                      Est. delivery {formatDate(view.shipment.estimatedDelivery)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-1">
                    {view.shipment.carrier && (
                      <p className="text-sm font-medium text-gray-900">{view.shipment.carrier}</p>
                    )}
                    {view.shipment.trackingNumber && (
                      <p className="font-mono text-sm text-gray-700">{view.shipment.trackingNumber}</p>
                    )}
                    {view.shipment.lastUpdate && (
                      <p className="text-[11px] text-gray-400 font-light">
                        {view.shipment.lastUpdate.message || view.shipment.lastUpdate.status}
                        {view.shipment.lastUpdate.location ? ` · ${view.shipment.lastUpdate.location}` : ""}
                        {` · ${formatDate(view.shipment.lastUpdate.at)}`}
                      </p>
                    )}
                  </div>
                  {safeHttpUrl(view.shipment.trackingUrl) && (
                    <a
                      href={safeHttpUrl(view.shipment.trackingUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-plum hover:underline"
                    >
                      Track Parcel <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="border border-border">
              <div className="px-5 py-3 border-b border-border bg-ivory/40">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">Your Pieces</h2>
              </div>
              <ul className="divide-y divide-border">
                {view.items.map((item, i) => (
                  <li key={`${item.sku}-${i}`} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 font-light">
                        {item.variantName ? `${item.variantName} · ` : ""}Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatAmount(item.total, view.currencyCode, countryCode, { withDecimals: true })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totals + destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatAmount(view.subtotal, view.currencyCode, countryCode, { withDecimals: true })} />
                {view.discountAmount > 0 && (
                  <Row label="Discount" value={`– ${formatAmount(view.discountAmount, view.currencyCode, countryCode, { withDecimals: true })}`} />
                )}
                <Row label="Shipping" value={view.shippingAmount > 0 ? formatAmount(view.shippingAmount, view.currencyCode, countryCode, { withDecimals: true }) : "Complimentary"} />
                <Row label="Tax" value={formatAmount(view.taxAmount, view.currencyCode, countryCode, { withDecimals: true })} />
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatAmount(view.totalAmount, view.currencyCode, countryCode, { withDecimals: true })}
                  </span>
                </div>
              </div>

              {(view.shipTo.city || view.shipTo.countryCode) && (
                <div className="bg-ivory/40 border border-border p-5 space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold" /> Shipping To
                  </span>
                  <p className="text-sm text-gray-700 font-light">
                    {[view.shipTo.city, view.shipTo.countryCode].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-[11px] text-gray-400 italic">
                    Full delivery details are kept private for your security.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href={`/${countryCode}/customer-service`}
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 hover:text-plum transition-colors flex items-center gap-1.5"
              >
                Need help with this order <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* Footer assurance */}
        {!view && (
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-400 font-light">
              Have an account?{" "}
              <Link href={`/${countryCode}/account/acquisitions`} className="text-plum hover:underline font-medium">
                View all your orders
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 font-light">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
