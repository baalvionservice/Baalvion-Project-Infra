'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageOff } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { formatRelative } from '@/lib/utils/format';

interface ImagesOverview {
  withImage: number;
  withoutImage: number;
  coveragePct: number;
  recent: Array<{ id: string; title: string; url: string; imageUrl: string | null; category: string; publishedAt: string }>;
}

export default function NewsImagesPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'Images' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'admin-images-overview'],
    queryFn: () => serviceClients.news.get('/images/overview').then((r) => r.data.data as ImagesOverview),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Coverage"
        description="Real source images extracted from each article's RSS enclosure / media:content / embedded <img> — no CDN re-hosting, source URLs are shown directly"
      />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">With Image</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : data?.withImage ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Without Image</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : data?.withoutImage ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Coverage</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : `${data?.coveragePct ?? 0}%`}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : !data?.recent?.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No articles ingested yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {data.recent.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-md border overflow-hidden"
                >
                  <div className="h-20 bg-muted flex items-center justify-center overflow-hidden">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source domains
                      <img src={a.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <ImageOff className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium truncate">{a.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-[9px] h-4 px-1">{a.category}</Badge>
                      <span className="text-[9px] text-muted-foreground">{formatRelative(a.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
