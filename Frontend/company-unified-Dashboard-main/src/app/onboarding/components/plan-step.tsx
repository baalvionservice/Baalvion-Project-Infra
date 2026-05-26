
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface PlanStepProps {
  onNext: () => void;
  onBack: () => void;
  updateFormData: (data: any) => void;
}

const pricingPlans = [
  {
    name: 'Starter',
    price: 99,
    description: 'For small teams getting started.',
    features: ['1 Business', 'Up to 5 users', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro',
    price: 299,
    description: 'For growing businesses that need more power.',
    features: ['Up to 5 Businesses', '25 users', 'AI predictions', 'Priority support', 'Multi-currency'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 999,
    description: 'For large organizations with custom needs.',
    features: ['Unlimited businesses', 'Unlimited users', 'White-label', 'Dedicated account manager'],
  },
];

export default function PlanStep({ onNext, onBack, updateFormData }: PlanStepProps) {
  const handleSelectPlan = (planName: string) => {
    updateFormData({ plan: planName });
    onNext();
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pricingPlans.map(plan => (
            <Card key={plan.name} className={cn('flex flex-col relative', plan.popular && 'border-primary shadow-lg')}>
              {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => handleSelectPlan(plan.name)}>
                    Start Free Trial
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <p className="text-center text-sm text-muted-foreground">
            Or <Button variant="link" className="p-0 h-auto" onClick={() => handleSelectPlan('Free')}>continue with the free plan — upgrade later</Button>
        </p>
        <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
    </div>
  );
}
