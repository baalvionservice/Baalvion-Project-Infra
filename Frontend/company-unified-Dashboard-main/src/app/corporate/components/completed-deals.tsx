
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import corporateActionsData from '@/lib/data/corporate-actions.json';

export default function CompletedDeals() {
  const deal = corporateActionsData.completedDeals[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Completed Deal</CardTitle>
        <CardDescription>A look at the most recently closed transaction.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
            <h3 className="font-semibold">{deal.name}</h3>
            <p className="text-sm text-muted-foreground">Value: ${deal.value} | Completed: {format(parseISO(deal.completed), 'PP')}</p>
        </div>
        <Separator />
        <div className="mt-4 space-y-4">
          {deal.timeline.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {index < deal.timeline.length - 1 && <div className="w-px h-8 bg-border" />}
              </div>
              <div>
                <p className="text-sm font-medium">{item.event}</p>
                <p className="text-xs text-muted-foreground">{format(parseISO(item.date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
