/**
 * @file logistics-shipment/[id]/tracking/page.tsx
 * @description Redirect to the party-scoped shipment record.
 *
 * This page called `GET /tracking_logs`, which is not a route trade-service serves (the real
 * surfaces are /tracking_events, /tracking_search, /tracking_dashboard and the merged
 * /dashboard/shipments/:id/timeline). It therefore rendered an empty log list for every
 * shipment, and nothing in the app linked to it. The shipment record at
 * /logistics-shipment/visibility/[id] shows the merged timeline — carrier events, status
 * transitions, workflow steps, tracking pings and checkpoints — which is what this page was
 * reaching for. Kept as a redirect rather than deleted so old links resolve.
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export default function LegacyShipmentTrackingRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) router.replace(`${PATHS.SHIPMENT_VISIBILITY}/${params.id}`);
  }, [params?.id, router]);

  return (
    <main className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </main>
  );
}
