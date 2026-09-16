import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs, ButtonLink, Container } from '@/components/ui';
import { GUIDES, getGuide, readMinutes } from '@/content/guides';
import { CategoryChip, GuideVisual } from '@/components/guides/guide-visual';
import { GuideBody } from '@/components/guides/guide-body';
import { publicMetadata, jsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';

/**
 * Every guide is known at build time, so the whole set is prerendered and an unknown slug is
 * a real 404 with no request to anything.
 *
 * That last part is not incidental. This route is static, which means it is NOT behind a
 * streaming boundary — the status is decided before a byte is sent. Do not add a
 * `loading.tsx` to this segment or to any ancestor of it: that puts the page inside Suspense,
 * Next flushes the shell with a 200, and `notFound()` afterwards can only change the markup.
 * See src/app/ROUTE_LOADING_BOUNDARIES.md — this cost several days once already.
 */
export const dynamicParams = false;

export function generateStaticParams() {
    return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const guide = getGuide((await params).slug);
    if (!guide) return publicMetadata({ title: 'Guides', description: 'Guides', path: '/guides' });
    return publicMetadata({
        title: guide.title,
        description: guide.excerpt,
        path: `/guides/${guide.slug}`,
        image: guide.image?.src,
        type: 'article',
        updated: guide.updated,
    });
}

const updated = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
    const guide = getGuide((await params).slug);
    if (!guide) notFound();

    const more = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

    /*
     * Article and BreadcrumbList.
     *
     * `author` is the organisation, not a person — these are written and reviewed in the
     * repository rather than bylined, and inventing a named author to satisfy a rich-result
     * checklist would be a fabricated credential on legal content.
     *
     * `dateModified` is the date on the guide itself. It is deliberately not the build time:
     * republishing everything as "updated today" on every deploy is a freshness signal that
     * is simply untrue.
     */
    const structured = jsonLd({
        '@graph': [
            {
                '@type': 'Article',
                headline: guide.title,
                description: guide.excerpt,
                dateModified: guide.updated,
                inLanguage: 'en-IN',
                author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
                publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
                mainEntityOfPage: `${SITE.url}/guides/${guide.slug}`,
                ...(guide.image ? { image: `${SITE.url}${guide.image.src}` } : {}),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
                    { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE.url}/guides` },
                    { '@type': 'ListItem', position: 3, name: guide.title, item: `${SITE.url}/guides/${guide.slug}` },
                ],
            },
        ],
    });

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={structured} />

            <div className="border-b border-line bg-gradient-to-b from-rose-soft/70 to-ground">
                <Container className="py-10 sm:py-14">
                    <Breadcrumbs items={[{ href: '/', label: 'Home' }, { href: '/guides', label: 'Guides' }, { label: guide.title }]} />

                    <div className="mt-8 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <CategoryChip category={guide.category} />
                            <span className="text-sm text-muted-2">
                                Updated {updated(guide.updated)} · {readMinutes(guide)} min read
                            </span>
                        </div>
                        <h1 className="heading mt-5 text-balance text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
                            {guide.title}
                        </h1>
                        <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">{guide.excerpt}</p>
                    </div>
                </Container>
            </div>

            <Container className="py-12 sm:py-16">
                <GuideVisual
                    guide={guide}
                    priority
                    sizes="(min-width: 1024px) 48rem, 92vw"
                    className="aspect-[16/9] max-w-3xl rounded-[1.5rem] border border-line shadow-lift"
                />

                {/* max-w-3xl and the larger body size: this is a reading page, and a 100-character
                    line is where people start losing their place. */}
                <div className="mt-12 max-w-3xl">
                    <GuideBody blocks={guide.body} />
                </div>

                <div className="mt-14 max-w-3xl rounded-[1.5rem] border border-line bg-surface p-7">
                    <h2 className="heading text-xl">This is where the people are</h2>
                    <p className="mt-3 leading-relaxed text-muted">
                        Reading is the easy half. Writing your own situation down — privately, visible to
                        nobody until you say otherwise — is what puts you in reach of people who have already
                        had the conversation you are dreading.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <ButtonLink
                            href="/create-case"
                            className="rounded-full border-transparent bg-rose px-7 text-white shadow-lift hover:bg-rose-deep"
                        >
                            Start your story
                        </ButtonLink>
                        <ButtonLink href="/resources" variant="secondary" className="rounded-full px-7">
                            Find real help
                        </ButtonLink>
                    </div>
                </div>

                <section aria-labelledby="more-guides" className="mt-16 border-t border-line pt-10">
                    <h2 id="more-guides" className="heading text-xl">
                        Keep reading
                    </h2>
                    <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                        {more.map((g) => (
                            <li key={g.slug}>
                                <Link
                                    href={`/guides/${g.slug}`}
                                    className="focus-ring group block h-full rounded-[1.25rem] border border-line bg-ground p-4 transition-shadow hover:shadow-lift"
                                >
                                    <GuideVisual guide={g} sizes="(min-width: 640px) 22rem, 92vw" className="aspect-[16/10] rounded-xl" />
                                    <div className="mt-4">
                                        <CategoryChip category={g.category} />
                                        <h3 className="heading mt-3 text-base leading-snug transition-colors group-hover:text-rose">
                                            {g.title}
                                        </h3>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </Container>
        </>
    );
}
