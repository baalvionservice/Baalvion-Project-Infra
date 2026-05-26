
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, Download, Banknote, History } from 'lucide-react';
import { format } from 'date-fns';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { PaymentMethodDialog } from './payment-method-dialog';

const getStatusVariant = (status: InvoiceStatus): 'default' | 'destructive' | 'warning' | 'secondary' => {
  switch (status) {
    case 'Paid':
      return 'default';
    case 'Failed':
    case 'Overdue':
      return 'destructive';
    case 'Due':
      return 'warning';
    case 'Pending':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export function BillingDashboard({ initialInvoices }: { initialInvoices: Invoice[] }) {
    const [invoices, setInvoices] = useState(initialInvoices);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const { toast } = useToast();

    const nextBillingDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    const amountDue = invoices.find(inv => inv.status === 'Due')?.amount || 0;

    const handlePayNow = (invoiceId: string) => {
        toast({
            title: 'Processing Payment...',
            description: `Paying invoice ${invoiceId}. This is a mock action.`,
        });
        setTimeout(() => {
            setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {...inv, status: 'Paid'} : inv));
            toast({
                title: 'Payment Successful',
                description: `Invoice ${invoiceId} has been marked as paid.`
            });
        }, 1500);
    };

    return (
        <>
            <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Billing & Payments
                </h2>
                <p className="text-muted-foreground">
                    Manage your payment methods and view your billing history.
                </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/company/invoices">
                        <History className="mr-2 h-4 w-4" /> View All Invoices
                    </Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>A summary of your most recent invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {invoices.slice(0,3).map((invoice) => (
                            <TableRow key={invoice.id}>
                            <TableCell className="font-medium uppercase">{invoice.id}</TableCell>
                            <TableCell>{format(new Date(invoice.date), 'PPP')}</TableCell>
                            <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                <Download className="mr-2 h-4 w-4" /> Download
                                </Button>
                                {invoice.status === 'Due' && (
                                    <Button size="sm" onClick={() => handlePayNow(invoice.id)}>
                                        Pay Now
                                    </Button>
                                )}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                </div>
                
                <div className="space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Billing Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Next Bill</span>
                        <span className="font-bold">{format(nextBillingDate, 'PPP')}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Amount Due</span>
                        <span className="font-bold text-2xl">${amountDue.toFixed(2)}</span>
                    </div>
                    </CardContent>
                    {amountDue > 0 && (
                        <CardFooter>
                        <Button className="w-full" onClick={() => handlePayNow(invoices.find(inv => inv.status === 'Due')!.id)}>
                            <Banknote className="mr-2 h-4 w-4" /> Pay Now
                        </Button>
                        </CardFooter>
                    )}
                </Card>

                <Card>
                    <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="flex items-center gap-4 rounded-md border p-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                        <p className="font-semibold">Visa ending in 1234</p>
                        <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                        </div>
                    </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setIsPaymentDialogOpen(true)}>Update Payment Method</Button>
                    </CardFooter>
                </Card>
                </div>
            </div>
            </div>
            <PaymentMethodDialog isOpen={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} />
        </>
    );
}
