
'use client';

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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreditCard, History } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SubscriptionPage() {
  // Mock data as per requirements
  const subscription = {
    plan: 'Pro',
    price: 79,
    cycle: 'Monthly',
    status: 'Active',
    renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  };

  const usage = {
    tasks: {
      current: 25,
      limit: 50,
    },
    candidates: {
      current: 450,
      limit: 1000,
    },
  };
  
  const history = [
    { date: new Date(new Date().setMonth(new Date().getMonth() - 6)), action: 'Upgraded', plan: 'Pro Plan (Monthly)', amount: 79.00 },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 8)), action: 'Started', plan: 'Basic Plan (Monthly)', amount: 29.00 },
    { date: new Date(new Date().setMonth(new Date().getMonth() - 9)), action: 'Trial End', plan: 'Free Trial', amount: 0.00 },
  ];

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
      if (status === 'Active') return 'default';
      if (status === 'Expired') return 'destructive';
      return 'secondary';
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Subscription & Billing
          </h2>
          <p className="text-muted-foreground">
            Manage your subscription plan and view your billing history.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Current Plan</CardTitle>
                    <CardDescription>An overview of your current subscription and usage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-start justify-between rounded-md border p-4">
                        <div>
                            <p className="font-bold text-lg">{subscription.plan} Plan</p>
                            <p className="text-sm text-muted-foreground">${subscription.price} / month (Billed {subscription.cycle})</p>
                        </div>
                        <Badge variant={getStatusVariant(subscription.status)}>{subscription.status}</Badge>
                    </div>
                    <div className="space-y-4">
                         <h3 className="font-medium text-sm">Plan Usage</h3>
                        <div>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">Active Tasks</span>
                                <span><strong>{usage.tasks.current}</strong> / {usage.tasks.limit}</span>
                            </div>
                            <Progress value={(usage.tasks.current / usage.tasks.limit) * 100} />
                        </div>
                        <div>
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-muted-foreground">Candidates this month</span>
                                <span><strong>{usage.candidates.current}</strong> / {usage.candidates.limit}</span>
                            </div>
                            <Progress value={(usage.candidates.current / usage.candidates.limit) * 100} />
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground text-center">
                        Your plan renews on {format(subscription.renewalDate, 'PPP')}.
                    </p>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button asChild>
                        <Link href="/pricing">Upgrade Plan</Link>
                    </Button>
                    <Button variant="destructive">Cancel Subscription</Button>
                </CardFooter>
            </Card>
        </div>
        
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Subscription History</CardTitle>
                    <CardDescription>A log of your past subscription changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-xs">{format(item.date, 'PPP')}</TableCell>
                                    <TableCell><Badge variant="outline">{item.action}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
