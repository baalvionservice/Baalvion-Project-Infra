'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import CurrentPlan from './components/current-plan';
import UsageMetrics from './components/usage-metrics';
import PaymentMethods from './components/payment-methods';
import BillingContact from './components/billing-contact';
import InvoiceHistory from './components/invoice-history';
import billingData from '@/lib/data/billing.json';

export default function BillingPage() {
  const [isCancelled, setIsCancelled] = useState(false);
  const { toast } = useToast();
  
  const handleCancelSubscription = () => {
    setIsCancelled(true);
    toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period."
    });
  }

  const handleResubscribe = () => {
    setIsCancelled(false);
     toast({
        title: "Welcome Back!",
        description: "Your subscription has been reactivated."
    });
  }

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your plan, payment methods, and billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {isCancelled ? (
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Cancelled</CardTitle>
                    <CardDescription>Your plan will not renew at the end of the current billing period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Your data will be retained for 30 days after your subscription expires. You can resubscribe at any time before then to restore your account.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleResubscribe}>Re-subscribe</Button>
                </CardFooter>
            </Card>
          ) : (
            <CurrentPlan subscription={billingData.subscription} />
          )}
          <InvoiceHistory />
          <PaymentMethods paymentMethod={billingData.subscription.paymentMethod} />
          <BillingContact contact={billingData.billingContact} />
        </div>
        <div className="lg:col-span-1">
          <UsageMetrics usage={billingData.usage} />
        </div>
      </div>
      
       {!isCancelled && (
        <div className="text-center">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="link" className="text-sm text-muted-foreground hover:text-destructive">Cancel Subscription</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be immediately undone. Your subscription will remain active until the end of the current billing period. Your data will be retained for 30 days after expiration.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Cancellation</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
       )}
    </div>
  );
}
