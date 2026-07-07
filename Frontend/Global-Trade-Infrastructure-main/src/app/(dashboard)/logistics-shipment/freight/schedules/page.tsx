'use client';

import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';

export default function FreightSchedulesPage() {
  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Freight Schedules</h1>
        <p className="text-sm text-muted-foreground">Carrier departure/arrival calendars — weekly sailings, flight schedules, rail schedules, truck availability.</p>
      </div>

      <FreightNavTabs />

      <Card>
        <CardContent className="py-20 flex flex-col items-center gap-3 text-center">
          <CalendarClock className="h-10 w-10 text-muted-foreground/40" />
          <h2 className="font-bold">Schedule data isn't wired up yet</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            This phase of Freight Management shipped the Carrier Directory, Rate Engine, Quotes and Bookings.
            Carrier departure/arrival calendars are a planned follow-up phase — this page is reserved in the
            navigation so the module stays complete, but it will not show fabricated schedule data until the
            backing schedule engine and carrier feed integrations exist.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
