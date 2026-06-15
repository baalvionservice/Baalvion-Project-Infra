'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getAllPlans } from '@/lib/api';
import { startCheckout, type CheckoutProvider } from '@/lib/checkout';
import { useToast } from '@/hooks/use-toast';

type Plan = {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  isPopular?: boolean;
};

const plans: Plan[] = [
  {
    name: 'Basic',
    description: 'For individuals and small teams getting started.',
    price: {
      monthly: 29,
      yearly: 290,
    },
    features: ['50 Active Tasks', '100 Candidates per month', 'Basic Analytics', 'Email Support'],
  },
  {
    name: 'Pro',
    description: 'For growing businesses that need more power.',
    price: {
      monthly: 79,
      yearly: 790,
    },
    features: ['50 Active Tasks', '1,000 Candidates per month', 'Advanced Analytics', 'Priority Email Support', 'AI Task Assistant'],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs.',
    price: {
      monthly: 0, // Custom pricing
      yearly: 0,
    },
    features: ['Unlimited Tasks', 'Unlimited Candidates', 'Custom Integrations', 'Dedicated Account Manager', 'SLA & 24/7 Support'],
  },
];

const featureComparison = [
    { feature: 'Active Tasks', basic: '50', pro: '50', enterprise: 'Unlimited' },
    { feature: 'Candidates per month', basic: '100', pro: '1,000', enterprise: 'Unlimited' },
    { feature: 'AI Task Assistant', basic: false, pro: true, enterprise: true },
    { feature: 'Advanced Analytics', basic: false, pro: true, enterprise: true },
    { feature: 'Custom Integrations', basic: false, pro: false, enterprise: true },
    { feature: 'Dedicated Account Manager', basic: false, pro: false, enterprise: true },
    { feature: 'Email Support', basic: true, pro: 'Priority', enterprise: '24/7 Phone & Email' },
];


export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Resolve the server-trusted plan id by plan name. Displayed prices are illustrative; the
  // BACKEND prices the charge from this id, so we never check out a plan the catalog lacks.
  const [planIdByName, setPlanIdByName] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    getAllPlans()
      .then((backendPlans) => {
        if (!active) return;
        const map: Record<string, string> = {};
        for (const p of backendPlans) if (p?.id && p?.name) map[p.name.toLowerCase()] = String(p.id);
        setPlanIdByName(map);
      })
      .catch(() => { /* checkout surfaces "plan unavailable" if the catalog can't load */ });
    return () => { active = false; };
  }, []);

  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleChoosePlan = (planName: string) => {
    if (planName === 'Enterprise') {
      router.push('/contact');
      return;
    }
    if (!user || user.role !== 'company') {
      router.push(`/signup/company?plan=${encodeURIComponent(planName)}&cycle=${isYearly ? 'annual' : 'monthly'}`);
      return;
    }
    // Logged-in company → pick a payment provider, then start a real checkout.
    setCheckoutPlan(planName);
  };

  const handlePay = async (provider: CheckoutProvider) => {
    if (!checkoutPlan) return;
    const planId = planIdByName[checkoutPlan.toLowerCase()];
    if (!planId) {
      toast({ variant: 'destructive', title: 'Plan unavailable', description: 'This plan is not available for checkout yet. Please contact support.' });
      return;
    }
    setIsStarting(true);
    try {
      await startCheckout({ planId, provider, billingCycle: isYearly ? 'annual' : 'monthly' });
      // Success → Stripe is redirecting, or the Razorpay modal is now open.
    } catch (err) {
      toast({ variant: 'destructive', title: 'Checkout failed', description: err instanceof Error ? err.message : 'Could not start checkout.' });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Find the perfect plan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start with a free trial. No credit card required. Cancel anytime.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center space-x-2">
        <Label htmlFor="billing-cycle">Monthly</Label>
        <Switch
          id="billing-cycle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-cycle">Yearly</Label>
         <span className="ml-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Save 2 months
        </span>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={cn('flex flex-col', plan.isPopular && 'border-primary shadow-lg')}>
             {plan.isPopular && (
              <div className="py-1.5 px-4 bg-primary text-primary-foreground text-center text-sm font-semibold rounded-t-lg">
                Most Popular
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="text-center">
                {plan.name === 'Enterprise' ? (
                  <p className="text-4xl font-bold">Custom</p>
                ) : (
                  <>
                    <p className="text-4xl font-bold">
                      ${isYearly ? (plan.price.yearly / 12).toFixed(2) : plan.price.monthly}
                      <span className="text-xl font-normal text-muted-foreground">/mo</span>
                    </p>
                     <p className="text-xs text-muted-foreground">
                        {isYearly ? `$${plan.price.yearly} billed annually` : 'Billed monthly'}
                    </p>
                  </>
                )}
              </div>
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.name === 'Enterprise' ? 'outline' : 'default'}
                onClick={() => handleChoosePlan(plan.name)}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

       <div className="mt-20">
        <h2 className="text-center font-headline text-3xl font-bold">
          Compare all features
        </h2>
        <Card className="mt-8">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Features</TableHead>
                            <TableHead className="text-center">Basic</TableHead>
                            <TableHead className="text-center">Pro</TableHead>
                            <TableHead className="text-center">Enterprise</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {featureComparison.map((feat) => (
                            <TableRow key={feat.feature}>
                                <TableCell className="font-medium">{feat.feature}</TableCell>
                                <TableCell className="text-center">
                                    {typeof feat.basic === 'boolean' ? (
                                        feat.basic ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <span className="text-sm">{feat.basic}</span>
                                    )}
                                </TableCell>
                                 <TableCell className="text-center">
                                    {typeof feat.pro === 'boolean' ? (
                                        feat.pro ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <span className="text-sm">{feat.pro}</span>
                                    )}
                                </TableCell>
                                 <TableCell className="text-center">
                                    {typeof feat.enterprise === 'boolean' ? (
                                        feat.enterprise ? <Check className="mx-auto h-5 w-5 text-primary" /> : <X className="mx-auto h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <span className="text-sm">{feat.enterprise}</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      <Dialog open={checkoutPlan !== null} onOpenChange={(open) => { if (!open) setCheckoutPlan(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose how to pay</DialogTitle>
            <DialogDescription>
              {checkoutPlan} plan · {isYearly ? 'billed annually' : 'billed monthly'}. You&apos;ll be taken to a secure checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Button onClick={() => handlePay('stripe')} disabled={isStarting}>
              Pay with Card (Stripe)
            </Button>
            <Button variant="outline" onClick={() => handlePay('razorpay')} disabled={isStarting}>
              Pay with Razorpay (UPI / Cards / Netbanking)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCheckoutPlan(null)} disabled={isStarting}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
