import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/docs/breadcrumbs';
import { PrevNext } from '@/components/docs/prev-next';
import { Toc, type TocEntry } from '@/components/docs/toc';

export function DocPage({
  pathname,
  title,
  description,
  toc = [],
  children,
}: {
  pathname: string;
  title: string;
  description?: string;
  toc?: TocEntry[];
  children: ReactNode;
}) {
  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <Breadcrumbs pathname={pathname} title={title} />
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-lg leading-relaxed text-muted">{description}</p>}
        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">{children}</div>
        <PrevNext pathname={pathname} />
      </article>
      <Toc items={toc} />
    </div>
  );
}
