'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import chartData from '@/lib/data/finance-overview.json';

const costData = chartData.costBreakdown;
const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function CostBreakdownChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription>Aggregated costs across all businesses.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="flex h-8 w-full rounded-full overflow-hidden">
                {costData.map((item, index) => (
                    <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                            <div 
                                style={{ 
                                    width: `${item.value}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                                className="h-full transition-all hover:opacity-90"
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-bold">{item.name}: {item.value}%</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {costData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                    <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm">{item.name}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
