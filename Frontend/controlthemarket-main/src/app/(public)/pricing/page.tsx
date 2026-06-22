'use client';

import { useState, useEffect, Fragment } from 'react';
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
  isCustom?: boolean;
};

const plans: Plan[] = [
  {
    name: 'Basic',
    description: 'For individuals and small teams getting started.',
    price: { monthly: 29, yearly: 290 },
    features: ['50 Active Tasks', '100 Candidates per month', 'Basic Analytics', 'Email Support'],
  },
  {
    name: 'Pro',
    description: 'For growing businesses that need more power.',
    price: { monthly: 79, yearly: 790 },
    features: ['50 Active Tasks', '1,000 Candidates per month', 'Advanced Analytics', 'Priority Email Support', 'AI Task Assistant'],
    isPopular: true,
  },
  {
    name: 'Business',
    description: 'For scaling teams that need collaboration, API access and priority support.',
    price: { monthly: 185, yearly: 1850 },
    features: ['Unlimited Active Tasks', '5,000 Candidates per month', 'Advanced Analytics & custom reports', 'AI Task Assistant', 'Team collaboration & roles', 'API access', 'Priority support'],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs.',
    price: { monthly: 0, yearly: 0 },
    features: ['Unlimited Tasks', 'Unlimited Candidates', 'Custom Integrations', 'Dedicated Account Manager', 'SLA & 24/7 Support'],
    isCustom: true,
  },
];

// Feature comparison, grouped by category. Column order matches `plans` (Basic, Pro, Business,
// Enterprise) so the table headers + the popular-column highlight derive straight from `plans`.
const comparisonGroups: { category: string; rows: { feature: string; values: (string | boolean)[] }[] }[] = [
  {
    category: 'Tasks & candidates',
    rows: [
      { feature: 'Active tasks', values: ['50', '50', 'Unlimited', 'Unlimited'] },
      { feature: 'Candidates per month', values: ['100', '1,000', '5,000', 'Unlimited'] },
    ],
  },
  {
    category: 'Analytics & AI',
    rows: [
      { feature: 'Advanced analytics', values: [false, true, true, true] },
      { feature: 'Custom reports', values: [false, false, true, true] },
      { feature: 'AI Task Assistant', values: [false, true, true, true] },
    ],
  },
  {
    category: 'Collaboration',
    rows: [
      { feature: 'Team members', values: ['3', '10', '50', 'Unlimited'] },
      { feature: 'Roles & permissions', values: [false, false, true, true] },
      { feature: 'API access', values: [false, false, true, true] },
      { feature: 'Custom integrations', values: [false, false, false, true] },
    ],
  },
  {
    category: 'Support',
    rows: [
      { feature: 'Support', values: ['Email', 'Priority Email', 'Priority', '24/7 Phone & Email'] },
      { feature: 'Dedicated account manager', values: [false, false, false, true] },
      { feature: 'SLA & uptime guarantee', values: [false, false, false, true] },
    ],
  },
];

const POPULAR_COL = 1; // Pro — tinted across the whole comparison column.

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

  const handleChoosePlan = (plan: Plan) => {
    if (plan.isCustom) {
      router.push('/contact');
      return;
    }
    if (!user || user.role !== 'company') {
      router.push(`/signup/company?plan=${encodeURIComponent(plan.name)}&cycle=${isYearly ? 'annual' : 'monthly'}`);
      return;
    }
    // Logged-in company → pick a payment provider, then start a real checkout.
    setCheckoutPlan(plan.name);
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
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
        <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Find the perfect plan
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start with a free trial. No credit card required. Cancel anytime.
        </p>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        <Label htmlFor="billing-cycle" className={cn('cursor-pointer text-sm', !isYearly && 'font-semibold')}>Monthly</Label>
        <Switch id="billing-cycle" checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle annual billing" />
        <Label htmlFor="billing-cycle" className={cn('cursor-pointer text-sm', isYearly && 'font-semibold')}>Yearly</Label>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Save 2 months
        </span>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const monthlyEquivalent = isYearly ? (plan.price.yearly / 12).toFixed(2) : String(plan.price.monthly);
          const yearlySaving = plan.price.monthly * 2; // "2 months free" on the annual plan
          return (
            <Card
              key={plan.name}
              className={cn(
                'relative flex h-full flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
                plan.isPopular
                  ? 'border-primary shadow-lg ring-2 ring-primary/50 lg:scale-[1.03] lg:z-10'
                  : 'border-border',
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="space-y-1.5 pb-3">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[3rem]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-grow flex-col gap-6">
                <div>
                  {plan.isCustom ? (
                    <p className="text-4xl font-bold tracking-tight">Custom</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">${monthlyEquivalent}</span>
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {plan.isCustom
                      ? 'Tailored to your needs'
                      : isYearly
                        ? `$${plan.price.yearly} billed annually · save $${yearlySaving}`
                        : 'Billed monthly'}
                  </p>
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.isPopular ? 'default' : 'outline'}
                  onClick={() => handleChoosePlan(plan)}
                >
                  {plan.isCustom ? 'Contact Sales' : 'Choose Plan'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mx-auto mt-24 max-w-6xl">
        <div className="text-center">
          <h2 className="font-headline text-3xl font-bold">Compare all features</h2>
          <p className="mt-3 text-muted-foreground">Everything in each plan, side by side.</p>
        </div>
        <Card className="mt-10 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[280px] align-bottom py-5">Plans</TableHead>
                  {plans.map((p, i) => (
                    <TableHead
                      key={p.name}
                      className={cn('py-5 text-center align-bottom', i === POPULAR_COL && 'bg-primary/5')}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {p.isPopular && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Popular
                          </span>
                        )}
                        <span className="text-base font-semibold text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.isCustom ? 'Custom' : `$${p.price.monthly}/mo`}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonGroups.map((group) => (
                  <Fragment key={group.category}>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={plans.length + 1}
                        className="bg-muted/40 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {group.category}
                      </TableCell>
                    </TableRow>
                    {group.rows.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        {row.values.map((value, i) => (
                          <TableCell
                            key={`${row.feature}-${i}`}
                            className={cn('text-center', i === POPULAR_COL && 'bg-primary/5')}
                          >
                            {typeof value === 'boolean' ? (
                              value
                                ? <Check className="mx-auto h-5 w-5 text-primary" />
                                : <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                            ) : (
                              <span className="text-sm">{value}</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
                <TableRow className="hover:bg-transparent">
                  <TableCell />
                  {plans.map((p, i) => (
                    <TableCell key={p.name} className={cn('py-4 text-center', i === POPULAR_COL && 'bg-primary/5')}>
                      <Button
                        size="sm"
                        variant={p.isPopular ? 'default' : 'outline'}
                        onClick={() => handleChoosePlan(p)}
                      >
                        {p.isCustom ? 'Contact' : 'Choose'}
                      </Button>
                    </TableCell>
                  ))}
                </TableRow>
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
            <Button variant="outline" onClick={() => handlePay('cashfree')} disabled={isStarting}>
              Pay with Cashfree (UPI / Cards / Netbanking)
            </Button>
            <Button variant="outline" onClick={() => handlePay('payu')} disabled={isStarting}>
              Pay with PayU (Cards / UPI / Wallets)
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
