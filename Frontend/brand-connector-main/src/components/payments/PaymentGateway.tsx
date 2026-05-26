'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
  Smartphone,
  Building2,
  IndianRupee,
  AlertCircle,
  ChevronRight,
  Info,
  Check,
  Smartphone as UpiIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { lockFunds } from '@/lib/escrow';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CampaignStatus } from '@/types';

interface PaymentGatewayProps {
  campaignId: string;
  brandId: string;
  budget: number;
  onSuccess: () => void;
  onCancel: () => void;
}

type PaymentStep = 'method' | 'details' | 'verifying' | 'processing' | 'success';

export function PaymentGateway({ campaignId, brandId, budget, onSuccess, onCancel }: PaymentGatewayProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState<PaymentStep>('method');
  const [method, setMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculations
  const platformFee = Math.round(budget * 0.15);
  const subtotal = budget + platformFee;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handlePaymentSubmit = async () => {
    setStep('verifying');

    // Simulate 3D Secure Verification delay
    setTimeout(() => {
      setStep('processing');
      executeEscrowLock();
    }, 2500);
  };

  const executeEscrowLock = async () => {
    try {
      // 1. Call Escrow Service to Lock Funds & Create Transaction
      await lockFunds(db!, campaignId, brandId, budget);

      // 2. Update Campaign Status
      const campaignRef = doc(db!, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: CampaignStatus.ACTIVE,
        updatedAt: new Date().toISOString()
      });

      // 3. Success State
      setStep('success');
      toast({
        title: "Escrow Funded Successfully",
        description: `₹${total.toLocaleString()} has been secured for your campaign.`,
      });

      // Allow success animation to play before callback
      setTimeout(onSuccess, 3000);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'We could not process your request. Please check your available credit.',
      });
      setStep('method');
    }
  };

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white max-w-4xl mx-auto ring-1 ring-slate-100">
      <div className="flex flex-col lg:flex-row h-full">

        {/* Left: Summary Panel */}
        <div className="lg:w-2/5 bg-slate-50/50 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r">
          <div className="space-y-8">
            <div>
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest mb-4">
                Funding Request
              </Badge>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">Secure Campaign Escrow</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">Funds are held safely by Baalvion and released only upon your approval of work.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400">Campaign Budget</span>
                <span className="text-slate-900">₹{budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400">Platform Fee (15%)</span>
                <span className="text-slate-900">₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400">GST (18%)</span>
                <span className="text-slate-900">₹{gst.toLocaleString()}</span>
              </div>
              <Separator className="bg-slate-200" />
              <div className="flex justify-between items-center">
                <span className="text-md font-black uppercase text-primary">Total to Fund</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xs font-black text-slate-900 uppercase">Escrow Guarantee</p>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Payments are protected by our multi-signature audited escrow vault. Refundable if deliverables are not met per the initial brief.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Interaction Panel */}
        <div className="lg:w-3/5 p-8 lg:p-12 relative min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">

            {/* STEP: Method Selection */}
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="space-y-2">
                  <h4 className="text-xl font-bold">Select Payment Method</h4>
                  <p className="text-sm text-slate-500">Choose how you'd like to fund this campaign.</p>
                </div>

                <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-indigo-600', desc: 'Secure checkout with Visa/Mastercard' },
                    { id: 'upi', label: 'UPI / VPA', icon: UpiIcon, color: 'text-emerald-600', desc: 'Instant transfer via PhonePe, GPay, etc.' },
                    { id: 'netbank', label: 'Corporate Banking', icon: Building2, color: 'text-blue-600', desc: 'Transfer from HDFC, ICICI, SBI accounts' },
                  ].map((m) => (
                    <div key={m.id}>
                      <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                      <Label
                        htmlFor={m.id}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-50 bg-white cursor-pointer transition-all hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                          method === m.id && "border-primary bg-primary/5 shadow-md"
                        )}
                      >
                        <div className={cn("h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0", m.color)}>
                          <m.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{m.label}</p>
                          <p className="text-xs text-slate-400 font-medium">{m.desc}</p>
                        </div>
                        {method === m.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="pt-4 mt-auto">
                  <Button onClick={() => setStep('details')} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                    Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="ghost" onClick={onCancel} className="w-full mt-4 rounded-xl font-bold text-slate-400 hover:text-slate-600">
                    Cancel & Save Draft
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP: Details (Card Form) */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setStep('method')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h4 className="text-xl font-bold">Payment Details</h4>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Cardholder Name</Label>
                    <Input placeholder="Lumina Tech Corporate" className="h-12 rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Card Information</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                      <Input placeholder="0000 0000 0000 4242" className="pl-10 h-12 rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Input placeholder="MM / YY" className="h-12 rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" />
                      <Input placeholder="CVC" className="h-12 rounded-xl bg-slate-50 border-none font-medium focus-visible:ring-primary" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <Button onClick={handlePaymentSubmit} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">
                    Pay ₹{total.toLocaleString()}
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <Lock className="h-3 w-3" /> PCI-DSS Compliant Gateway
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: 3D Secure / Verification */}
            {step === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <div className="h-32 w-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Smartphone className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Verify Payment</h3>
                  <p className="text-slate-500 max-w-xs mx-auto font-medium">Please approve the authentication request sent to your mobile banking app.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Waiting for 3D Secure response...</span>
                </div>
              </motion.div>
            )}

            {/* STEP: Final Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
              >
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Securing Funds in Escrow</h3>
                  <p className="text-slate-500 font-medium">Initializing smart contract and locking campaign capital.</p>
                </div>
              </motion.div>
            )}

            {/* STEP: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight">Campaign Funded!</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">Your campaign is now live. We've notified the top matching creators in your niche.</p>
                </div>
                <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Receipt ID</span>
                    <span className="text-slate-900">#BV-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Amount Secured</span>
                    <span className="text-emerald-600 font-black">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}

function ArrowLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
