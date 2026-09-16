import type { Metadata } from 'next';
import { notFoundIfMissing } from '@/lib/api/not-found';
import { Badge, Breadcrumbs, ButtonLink, Card, CardBody, Container, ErrorState } from '@/components/ui';
import { resources } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { publicMetadata, privateMetadata } from '@/lib/seo';

/**
 * Per-entry metadata, generated from the volunteer-written summary of a published entry.
 * An unpublished one is left out of the index entirely — a half-checked referral should
 * not be discoverable, and the page 404s for the public anyway.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await resources.getBySlug(slug, await serverOptions());
  if (!result.ok || !result.data.isPublished) return privateMetadata('Resource');
  return publicMetadata({
    title: result.data.title,
    description: result.data.summary,
    path: `/resources/${slug}`,
  });
}
export const dynamic = 'force-dynamic';

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await resources.getBySlug(slug, await serverOptions());
  if (!result.ok) {
    // An unpublished entry 404s for anyone without curator standing, so a genuine 404 is the
    // complete answer. A transport or server failure is not, and must not be reported as one.
    const failure = notFoundIfMissing(result.error);
    return (
      <Container width="prose" className="py-16">
        <ErrorState as="h1" message={failure.message} />
      </Container>
    );
  }

  const r = result.data;

  return (
    <Container width="prose" className="py-10">
      <Breadcrumbs items={[
        { href: '/', label: 'Home' },
        { href: '/resources', label: 'Resources' },
        { href: `/resources?category=${r.category}`, label: r.category.toLowerCase() },
        { label: r.title },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{r.category.toLowerCase()}</Badge>
        {r.countryCode && <Badge>{r.countryCode}</Badge>}
        {!r.isPublished && <Badge tone="warn">Not published</Badge>}
      </div>

      <h1 className="heading mt-4 text-3xl">{r.title}</h1>
      <p className="mt-3 text-body leading-relaxed text-muted">{r.summary}</p>

      {r.providerName && (
        <p className="mt-4 text-sm text-muted-2">
          Provided by {r.providerName}
          {(r.region || r.countryCode) && <> · {[r.region, r.countryCode].filter(Boolean).join(', ')}</>}
        </p>
      )}

      {r.body && <div className="mt-8 whitespace-pre-line text-body leading-relaxed">{r.body}</div>}

      {r.url && (
        <div className="mt-8">
          <ButtonLink href={r.url}>Visit this service</ButtonLink>
          <p className="mt-2 text-xs text-muted-2">This link leaves CanWeMarry.</p>
        </div>
      )}

      {(r.category === 'LEGAL' || r.category === 'RIGHTS') && (
        <Card className="mt-10">
          <CardBody>
            <p className="text-sm leading-relaxed text-muted">
              This is general information, not advice about your situation, and reading it creates no
              professional relationship. Laws differ by jurisdiction and change over time — speak to a
              qualified adviser where you live before acting on anything here.
            </p>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}