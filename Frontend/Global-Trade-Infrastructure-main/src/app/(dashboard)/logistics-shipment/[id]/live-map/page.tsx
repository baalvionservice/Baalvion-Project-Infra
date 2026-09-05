/**
 * @file logistics-shipment/[id]/live-map/page.tsx
 * @description Redirect to the party-scoped live map.
 *
 * This route used to render the map itself, but it read tradeops `tracking_events` (keyed by
 * shipment UUID) while its own `[id]` segment addresses the legacy integer-PK `trade.shipments`
 * — so it only ever resolved for ids that came from somewhere else. The real page now lives at
 * /logistics-shipment/visibility/[id]/live-map, on the entity it actually queries. Kept as a
 * redirect so existing links and bookmarks land somewhere correct.
 */
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export default function LegacyShipmentLiveMapRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) router.replace(`${PATHS.SHIPMENT_VISIBILITY}/${params.id}/live-map`);
  }, [params?.id, router]);

  return (
    <main className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </main>
  );
}
