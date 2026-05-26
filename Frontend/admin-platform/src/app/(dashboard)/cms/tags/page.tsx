'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsites } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function GlobalTagsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useWebsites({ status: 'active' });

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS', href: '/cms' }, { label: 'Tags' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Select a website to manage its tags"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.data ?? []).map((w) => (
            <Link key={w.id} href={`/cms/websites/${w.id}/categories`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.domain}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
          {!data?.data.length && (
            <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">
              No active websites found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
