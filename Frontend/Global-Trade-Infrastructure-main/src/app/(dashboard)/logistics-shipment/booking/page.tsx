import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { BookingWizard } from './booking-wizard';

/**
 * @file booking/page.tsx
 * @description Container booking wizard. The wizard reads `?origin=&destination=`
 * to pick up a corridor chosen on the Port Network page, and `useSearchParams`
 * needs a Suspense boundary above it or the whole route opts out of prerendering.
 */
export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center bg-muted/20 p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the booking wizard…
          </p>
        </main>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}
