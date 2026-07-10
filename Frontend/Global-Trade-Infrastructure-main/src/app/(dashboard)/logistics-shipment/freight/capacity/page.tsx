'use client';

import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Boxes } from 'lucide-react';

export default function FreightCapacityPage() {
  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Capacity</h1>
        <p className="text-sm text-muted-foreground">Available containers, aircraft space, truck capacity, rail capacity and overbooking prevention.</p>
      </div>

      <FreightNavTabs />

      <Card>
        <CardContent className="py-20 flex flex-col items-center gap-3 text-center">
          <Boxes className="h-10 w-10 text-muted-foreground/40" />
          <h2 className="font-bold">Capacity data isn't wired up yet</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            This phase of Freight Management shipped the Carrier Directory, Rate Engine, Quotes and Bookings.
            Real-time capacity tracking and overbooking prevention per carrier/lane is a planned follow-up phase —
            this page is reserved in the navigation so the module stays complete, but it will not show fabricated
            capacity numbers until the backing capacity engine exists.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
