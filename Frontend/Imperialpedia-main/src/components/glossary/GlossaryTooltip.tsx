'use client';

/**
 * GlossaryTooltip — reusable inline glossary hover-card for Imperialpedia.
 *
 * Renders `children` as a dotted-underline trigger. On hover OR keyboard focus
 * it opens an accessible popover (controlled Radix Popover) with the term, a
 * difficulty badge, the short definition, and a "Read more →" link. The tooltip
 * endpoint is fetched on first open, cached in memory, and aborted on unmount.
 * On a missing term / fetch error the children render as plain text.
 *
 * @example
 *   import { GlossaryTerm } from '@/components/glossary/GlossaryTooltip';
 *   <GlossaryTerm slug="pe-ratio">P/E ratio</GlossaryTerm>
 */

import * as React from 'react';
import Link from 'next/link';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || 'http://localhost:3004/api/v1';

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 80;

interface TooltipData {
  term: string;
  slug: string;
  shortDef: string;
  difficulty?: string;
  url?: string;
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: TooltipData }
  | { status: 'error' };

// Module-level in-memory cache shared across all triggers for the session.
const cache = new Map<string, TooltipData>();

/**
 * Fetches the glossary tooltip for a slug on first open, with in-memory caching
 * and AbortController cleanup. Returns a discriminated FetchState plus a lazy
 * `load()` to trigger the request the first time the card opens.
 */
export function useGlossaryTooltip(slug: string): {
  state: FetchState;
  load: () => void;
} {
  const cached = cache.get(slug);
  const [state, setState] = React.useState<FetchState>(
    cached ? { status: 'ready', data: cached } : { status: 'idle' },
  );
  const controllerRef = React.useRef<AbortController | null>(null);
  const startedRef = React.useRef(Boolean(cached));

  React.useEffect(() => () => controllerRef.current?.abort(), []);

  const load = React.useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const hit = cache.get(slug);
    if (hit) {
      setState({ status: 'ready', data: hit });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });

    fetch(`${IMP_API}/glossary/term/${encodeURIComponent(slug)}/tooltip`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        const data = j?.data as TooltipData | undefined;
        if (!data?.term || !data?.shortDef) return Promise.reject('empty');
        cache.set(slug, data);
        setState({ status: 'ready', data });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        // Allow a later retry if the failure was transient.
        startedRef.current = false;
        setState({ status: 'error' });
      });
  }, [slug]);

  return { state, load };
}

function difficultyVariant(difficulty?: string): BadgeProps['variant'] {
  switch (difficulty?.toLowerCase()) {
    case 'beginner':
      return 'secondary';
    case 'advanced':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface GlossaryTermProps {
  slug: string;
  children: React.ReactNode;
  className?: string;
}

export function GlossaryTerm({ slug, children, className }: GlossaryTermProps) {
  const [open, setOpen] = React.useState(false);
  const { state, load } = useGlossaryTooltip(slug);
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const descId = React.useId();

  const clearTimers = React.useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  const scheduleOpen = React.useCallback(() => {
    clearTimers();
    load();
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }, [clearTimers, load]);

  const scheduleClose = React.useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearTimers]);

  const data = state.status === 'ready' ? state.data : undefined;
  const failed = state.status === 'error';

  // If the term errored/missing, render plain children — no broken UI.
  if (failed && !data) {
    return <span className={className}>{children}</span>;
  }

  const href = data?.url || `/glossary/${slug}`;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-describedby={open && data ? descId : undefined}
          onMouseEnter={scheduleOpen}
          onMouseLeave={scheduleClose}
          onFocus={scheduleOpen}
          onBlur={scheduleClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          className={cn(
            'cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-4 outline-none transition-colors hover:decoration-primary focus-visible:decoration-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:rounded-sm',
            className,
          )}
        >
          {children}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          id={descId}
          role="tooltip"
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={clearTimers}
          onMouseLeave={scheduleClose}
          className="z-50 w-72 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        >
          {state.status === 'loading' || !data ? (
            <div className="space-y-2" aria-busy="true">
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold leading-tight">{data.term}</span>
                {data.difficulty ? (
                  <Badge
                    variant={difficultyVariant(data.difficulty)}
                    className="shrink-0 text-[10px] uppercase tracking-wide"
                  >
                    {data.difficulty}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {data.shortDef}
              </p>
              <Link
                href={href}
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
              >
                Read more&nbsp;&rarr;
              </Link>
            </div>
          )}
          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default GlossaryTerm;
