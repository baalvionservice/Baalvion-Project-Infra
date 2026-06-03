import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SEOHead } from "@/components/SEOHead";
import {
  CreditCard, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Ban, Lock, AlertTriangle, Tag, Globe, Smartphone, Server,
} from "lucide-react";
import { usePlans } from "@/hooks/usePlatform";
import { Plan, billingApi } from "@/lib/platformClient";
import { startGatewayCheckout } from "@/lib/gatewayCheckout";
import { cn } from "@/lib/utils";

const steps = ["Select Plan", "Payment Details", "Confirm & Pay"];

const typeIcon = (slug: string) => {
  if (slug.includes("mobile")) return <Smartphone className="w-5 h-5" />;
  if (slug.includes("dc") || slug.includes("datacenter")) return <Server className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

type ResultType = "success" | "failure" | "error";

export default function BillingCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const planParam = searchParams.get("plan");
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [paymentTab, setPaymentTab] = useState("card");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [result, setResult] = useState<ResultType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [processing, setProcessing] = useState(false);

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

  const basePrice = selectedPlan ? (interval === "yearly" ? selectedPlan.monthlyPrice * 10 : selectedPlan.monthlyPrice) : 0;
  const discount = couponApplied ? basePrice * 0.1 : 0;
  const total = basePrice - discount;

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

  // Activate the subscription server-side (trial → active) and refresh entitlements.
  // We only show "Payment Successful" when the backend confirms an ACTIVE
  // subscription — never on a swallowed error (a customer must not see success
  // while getting nothing).
  const activateAndFinish = async () => {
    if (!selectedPlan) return;
    try {
      const sub = await billingApi.activate(selectedPlan.slug);
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      if ((sub as { status?: string } | null)?.status === "active") {
        setResult("success");
      } else {
        setErrorMessage("Your payment was captured but the plan could not be activated. Please contact support — you have not been charged twice.");
        setResult("failure");
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Could not activate your subscription. Please contact support.");
      setResult("failure");
    }
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      // Hand off to the provider's hosted checkout via payment-service. In production
      // the authoritative result also arrives via the provider webhook → payment-service
      // ledger; here we activate on the client-confirmed success too (idempotent).
      let paid = false;
      try {
        const res = await startGatewayCheckout({
          amount: Math.round(total * 100), // minor units
          currency: "USD",
          idempotencyKey: `${selectedPlan.slug}-${interval}-${Date.now()}`,
          receipt: orderId,
          customer: companyName ? { name: companyName } : undefined,
        });
        if (res.status === "success") paid = true;
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

  const handleDownloadInvoice = () => {
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
                  <p className="text-muted-foreground">Your subscription to {selectedPlan?.name} is now active.</p>
                  <div className="border border-border rounded-lg p-4 text-left space-y-2 mt-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order ID</span><span className="font-mono text-xs">{orderId}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan?.name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-medium">${total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Billing</span><span className="capitalize">{interval}</span></div>
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
                <Tabs value={paymentTab} onValueChange={setPaymentTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
                    <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
                    <TabsTrigger value="bank" className="flex-1">Bank</TabsTrigger>
                    <TabsTrigger value="wire" className="flex-1">Wire</TabsTrigger>
                  </TabsList>
                  <TabsContent value="card" className="space-y-4 pt-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Secure checkout</p>
                        <p className="text-muted-foreground">Card details are entered on the payment provider's PCI-compliant page — this site never sees or stores your card. You'll complete payment in the next step.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company (optional)</Label>
                        <Input placeholder="Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>VAT Number (optional)</Label>
                        <Input placeholder="EU123456789" value={vatNumber} onChange={e => setVatNumber(e.target.value)} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="wallet" className="pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {["PayPal", "Google Pay", "Apple Pay", "Amazon Pay"].map(w => (
                        <Button key={w} variant="outline" className="h-16 text-base">{w}</Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="bank" className="pt-4 text-center text-muted-foreground py-8">
                    <p>Bank transfer details will be provided after order confirmation.</p>
                    <p className="text-xs mt-2">Settlement: 2 business days</p>
                  </TabsContent>
                  <TabsContent value="wire" className="pt-4 text-center text-muted-foreground py-8">
                    <Badge className="mb-2">Enterprise Only</Badge>
                    <p>Wire transfer is available for Enterprise plans with Net 30/60 terms.</p>
                  </TabsContent>
                </Tabs>
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
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan?.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bandwidth</span><span>{selectedPlan?.bandwidthLimitGb} GB</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Billing</span><span className="capitalize">{interval}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="capitalize">{paymentTab === "card" ? "Card (secure checkout)" : paymentTab}</span></div>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Promo code" value={coupon} onChange={e => setCoupon(e.target.value)} className="flex-1" />
                  <Button variant="outline" onClick={() => { if (coupon.trim()) setCouponApplied(true); }}>
                    <Tag className="w-4 h-4 mr-1" /> Apply
                  </Button>
                </div>
                {couponApplied && <Badge variant="success">10% discount applied</Badge>}
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
              <Button variant="hero" onClick={handlePay} disabled={processing}>
                {processing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
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
              {selectedPlan ? (
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
