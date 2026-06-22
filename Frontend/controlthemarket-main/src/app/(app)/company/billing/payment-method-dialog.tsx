'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getAllPlans } from '@/lib/api';
import type { Plan } from '@/lib/types';
import { startCheckout, type CheckoutProvider } from '@/lib/checkout';

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  presetPlanId?: string;
}

// Real, self-contained checkout dialog. Lets the company pick a (server-priced) plan and a
// provider, then hands off to the hosted checkout via startCheckout. No card fields are ever
// collected here — Stripe/Razorpay own the payment details; the backend webhook activates.
export function PaymentMethodDialog({ isOpen, onOpenChange, presetPlanId }: PaymentMethodDialogProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(presetPlanId);
  const [isYearly, setIsYearly] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getAllPlans()
      .then((all) => {
        if (!active) return;
        // Only purchasable, priced plans (skip free / custom-priced enterprise).
        const buyable = all.filter((p) => (p.priceMonthly ?? 0) > 0);
        setPlans(buyable);
        setSelectedPlanId((prev) => prev ?? presetPlanId ?? buyable[0]?.id);
      })
      .catch(() => { /* surfaced on the pay attempt */ });
    return () => { active = false; };
  }, [isOpen, presetPlanId]);

  const pay = async (provider: CheckoutProvider) => {
    if (!selectedPlanId) {
      toast({ variant: 'destructive', title: 'Pick a plan', description: 'Choose a plan to continue to checkout.' });
      return;
    }
    setIsStarting(true);
    try {
      await startCheckout({ planId: selectedPlanId, provider, billingCycle: isYearly ? 'annual' : 'monthly' });
      // Stripe is redirecting, or the Razorpay modal is now open.
    } catch (err) {
      toast({ variant: 'destructive', title: 'Checkout failed', description: err instanceof Error ? err.message : 'Could not start checkout.' });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a plan &amp; pay</DialogTitle>
          <DialogDescription>
            Payment is completed on a secure checkout (Stripe, Razorpay, Cashfree or PayU). No card details are stored here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          <Label htmlFor="billing-toggle">Monthly</Label>
          <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
          <Label htmlFor="billing-toggle">Yearly</Label>
        </div>

        <div className="grid gap-2 py-1">
          {plans.length === 0 && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading plans…
            </div>
          )}
          {plans.map((plan) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const selected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  'flex items-center justify-between rounded-md border p-3 text-left transition-colors',
                  selected ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted',
                )}
              >
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-muted-foreground">${price}{isYearly ? '/yr' : '/mo'}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 py-2">
          <Button className="h-11" onClick={() => pay('stripe')} disabled={isStarting || !selectedPlanId}>
            <CreditCard className="mr-2 h-4 w-4" /> Pay with Card (Stripe)
          </Button>
          <Button className="h-11" variant="outline" onClick={() => pay('razorpay')} disabled={isStarting || !selectedPlanId}>
            Pay with Razorpay (UPI / Cards / Netbanking)
          </Button>
          <Button className="h-11" variant="outline" onClick={() => pay('cashfree')} disabled={isStarting || !selectedPlanId}>
            Pay with Cashfree (UPI / Cards / Netbanking)
          </Button>
          <Button className="h-11" variant="outline" onClick={() => pay('payu')} disabled={isStarting || !selectedPlanId}>
            Pay with PayU (Cards / UPI / Wallets)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
