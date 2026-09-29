'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useFinance } from '@/hooks/use-finance';

export default function FinanceStatCards() {
    const { view } = useFinance();
    const totals = (view?.financialSummary ?? []).reduce((acc, summary) => {
      acc.revenue += summary.revenue;
      acc.totalCosts += summary.totalCosts;
      acc.netProfit += summary.netProfit;
      return acc;
    }, { revenue: 0, totalCosts: 0, netProfit: 0 });

    const stats = [
        { label: "Revenue (Monthly)", value: totals.revenue },
        { label: "Costs (Monthly)", value: totals.totalCosts },
        { label: "Net Profit (Monthly)", value: totals.netProfit },
    ];
    
    return (
        <Carousel opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-2">
                {stats.map(stat => (
                    <CarouselItem key={stat.label} className="basis-2/3 pl-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">${(stat.value / 1000).toFixed(0)}K</p>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
