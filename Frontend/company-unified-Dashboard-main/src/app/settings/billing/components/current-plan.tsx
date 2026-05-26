'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import PlanComparisonModal from './plan-comparison-modal';

interface Subscription {
    plan: string;
    price: number;
    annualPrice: number;
    billingCycle: string;
    status: string;
    nextBillingDate: string;
    paymentMethod: {
        type: string;
        last4: string;
        expiry: string;
    };
}

interface CurrentPlanProps {
  subscription: Subscription;
}

export default function CurrentPlan({ subscription }: CurrentPlanProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const savedAmount = subscription.price * 12 - subscription.annualPrice;
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold">{subscription.plan}</span>
                        <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {subscription.status}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-xl font-semibold">${subscription.price}/month</p>
                        <p className="text-sm text-muted-foreground">Billed Annually (${subscription.annualPrice.toLocaleString()}/yr, you save ${savedAmount.toLocaleString()})</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Next billing date:</strong> {format(new Date(subscription.nextBillingDate), 'MMMM d, yyyy')}</p>
                        <p><strong>Payment method:</strong> {subscription.paymentMethod.type} ending in {subscription.paymentMethod.last4}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => setIsModalOpen(true)}>Change Plan</Button>
                </CardFooter>
            </Card>
            <PlanComparisonModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} currentPlan={subscription.plan} />
        </>
    );
}
