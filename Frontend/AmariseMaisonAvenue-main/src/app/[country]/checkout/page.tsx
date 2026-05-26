"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { paymentService } from "@/lib/services/paymentService";
import { apiOrchestrator } from "@/lib/api/orchestrator";
import { PaymentGateway, CountryCode } from "@/lib/types";
import { TaxEngine } from "@/lib/finance/tax-engine";
import { RiskEngine } from "@/lib/fraud/risk-engine";

export default function CheckoutPage() {
  const {
    cart,
    clearCart,
    createInvoice,
    createTransaction,
    activeBrandId,
    currentUser,
    paymentPlans,
    countryConfigs,
    fxRates,
    getLocalizedPrice,
    taxRules,
    recordFraudLog,
  } = useAppStore();
  const { country } = useParams();
  const searchParams = useSearchParams();
  const countryCode = (country as string) || "us";
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedGateway, setSelectedGateway] =
    useState<PaymentGateway>("STRIPE");
  const [isSettling, setIsSettling] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [inventoryLockId, setInventoryLockId] = useState<string | null>(null);
  const [lockedFXRate, setLockedFXRate] = useState<number | null>(null);
  const [fraudBlocked, setFraudBlocked] = useState(false);

  // Prevent hydration mismatch for random order ID
  useEffect(() => {
    if (step === 3 && !orderRef) {
      setOrderRef(`#AM-${Math.floor(Math.random() * 10000)}`);
    }
  }, [step, orderRef]);

  const planId = searchParams.get("planId");
  const selectedPlan = useMemo(
    () => paymentPlans.find((p) => p.id === planId),
    [planId, paymentPlans]
  );
  const currentCountryConfig = useMemo(
    () => countryConfigs.find((c) => c.code === countryCode),
    [countryCode, countryConfigs]
  );

  const taxCalculation = useMemo(() => {
    const itemsToTax = [...cart];
    if (selectedPlan) {
      itemsToTax.push({
        id: selectedPlan.id,
        name: selectedPlan.name,
        basePrice: selectedPlan.price,
        quantity: 1,
        categoryId: "service",
      } as any);
    }
    return TaxEngine.calculateOrderTax(
      itemsToTax,
      countryCode as CountryCode,
      taxRules
    );
  }, [cart, selectedPlan, countryCode, taxRules]);

  const totalYield = taxCalculation.totalAmount;

  /**
   * 🛡️ FRAUD & INVENTORY PROTOCOL
   */
  const handleLockInventory = async () => {
    if (cart.length > 0) {
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

      if (lockRes.status === "success") {
        setInventoryLockId(lockRes.data.lock_id);
        const currentHubRate =
          fxRates.find((r) => r.currencyCode === currentCountryConfig?.currency)
            ?.rate || 1;
        setLockedFXRate(currentHubRate);
        setStep(2);
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

  const handlePlaceOrder = async () => {
    setIsSettling(true);
    const idempotencyKey = `maison_set_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 5)}`;

    try {
      const response = await paymentService.createPaymentIntent({
        amount: totalYield,
        currency: countryCode.toUpperCase(),
        gateway: selectedGateway,
        userId: currentUser?.id || "guest",
        tenantId: activeBrandId,
        idempotencyKey,
      });

      if (response.success) {
        const orderId = `AM-${(Math.random() * 10000).toFixed(0)}`;
        const invoiceId = `inv-${Date.now()}`;
        const customerName = `${firstName} ${lastName}`;

        createInvoice({
          id: invoiceId,
          orderId,
          customerName,
          amount: totalYield,
          currency: countryCode.toUpperCase(),
          status: selectedGateway === "BANK_TRANSFER" ? "pending" : "paid",
          date: new Date().toISOString(),
          taxAmount: taxCalculation.totalTax,
          taxRate: (taxCalculation.totalTax / taxCalculation.subtotal) * 100,
          complianceCertified: true,
          brandId: activeBrandId,
          gateway: selectedGateway,
          fxRate: lockedFXRate || 1,
        });

        createTransaction({
          id: `tx-${Date.now()}`,
          country: countryCode as CountryCode,
          type: selectedPlan ? "Subscription" : "Sale",
          clientName: customerName,
          amount: totalYield,
          netAmount: taxCalculation.subtotal,
          taxAmount: taxCalculation.totalTax,
          currency: countryCode.toUpperCase(),
          status: selectedGateway === "BANK_TRANSFER" ? "Pending" : "Settled",
          timestamp: new Date().toISOString(),
          invoiceId: invoiceId,
          brandId: activeBrandId,
          artifactName: selectedPlan
            ? selectedPlan.name
            : cart[0]?.name || "Atelier Bundle",
          isProvenanceCertified: true,
          gateway: selectedGateway,
          lockedRate: lockedFXRate || 1,
        });

        setIsSettling(false);
        setStep(3);
        clearCart();
        toast({
          title: response.gateway_order_id
            ? "Order Created"
            : "Settlement Confirmed",
          description: response.message,
        });
      }
    } catch (e) {
      setIsSettling(false);
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description:
          "The payment gateway rejected the intent. Please try another method.",
      });
    }
  };

  // Redirection logic moved to useEffect to prevent "Cannot update a component while rendering another" error.
  useEffect(() => {
    if (cart.length === 0 && !selectedPlan && step !== 3) {
      router.push(`/${countryCode}/cart`);
    }
  }, [cart.length, selectedPlan, step, router, countryCode]);

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Legal First Name
                      </Label>
                      <Input
                        className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                        placeholder="Julian"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Legal Last Name
                      </Label>
                      <Input
                        className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                        placeholder="Vandervilt"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Primary Residence / Dispatch Address
                      </Label>
                      <Input
                        className="rounded-none border-border bg-ivory/30 h-14 text-md italic focus:border-plum"
                        placeholder="730 Fifth Avenue"
                      />
                    </div>
                  </div>

                    <Button
                      className="h-20 px-16 w-full mx-auto bg-black text-white hover:bg-plum rounded-none text-[11px] font-bold tracking-[0.4em] uppercase transition-all shadow-2xl disabled:opacity-30"
                      onClick={handleLockInventory}
                      disabled={!firstName || !lastName}
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
                        : `AUTHORIZE SETTLEMENT — ${getLocalizedPrice(
                            totalYield
                          )}`}
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
                            Price: {getLocalizedPrice(item.itemPrice)}
                          </span>
                          <span className="text-[9px] text-plum font-bold uppercase">
                            +{item.taxRate}% {item.taxType}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-md tabular pl-4">
                        {getLocalizedPrice(item.itemPrice + item.taxAmount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-10 border-t border-border space-y-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Registry Subtotal</span>
                    <span className="text-gray-900 tabular">
                      {getLocalizedPrice(taxCalculation.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Aggregate Tax</span>
                    <span className="text-plum font-bold tabular">
                      +{getLocalizedPrice(taxCalculation.totalTax)}
                    </span>
                  </div>
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
                        {getLocalizedPrice(totalYield)}
                      </div>
                      <p className="text-[8px] text-gray-400 uppercase font-bold mt-1">
                        Inclusive of Jurisdictional Tax
                      </p>
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
