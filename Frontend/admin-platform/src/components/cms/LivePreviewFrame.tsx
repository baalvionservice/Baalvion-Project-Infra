'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestPreviewToken } from '@/lib/queries/cms-content.queries';

interface Props {
  contentId: string;
  websiteDomain?: string | null;
}

/**
 * Real live preview: fetches a short-lived token from cms-service, then embeds the
 * target site's own /api/preview URL in an iframe — this renders the actual page
 * (real theme, layout, unpublished edits included) instead of the generic block
 * renderer in ContentPreview.tsx.
 */
export default function LivePreviewFrame({ contentId, websiteDomain }: Props) {
  const { mutate: requestToken, isPending } = useRequestPreviewToken();
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!websiteDomain) {
      setError('This website has no live domain configured yet.');
      return;
    }
    setSrc(null);
    setError(null);
    setLoaded(false);
    requestToken(contentId, {
      onSuccess: (data) => {
        const host = data.domain ?? websiteDomain;
        const qs = new URLSearchParams({ slug: data.slug, exp: String(data.exp), token: data.token });
        setSrc(`https://${host.replace(/^https?:\/\//, '').replace(/\/+$/, '')}/api/preview?${qs.toString()}`);
      },
      onError: () => setError('Could not start a live preview session for this item.'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-request whenever this panel is (re)mounted for a given content item
  }, [contentId, websiteDomain]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
        <p>{error}</p>
        <p className="text-xs">Use the "Preview" tab above for a plain content preview instead.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {(isPending || !loaded) && (
        <div className="absolute inset-0 z-10 space-y-3 bg-background p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
      {src && (
        <iframe
          key={src}
          src={src}
          title="Live preview"
          className="h-full w-full border-0"
          onLoad={() => setLoaded(true)}
        />
      )}
      {src && (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground shadow hover:text-foreground"
          title="Open in a new tab (in case the embedded frame is blocked)"
        >
          <ExternalLink className="h-3 w-3" />
          Open in new tab
        </a>
      )}
    </div>
  );
}
