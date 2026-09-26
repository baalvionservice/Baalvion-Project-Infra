'use client';

/**
 * /newsroom/<site-slug> — the readable address for a desk.
 *
 * The workspace itself lives under the website's own tree, where the CMS role
 * middleware already scopes every request by websiteId. This resolves the slug
 * an editor can actually type and remember, then hands over. The redirect is a
 * replace so the UUID URL does not end up in the back button.
 */

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebsites } from '@/lib/queries/cms-websites.queries';

interface WebsiteRow { id: string; slug: string; name: string }

export default function NewsroomBySlug({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = use(params);
  const router = useRouter();
  const { data, isLoading } = useWebsites({ limit: 100 });

  const sites: WebsiteRow[] = (data?.data as WebsiteRow[] | undefined) ?? [];
  const match = sites.find((s) => s.slug === siteSlug);

  useEffect(() => {
    if (match) router.replace(`/cms/websites/${match.id}/newsroom`);
  }, [match, router]);

  if (isLoading || match) {
    return (
      <p className="p-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Opening {siteSlug} newsroom…
      </p>
    );
  }

  return (
    <div className="p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-destructive">
        No website with the slug “{siteSlug}”
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Known desks: {sites.length ? sites.map((s) => s.slug).join(', ') : 'none visible to this account'}
      </p>
    </div>
  );
}
