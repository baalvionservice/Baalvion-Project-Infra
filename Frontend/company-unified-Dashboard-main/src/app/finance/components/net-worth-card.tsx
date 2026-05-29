'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';
import { useFinance } from '@/hooks/use-finance';

export default function NetWorthCard() {
    const { view } = useFinance();
    const netWorth = view?.netWorth ?? { total: 0, change: { amount: 0, percentage: 0 } };
    return (
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold tracking-tight">${(netWorth.total / 1_000_000).toFixed(1)}M</p>
                <div className="flex items-center text-primary-foreground/80 text-sm">
                    <ArrowUp className="h-4 w-4" />
                    <span>${(netWorth.change.amount / 1000).toFixed(0)}K (+{netWorth.change.percentage}%) this month</span>
                </div>
            </CardContent>
        </Card>
    );
}
