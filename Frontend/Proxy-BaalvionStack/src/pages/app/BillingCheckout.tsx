import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";
import {
  CreditCard, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Ban, Tag, Globe, Smartphone, Server, Landmark, Clock, Building2,
} from "lucide-react";
import { usePlans } from "@/hooks/usePlatform";
import { Plan, billingApi } from "@/lib/platformClient";
import { startGatewayCheckout, type GatewayProvider } from "@/lib/gatewayCheckout";
import { PaymentForms, emptyPayment, type PaymentState } from "@/components/billing/PaymentForms";
import { validateCard } from "@/lib/payment/cards";
import { cn } from "@/lib/utils";

/** Branch validation on the selected payment method. Empty map = valid. */
function validatePayment(payment: PaymentState): Record<string, string> {
  switch (payment.method) {
    case "card":
      return validateCard(payment.card);
    case "wallet":
      return payment.wallet ? {} : { wallet: "Select a wallet to continue." };
    case "bank": {
      const errors: Record<string, string> = {};
      if (!payment.bank.remitterName.trim()) errors.remitterName = "Account holder name is required.";
      if (!payment.bank.remitterCountry.trim()) errors.remitterCountry = "Country is required.";
      return errors;
    }
    case "wire": {
      const errors: Record<string, string> = {};
      if (!payment.wire.company.trim()) errors.company = "Company name is required.";
      const email = payment.wire.contactEmail.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = "Enter a valid contact email.";
      return errors;
    }
    default:
      return {};
  }
}

const PAYMENT_LABEL: Record<PaymentState["method"], string> = {
  card: "Card",
  wallet: "Digital wallet",
  bank: "Bank transfer",
  wire: "Wire / invoice",
};

const steps = ["Select Plan", "Payment Details", "Confirm & Pay"];

