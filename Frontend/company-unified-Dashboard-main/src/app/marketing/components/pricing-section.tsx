'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const pricingPlans = [
  {
    name: 'Starter',
    price: { monthly: 99, annual: 950 },
    description: 'For small teams getting started.',
    features: ['1 Business', 'Up to 5 users', 'Basic analytics', 'Email support'],
    buttonText: 'Start Free Trial',
    variant: 'outline',
  },
  {
    name: 'Pro',
    price: { monthly: 299, annual: 2870 },
    description: 'For growing businesses that need more power.',
    features: ['Up to 5 Businesses', '25 users', 'AI predictions', 'Priority support', 'Multi-currency'],
    buttonText: 'Start Free Trial',
    variant: 'default',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: { monthly: 999, annual: 9590 },
    description: 'For large organizations with custom needs.',
    features: ['Unlimited businesses', 'Unlimited users', 'White-label', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
    buttonText: 'Contact Sales',
    variant: 'outline',
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-2 text-lg text-muted-foreground">Choose the plan that's right for your empire.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Label htmlFor="pricing-toggle">Monthly</Label>
          <Switch id="pricing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
          <Label htmlFor="pricing-toggle">Annual <Badge className="bg-green-100 text-green-800 border-green-300">-20%</Badge></Label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {pricingPlans.map(plan => (
            <Card key={plan.name} className={cn('flex flex-col', plan.popular && 'border-primary shadow-2xl')}>
              {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">${isAnnual ? Math.floor(plan.price.annual / 12) : plan.price.monthly}</span>
                  <span className="text-muted-foreground">/month</span>
                  {isAnnual && <p className="text-sm text-muted-foreground">Billed as ${plan.price.annual}/year</p>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.variant as any}>{plan.buttonText}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
