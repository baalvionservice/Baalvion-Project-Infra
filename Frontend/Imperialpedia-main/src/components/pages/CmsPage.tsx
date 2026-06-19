import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { sanitizeRichHtml } from '@/lib/sanitize';
import { getCmsPage } from '@/services/data/cms-public';
import { staticPageBySlug } from '@/services/data/static-content';

interface CmsPageProps {
  /** CMS page slug (e.g. "about", "contact", "privacy-policy"). */
  slug: string;
  /** Small uppercase eyebrow label above the title. */
  eyebrow?: string;
  /** Rendered when the CMS has no published page for this slug (or is offline). */
  fallback: React.ReactNode;
  /** Optional content rendered after the CMS body (e.g. a contact form). */
  children?: React.ReactNode;
}

/**
 * Renders an admin-managed CMS `page` document (About / Contact / Privacy, …)
 * inside Imperialpedia's standard narrow page shell.
 *
 * The body is authored and published from admin-platform → cms-service and read
 * via the public delivery API. If the CMS has no published page for this slug —
 * during cutover or when cms-service is offline — the route's built-in static
 * `fallback` is rendered instead, so the page is never empty.
 */
export async function CmsPage({ slug, eyebrow, fallback, children }: CmsPageProps) {
  // Live CMS takes precedence; baked snapshot keeps the page populated when the CMS
  // is offline (e.g. on Vercel); the route's static fallback is the last resort.
  const page = (await getCmsPage(slug)) ?? staticPageBySlug(slug);
  if (!page) return <>{fallback}</>;

  return (
    <main className="min-h-screen bg-background pt-24 pb-32">
      <Container isNarrow>
        <header className="mb-12 space-y-4">
          {eyebrow && (
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase text-primary"
            >
              {eyebrow}
            </Text>
          )}
          <Text variant="h1" className="text-4xl lg:text-5xl font-bold tracking-tight">
            {page.title}
          </Text>
        </header>

        <article
          className="article-body prose prose-lg dark:prose-invert max-w-none"
          // Body is internal, editor-authored content published via the CMS and
          // sanitized server-side (allowlist) before rendering.
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.bodyHtml) }}
        />

        {children}
      </Container>
    </main>
  );
}

export default CmsPage;
