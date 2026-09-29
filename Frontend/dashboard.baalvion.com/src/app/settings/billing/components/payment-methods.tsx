
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { CreditCard, PlusCircle } from 'lucide-react';

interface PaymentMethod {
    type: string;
    last4: string;
    expiry: string;
}

interface PaymentMethodsProps {
    paymentMethod: PaymentMethod;
}

export default function PaymentMethods({ paymentMethod }: PaymentMethodsProps) {
    const { toast } = useToast();
    
    const handleRemove = () => {
        toast({
            title: "Payment Method Removed",
            description: "The Visa ending in 4242 has been removed.",
        })
    }
    
    const handleAdd = () => {
        toast({
            title: "Feature Coming Soon",
            description: "Adding new payment methods will be available shortly.",
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods for your subscription.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-muted-foreground"/>
                        <div>
                            <p className="font-medium">{paymentMethod.type} ending in {paymentMethod.last4}</p>
                            <p className="text-sm text-muted-foreground">Expires {paymentMethod.expiry}</p>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="link" className="text-destructive">Remove</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will remove your default payment method.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemove}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Button variant="outline" className="mt-4" onClick={handleAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Payment Method
                </Button>
            </CardContent>
        </Card>
    );
}
