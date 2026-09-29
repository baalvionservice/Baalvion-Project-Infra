'use client';

import { useEffect } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';

export default function ReviewsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Reviews' }]);
  }, [setBreadcrumbs]);

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Star className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Reviews"
        description="Manage customer reviews and ratings"
      />

      <Card>
        <CardContent className="py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">Reviews Coming Soon</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Product review moderation will be available in the next update. Reviews will be stored and managed through the commerce-service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
