'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useCmsPage } from '@/lib/queries/cms.queries';

// Legacy single-site CMS page editor — redirects to new multi-site editor when website context available
export default function LegacyCmsPageEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: page, isLoading } = useCmsPage(Number(id));

  useEffect(() => {
    if (!isLoading && !page) {
      router.replace('/cms/pages');
    }
  }, [isLoading, page, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