const typeIcon = (slug: string) => {
  if (slug.includes("mobile")) return <Smartphone className="w-5 h-5" />;
  if (slug.includes("dc") || slug.includes("datacenter")) return <Server className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

type ResultType = "success" | "failure" | "error" | "bank_pending" | "wire_submitted";

export default function BillingCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const planParam = searchParams.get("plan");
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [creditAmount, setCreditAmount] = useState(30); // PAYG prepaid top-up (USD)
  const [payment, setPayment] = useState<PaymentState>(emptyPayment);
  // Settlement gateway for card/wallet payments — the shopper's choice, forwarded to the PSP.
  const [gateway, setGateway] = useState<GatewayProvider>("razorpay");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const { data: plans, isLoading: loadingPlans } = usePlans();

  // Pre-select the plan chosen on /pricing (carried as ?plan=<slug>) and jump
  // the user straight to the payment step — they already picked their plan.
  useEffect(() => {
    if (!planParam || selectedPlan || !plans?.length) return;
    const match = plans.find((p) => p.slug === planParam);
    if (match) {
      setSelectedPlan(match);
      setStep(1);
    }
  }, [planParam, plans, selectedPlan]);

  // Pay-As-You-Go is metered: the customer buys prepaid credit (drawn down at $3/GB)
  // instead of a fixed monthly subscription.
  const isPayg = selectedPlan?.slug === "pay-as-you-go";
  const USD_PER_GB = 3;
  const creditPresets = [15, 30, 60, 150];

  const basePrice = selectedPlan ? (interval === "yearly" ? selectedPlan.monthlyPrice * 10 : selectedPlan.monthlyPrice) : 0;
  const discount = !isPayg && couponApplied ? basePrice * 0.1 : 0;
  const total = isPayg ? creditAmount : basePrice - discount;

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const payErrors = useMemo(() => validatePayment(payment), [payment]);
  const payValid = Object.keys(payErrors).length === 0;

  // Capture the newest invoice (created by activation / the pending order) so the
  // "Download Invoice" button fetches the REAL server-generated document instead of a
  // client-built summary.
  const captureLatestInvoice = async () => {
    try {
      const res = await billingApi.getInvoices({ page: 1 });
      const list: Array<{ id: string }> = Array.isArray(res)
        ? res
        : ((res as { data?: Array<{ id: string }> })?.data ?? []);
      if (list[0]?.id) setInvoiceId(String(list[0].id));
    } catch { /* download will fall back to the client-side summary */ }
  };

  // Activate the subscription server-side (trial → active) and refresh entitlements.
  // We only show "Payment Successful" when the backend confirms an ACTIVE
  // subscription — never on a swallowed error (a customer must not see success
  // while getting nothing).
  const activateAndFinish = async () => {
    if (!selectedPlan) return;
    try {
      if (isPayg) {
        // PAYG: add the prepaid credit (server also ensures the PAYG subscription).
        const res = await billingApi.buyCredit(creditAmount);
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        if (res && typeof res.balanceUsd === "number") {
          setResult("success");
        } else {
          setErrorMessage("Your payment was captured but credit could not be added. Please contact support.");
          setResult("failure");
        }
        return;
      }
      const sub = await billingApi.activate(selectedPlan.slug, total, interval);
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      if ((sub as { status?: string } | null)?.status === "active") {
        await captureLatestInvoice();
        setResult("success");
      } else {
        setErrorMessage("Your payment was captured but the plan could not be activated. Please contact support — you have not been charged twice.");
        setResult("failure");
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Could not complete your purchase. Please contact support.");
      setResult("failure");
    }
  };

  const handlePay = async () => {
    if (!selectedPlan || !payValid) return;

    // Bank transfer and wire/invoice are NOT charged here — they are recorded as
    // pending orders and settled offline. No gateway call, no plan activation yet.
    if (payment.method === "bank" || payment.method === "wire") {
      setProcessing(true);
      try {
        const order = await billingApi.createOrder({
          planSlug: selectedPlan.slug,
          method: payment.method,
          interval,
          amount: total,
        });
        if (order?.invoice?.id) setInvoiceId(String(order.invoice.id));
        queryClient.invalidateQueries({ queryKey: ["billing"] });
        setResult(payment.method === "bank" ? "bank_pending" : "wire_submitted");
      } catch (e: unknown) {
        setErrorMessage(e instanceof Error ? e.message : "Could not record your order. Please try again.");
        setResult("failure");
      } finally {
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    try {
      // Card + wallet: hand off to the provider's hosted checkout via payment-service.
      // SECURITY: raw card data is NEVER passed — only the cardholder/company name as
      // the customer name. Wallets go through the SAME gateway (the provider's hosted
      // page shows the chosen wallet). In production the authoritative result also
      // arrives via the provider webhook → payment-service ledger; here we activate on
      // the client-confirmed success too (idempotent).
      const customerName = payment.card.name || payment.companyName;
      let paid = false;
      try {
        const res = await startGatewayCheckout({
          provider: gateway,
          method: "CARD",
          amount: Math.round(total * 100), // minor units
          currency: "USD",
          idempotencyKey: `${selectedPlan.slug}-${interval}-${Date.now()}`,
          receipt: orderId,
          customer: customerName ? { name: customerName } : undefined,
        });
        if (res.status === "success") paid = true;
        else if (res.status === "redirecting") return; // browser is leaving for the hosted page; settle via webhook
        else if (res.status === "cancelled") return; // stay on confirm so they can retry
        // A genuine decline/failure is shown as a failure in ALL environments —
        // never auto-"paid" (that would let a declined card activate a plan).
        else { setErrorMessage(res.message || "Payment was not completed."); setResult("failure"); return; }
      } catch (e: unknown) {
        // Gateway threw → no payment provider is configured for this site. Only in
        // local DEV do we simulate so the flow stays testable; any other build
        // surfaces the real error. Production must configure a provider.
        if (import.meta.env.DEV) paid = true;
        else throw e;
      }
      if (paid) await activateAndFinish();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Could not start checkout");
      setResult("failure");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    // Prefer the REAL, server-generated invoice document (built from the stored DB record).
    if (invoiceId) {
      try {
        const doc = await billingApi.getInvoiceDocument(invoiceId);
        if (doc?.content) {
          const blob = new Blob([doc.content], { type: doc.contentType || "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = doc.filename || `invoice-${orderId}.txt`; a.click();
          URL.revokeObjectURL(url);
          return;
        }
      } catch { /* fall back to the client-side summary below */ }
    }
    const content = `
INVOICE — BAALVION NETSTACK
============================
Invoice #: INV-${Date.now().toString(36).toUpperCase()}
Order ID:  ${orderId}
Date:      ${new Date().toLocaleDateString()}

ITEMS:
${selectedPlan?.name} (${interval})    $${basePrice.toFixed(2)}
${couponApplied ? `Discount (10%)                        -$${discount.toFixed(2)}` : ""}
----------------------------
TOTAL:                                $${total.toFixed(2)}

Payment Status: PAID
Thank you for your business!
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `invoice-${orderId}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <div className="space-y-6">
        <SEOHead title="Payment Result" description="Payment processing result" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              {result === "success" && (
                <>
                  <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
                  <h2 className="text-2xl font-bold">Payment Successful!</h2>
                  <p className="text-muted-foreground">
                    {isPayg
                      ? `$${creditAmount.toFixed(2)} credit added — ${(creditAmount / USD_PER_GB).toFixed(1)} GB at $${USD_PER_GB}/GB.`
                      : `Your subscription to ${selectedPlan?.name} is now active.`}
                  </p>
                  <div className="border border-border rounded-lg p-4 text-left space-y-2 mt-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order ID</span><span className="font-mono text-xs">{orderId}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{isPayg ? "Pay As You Go" : selectedPlan?.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-medium">${total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isPayg ? "Credit / GB" : "Billing"}</span><span className="capitalize">{isPayg ? `${(creditAmount / USD_PER_GB).toFixed(1)} GB` : interval}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span>{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="success">Paid</Badge></div>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={handleDownloadInvoice}>Download Invoice</Button>
                    <Button onClick={() => navigate("/app")}>Go to Dashboard</Button>
                  </div>
                </>
              )}
              {result === "failure" && (
                <>
                  <Ban className="w-16 h-16 text-destructive mx-auto" />
                  <h2 className="text-2xl font-bold">Payment Failed</h2>
                  <p className="text-muted-foreground">{errorMessage || "Unable to process your payment. Please try again."}</p>
                  <div className="border border-border rounded-lg p-4 text-left space-y-2 mt-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order ID</span><span className="font-mono text-xs">{orderId}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="destructive">Failed</Badge></div>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={() => { setResult(null); setStep(1); }}>Try Again</Button>
                    <Button variant="outline" onClick={() => navigate("/app")}>Go to Dashboard</Button>
                  </div>
                </>
              )}
              {result === "bank_pending" && (
                <>
                  <Landmark className="w-16 h-16 text-primary mx-auto" />
                  <h2 className="text-2xl font-bold">Order Received</h2>
                  <p className="text-muted-foreground">
                    We've emailed a pro-forma invoice with Baalvion's receiving bank details and your
                    unique reference. Your subscription activates once we confirm your transfer —
                    typically 1-2 business days.
                  </p>
                  <div className="border border-border rounded-lg p-4 text-left space-y-2 mt-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{orderId}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{isPayg ? "Pay As You Go" : selectedPlan?.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount due</span><span className="font-medium">${total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Method</span><span>Bank transfer</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="warning">Pending</Badge></div>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    {invoiceId && <Button variant="outline" onClick={handleDownloadInvoice}>Download Invoice</Button>}
                    <Button onClick={() => navigate("/app/billing")}>View Billing</Button>
                    <Button variant="outline" onClick={() => navigate("/app")}>Go to Dashboard</Button>
                  </div>
                </>
              )}
              {result === "wire_submitted" && (
                <>
                  <Building2 className="w-16 h-16 text-primary mx-auto" />
                  <h2 className="text-2xl font-bold">Request Submitted</h2>
                  <p className="text-muted-foreground">
                    Thank you. Our enterprise team will contact you within 1 business day to set up
                    your {payment.wire.terms === "net60" ? "Net 60" : "Net 30"} terms and wire transfer details.
                  </p>
                  <div className="border border-border rounded-lg p-4 text-left space-y-2 mt-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{orderId}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Company</span><span className="font-medium">{payment.wire.company || "—"}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Contact</span><span className="text-xs">{payment.wire.contactEmail || "—"}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Terms</span><span>{payment.wire.terms === "net60" ? "Net 60" : "Net 30"}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant="info"><Clock className="w-3 h-3 mr-1" />Awaiting setup</Badge></div>
                  </div>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button onClick={() => navigate("/app")}>Go to Dashboard</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SEOHead title="Checkout" description="Subscribe to Baalvion NetStack proxy plans" />
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Complete your subscription purchase</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {steps.map((s, i) => (
            <span key={s} className={cn("font-medium", i <= step ? "text-primary" : "text-muted-foreground")}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 0: Plan Selection */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Plan</CardTitle>
                <CardDescription>Choose the proxy plan that fits your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPlans ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(plans ?? []).map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlan(p)}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            selectedPlan?.id === p.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {typeIcon(p.slug)}
                            <span className="font-semibold">{p.name}</span>
                          </div>
                          <div className="text-2xl font-bold">
                            ${p.monthlyPrice}
                            <span className="text-sm text-muted-foreground font-normal">/mo</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{p.bandwidthLimitGb} GB included</p>
                          <div className="space-y-1">
                            {(p.features ?? []).slice(0, 3).map(f => (
                              <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="w-3 h-3 text-success" />{f}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedPlan && (
                      <div className="flex gap-3 pt-2 border-t border-border">
                        <Button
                          variant={interval === "monthly" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInterval("monthly")}
                        >
                          Monthly
                        </Button>
                        <Button
                          variant={interval === "yearly" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setInterval("yearly")}
                        >
                          Yearly <Badge variant="success" className="ml-1 text-[10px]">Save 17%</Badge>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Payment Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Payment Details
                </CardTitle>
                <CardDescription>Enter your payment information</CardDescription>
              </CardHeader>
              <CardContent>
                {isPayg && (
                  <div className="mb-6 space-y-3">
                    <div>
                      <p className="font-medium">Choose your prepaid credit</p>
                      <p className="text-sm text-muted-foreground">Billed at ${USD_PER_GB}/GB · no monthly fee · drawn down as you use bandwidth.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {creditPresets.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCreditAmount(amt)}
                          className={cn(
                            "p-4 rounded-lg border-2 text-center transition-all",
                            creditAmount === amt ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="text-xl font-bold">${amt}</div>
                          <div className="text-xs text-muted-foreground">{Math.round(amt / USD_PER_GB)} GB</div>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">Custom $</Label>
                      <Input
                        type="number"
                        min={5}
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Math.max(5, Number(e.target.value) || 0))}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">= {(creditAmount / USD_PER_GB).toFixed(1)} GB</span>
                    </div>
                  </div>
                )}
                <PaymentForms value={payment} onChange={setPayment} errors={payErrors} />
                {(payment.method === "card" || payment.method === "wallet") && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Payment gateway
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: "razorpay", label: "Razorpay", desc: "Cards · UPI · Netbanking" },
                        { id: "stripe", label: "Stripe", desc: "International cards" },
                        { id: "payu", label: "PayU", desc: "Cards worldwide" },
                      ] as const).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setGateway(g.id)}
                          aria-pressed={gateway === g.id}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            gateway === g.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{g.label}</span>
                          <span className="block text-[11px] text-muted-foreground">{g.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Confirm Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPayg ? (
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">Pay As You Go</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Prepaid credit</span><span className="font-medium">${creditAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bandwidth</span><span>{(creditAmount / USD_PER_GB).toFixed(1)} GB @ ${USD_PER_GB}/GB</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span>{PAYMENT_LABEL[payment.method]}</span></div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan?.name}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bandwidth</span><span>{selectedPlan?.bandwidthLimitGb} GB</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Billing</span><span className="capitalize">{interval}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span>{PAYMENT_LABEL[payment.method]}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Promo code" value={coupon} onChange={e => setCoupon(e.target.value)} className="flex-1" />
                      <Button variant="outline" onClick={() => { if (coupon.trim()) setCouponApplied(true); }}>
                        <Tag className="w-4 h-4 mr-1" /> Apply
                      </Button>
                    </div>
                    {couponApplied && <Badge variant="success">10% discount applied</Badge>}
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  By completing this purchase, you agree to our Terms of Service and Refund Policy.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate("/app/billing")} disabled={processing}>
              <ArrowLeft className="w-4 h-4 mr-1" /> {step === 0 ? "Back to Billing" : "Back"}
            </Button>
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} disabled={step === 0 && !selectedPlan}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handlePay} disabled={processing || !payValid}>
                {processing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  : payment.method === "bank"
                    ? <>Submit Order <ArrowRight className="w-4 h-4 ml-1" /></>
                    : payment.method === "wire"
                      ? <>Request Invoice <ArrowRight className="w-4 h-4 ml-1" /></>
                      : <>Pay ${total.toFixed(2)} <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selectedPlan && isPayg ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prepaid credit</span>
                    <span>${creditAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Bandwidth</span>
                    <span>{(creditAmount / USD_PER_GB).toFixed(1)} GB</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">${USD_PER_GB}/GB · no monthly fee · USD</p>
                </>
              ) : selectedPlan ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{selectedPlan.name}</span>
                    <span>${basePrice.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-success">
                      <span>Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {interval === "yearly" ? "Billed annually" : "Billed monthly"} · USD
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Select a plan to see pricing</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-success" /> 256-bit SSL encryption</div>
              <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-success" /> PCI DSS compliant</div>
              <div className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-success" /> 30-day money-back guarantee</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
