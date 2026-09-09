import Link from 'next/link';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/site/page-header';
import { GUIDES, readMinutes } from '@/content/guides';
import { CategoryChip, GuideVisual } from '@/components/guides/guide-visual';
import { publicMetadata, jsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const metadata = publicMetadata({
    title: 'Guides',
    description:
        'Plain-language guides to marrying across caste and religion in India — the Special Marriage Act, what the courts have decided, staying safe, and talking to parents.',
    path: '/guides',
});

/**
 * The reading index.
 *
 * Static content, so this page is fully server-rendered with no data fetch and no
 * `force-dynamic` — which is what makes it indexable, and it is the only part of this
 * platform that should be. Everything a member writes stays out of the index by design.
 */
const [featured, ...rest] = GUIDES;

const updated = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function GuidesPage() {
    const structured = jsonLd({
        '@type': 'ItemList',
        name: 'CanWeMarry guides',
        itemListElement: GUIDES.map((g, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: g.title,
            url: `${SITE.url}/guides/${g.slug}`,
        })),
    });

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={structured} />

            <PageHeader
                title="Guides"
                lead="What the law actually allows, what the courts have already decided, and what tends to help at home. Written and checked by people here — not generated, and not padded out to look thorough."
            />

            <Container className="py-12 sm:py-16">
                {/* ── The featured piece ─────────────────────────────────────── */}
                <article className="group">
                    <Link href={`/guides/${featured.slug}`} className="focus-ring block rounded-[1.75rem]">
                        <GuideVisual
                            guide={featured}
                            priority
                            sizes="(min-width: 1024px) 72rem, 92vw"
                            className="aspect-[16/9] rounded-[1.75rem] border border-line shadow-lift sm:aspect-[21/9]"
                        />
                        <div className="mt-7 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <CategoryChip category={featured.category} />
                                <span className="text-sm text-muted-2">
                                    Updated {updated(featured.updated)} · {readMinutes(featured)} min read
                                </span>
                            </div>
                            <h2 className="heading mt-4 text-balance text-3xl leading-tight tracking-[-0.02em] transition-colors group-hover:text-rose sm:text-4xl lg:text-5xl">
                                {featured.title}
                            </h2>
                            <p className="mt-4 text-lg leading-relaxed text-muted">{featured.excerpt}</p>
                        </div>
                    </Link>
                </article>

                {/* ── Everything else ────────────────────────────────────────── */}
                <h2 className="heading mt-16 border-t border-line pt-10 text-xl sm:mt-20">More guides</h2>

                <ul className="mt-8 space-y-4">
                    {rest.map((g) => (
                        <li key={g.slug}>
                            <Link
                                href={`/guides/${g.slug}`}
                                className="focus-ring group flex flex-col gap-5 rounded-[1.5rem] border border-line bg-ground p-4 transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:gap-7 sm:p-5"
                            >
                                <GuideVisual
                                    guide={g}
                                    sizes="(min-width: 640px) 18rem, 92vw"
                                    className="aspect-[16/10] w-full shrink-0 rounded-2xl sm:aspect-[4/3] sm:w-64"
                                />
                                <div className="min-w-0 sm:py-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <CategoryChip category={g.category} />
                                        <span className="text-sm text-muted-2">
                                            Updated {updated(g.updated)} · {readMinutes(g)} min read
                                        </span>
                                    </div>
                                    <h3 className="heading mt-3 text-balance text-xl leading-snug transition-colors group-hover:text-rose sm:text-2xl">
                                        {g.title}
                                    </h3>
                                    <p className="mt-2.5 leading-relaxed text-muted">{g.excerpt}</p>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                <p className="mt-14 max-w-2xl rounded-2xl border border-line bg-surface p-6 leading-relaxed text-muted">
                    None of this is advice about your own situation, and law in India varies by state and
                    changes. For something that applies to you, the{' '}
                    <Link href="/resources" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-4">
                        resource directory
                    </Link>{' '}
                    lists mediators, counsellors and legal services that volunteers have checked.
                </p>
            </Container>
        </>
    );
}
