"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { ShieldCheck, Wallet, CheckCircle2, ArrowRight, Tag, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const ORIGINAL_PRICE = 15000;
  const finalPrice = ORIGINAL_PRICE * (1 - discountApplied);

  const handleApplyCode = () => {
    if (discountCode.toUpperCase() === "SECRET70") {
      setDiscountApplied(0.7);
      toast({ title: "70% Discount Applied!", description: "Secret code validated by node admin." });
    } else if (discountCode.toUpperCase() === "MU10") {
      setDiscountApplied(0.1);
      toast({ title: "10% Discount Applied!", description: "Protocol bonus validated." });
    } else {
      toast({ variant: "destructive", title: "Invalid Code", description: "Security signature mismatch." });
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const orderId = `NX-8472-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
      router.push(`/checkout/confirmation/${orderId}`);
    }, 2000);
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <ListingCard className="p-10 space-y-10 border-brand-border bg-brand-surface">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold uppercase font-mono tracking-widest text-text-muted">Protocol 01: Payment</h3>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Select Asset</label>
                        <div className="grid grid-cols-3 gap-4">
                          {['ETH', 'BTC', 'USDT'].map(coin => (
                            <button key={coin} className="p-4 rounded-md border border-brand-border bg-brand-void hover:border-brand-green transition-all text-center font-mono font-bold">
                              {coin}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-text-muted uppercase">Discount Code</label>
                        <div className="flex gap-2">
                          <input 
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter secret code..."
                            className="flex-1 bg-brand-void border border-brand-border h-12 rounded px-4 text-sm font-mono text-white outline-none focus:border-brand-green"
                          />
                          <AppButton variant="secondary" onClick={handleApplyCode}>Apply</AppButton>
                        </div>
                        {discountApplied > 0 && (
                          <div className="text-xs font-bold text-brand-green flex items-center gap-2">
                            <Tag className="w-3 h-3" /> {discountApplied * 100}% Discount Applied
                          </div>
                        )}
                      </div>
                    </div>

                    <AppButton 
                      onClick={handlePayment} 
                      isLoading={isProcessing}
                      className="w-full h-16 font-mono text-sm uppercase tracking-[0.2em]"
                    >
                      Authorize Escrow Payment
                    </AppButton>
                  </ListingCard>
                </motion.div>
              ) : (
                <motion.div key="s2" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-20 space-y-8">
                  <CheckCircle2 className="w-24 h-24 text-brand-green mx-auto" />
                  <h2 className="text-4xl font-bold font-display">PAYMENT VERIFIED</h2>
                  <p className="text-text-secondary">Transaction confirmed on blockchain. Redirecting to confirmation...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="lg:col-span-5">
            <ListingCard className="p-8 space-y-8 border-brand-border bg-brand-surface">
              <h3 className="text-sm font-bold uppercase font-mono tracking-widest text-text-muted">Order Intelligence</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-white font-mono">{ORIGINAL_PRICE.toLocaleString()} USDT</span>
                </div>
                {discountApplied > 0 && (
                  <div className="flex justify-between text-sm text-brand-green">
                    <span>Discount</span>
                    <span className="font-mono">-{ (ORIGINAL_PRICE * discountApplied).toLocaleString() } USDT</span>
                  </div>
                )}
                <div className="pt-4 border-t border-brand-border flex justify-between items-end">
                  <span className="font-bold text-white text-xs uppercase">Total Trade Value</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-brand-green font-mono">{finalPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">USDT</div>
                  </div>
                </div>
              </div>
            </ListingCard>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
