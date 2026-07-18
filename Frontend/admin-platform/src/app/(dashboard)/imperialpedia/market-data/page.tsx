'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { useUIStore } from '@/lib/store/uiStore';
import { SyncHealthPanel } from '@/components/imperialpedia/SyncHealthPanel';

export default function MarketDataPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([{ label: 'Imperialpedia', href: '/imperialpedia' }, { label: 'Market Data' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Data"
        description="Live-market-data sync health for /market-news, /world and /markets/quote/* — imperialpedia-service's own asset_summaries pipeline, synced from cms-service."
      />
      <SyncHealthPanel />
    </div>
  );
}
