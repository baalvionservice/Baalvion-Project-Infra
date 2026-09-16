import Link from 'next/link';
import {
  Badge, Breadcrumbs, ButtonLink, Card, CardBody, CardTitle, Container,
  EmptyState, ErrorState, Section,
} from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { resources } from '@/lib/api';
import { serverOptions } from '@/lib/api/server';
import { publicMetadata } from '@/lib/seo';


export const metadata = publicMetadata({
  title: 'Resources',
  description: 'Mediation services, counselling, legal information and safety planning — added and checked by volunteers.',
  path: '/resources',
});

export const dynamic = 'force-dynamic';

/**
 * The directory's categories.
 *
 * These map to the values the schema's CHECK constraint permits, so a category shown here
 * is one the backend can actually store. Each carries a description because "Legal" alone
 * tells someone in difficulty nothing about whether it is the right place to look.
 */
const CATEGORIES = [
  { value: '', label: 'All', blurb: 'Everything volunteers have checked.' },
  { value: 'MEDIATION', label: 'Family conversations', blurb: 'Mediation services and structured ways to open a difficult conversation.' },
  { value: 'COUNSELLING', label: 'Emotional support', blurb: 'Counsellors and services for the strain this puts on people.' },
  { value: 'LEGAL', label: 'Legal information', blurb: 'General information about rights around marriage and family. Not advice about your situation.' },
  { value: 'RIGHTS', label: 'Rights', blurb: 'What the law says you are entitled to, in general terms.' },
  { value: 'SAFETY', label: 'Safety', blurb: 'Safety planning and services for when a situation is not safe.' },
  { value: 'FINANCIAL', label: 'Practical and financial', blurb: 'Housing, money and the practical side of leaving or staying.' },
  { value: 'OTHER', label: 'Community support', blurb: 'Groups and organisations that work with families in conflict.' },
];

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const result = await resources.list({ pageSize: 60, category }, await serverOptions());
  const active = CATEGORIES.find((c) => c.value === (category ?? '')) ?? CATEGORIES[0];

  return (
    <>
      <PageHeader
        title="Resources"
        lead="Mediation services, counselling, legal information and safety planning — added and checked by volunteers. Nothing here is generated, and nothing here is advice about your particular situation."
      />

      <Container className="py-10">
        <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Resources' }]} />

        <nav aria-label="Resource categories" className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = (category ?? '') === c.value;
            return (
              <Link
                key={c.label}
                href={c.value ? `/resources?category=${c.value}` : '/resources'}
                aria-current={on ? 'page' : undefined}
                className={`focus-ring inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors ${
                  on ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                     : 'border-line-strong bg-surface text-muted hover:text-foreground'
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </nav>

        <Section title={active?.label ?? 'All'} description={active?.blurb}>
          {!result.ok ? (
            <ErrorState message={result.error.message} action={<ButtonLink href="/resources" variant="secondary">Try again</ButtonLink>} />
          ) : result.data.length === 0 ? (
            <EmptyState
              title="Nothing listed here yet"
              description="A volunteer verifies each service before it appears. An empty category means nothing has been checked for it yet — not that no help exists."
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {result.data.map((r) => (
                <li key={r.id}>
                  <Card href={`/resources/${r.slug}`} className="h-full">
                    <CardBody className="flex h-full flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="accent">{r.category.toLowerCase()}</Badge>
                        {r.countryCode && <Badge>{r.countryCode}</Badge>}
                        {!r.isPublished && <Badge tone="warn">Draft</Badge>}
                      </div>
                      <CardTitle className="mt-3 text-base">{r.title}</CardTitle>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{r.summary}</p>
                      {r.providerName && <p className="mt-auto pt-4 text-xs text-muted-2">Provided by {r.providerName}</p>}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <section className="mt-12 max-w-2xl space-y-4 border-t border-line pt-8">
          <h2 className="heading text-lg">Information here, advice elsewhere</h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted">
            <p>
              <span className="font-medium text-foreground">What this directory is:</span> general
              information, and pointers to organisations that a volunteer has checked exists and
              does what it says. It is a starting point for finding help.
            </p>
            <p>
              <span className="font-medium text-foreground">What it is not:</span> advice about your
              situation. Nobody here has read your case, nothing on this page takes your
              circumstances into account, and reading it creates no professional relationship of
              any kind. We are not lawyers, doctors or therapists, and we do not employ any.
            </p>
            <p>
              Laws and services differ by country and change over time. Before acting on anything
              you read here, speak to a qualified adviser where you live — a listing in this
              directory is not a recommendation, an endorsement, or a statement about quality.
            </p>
          </div>
        </section>
      </Container>
    </>
  );
}