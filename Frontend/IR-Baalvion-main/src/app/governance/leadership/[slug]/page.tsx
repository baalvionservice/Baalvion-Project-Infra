import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Building2, Briefcase, ArrowUpRight } from 'lucide-react';
import { sanitizeRichHtml } from '@/lib/sanitize';

import { cmsGetLeadershipMember } from '@/lib/cms';
import { AppConfig } from '@/config';

// Read live from the central CMS on every request so console edits show immediately.
export const dynamic = 'force-dynamic';

const COMPANY = 'Baalvion Industries Private Limited';
const ORIGIN = AppConfig.baseUrl.replace(/\/$/, '');
const absUrl = (u?: string) => (u ? (u.startsWith('http') ? u : `${ORIGIN}${u}`) : undefined);

export interface SingleLeaderPageParams {
  params: Promise<{ slug: string }>;
}

const TIER_LABEL: Record<string, string> = {
  'executive-committee': 'Executive Committee',
  'functional-leadership': 'Functional Leadership',
  'vice-presidents': 'Vice Presidents',
  'board-of-directors': 'Board of Directors',
};

export async function generateMetadata({ params }: SingleLeaderPageParams): Promise<Metadata> {
  const { slug } = await params;
  const leader = await cmsGetLeadershipMember(slug);
  if (!leader) return { title: `Leader not found | ${COMPANY}` };

  const role = leader.title;
  const fullRole = leader.position ? `${role} — ${leader.position}` : role;
  // SEO description: real bio if present, else a clean role-based sentence (~155 chars).
  const description = (leader.bio?.trim()?.slice(0, 200)) || `${leader.name} is ${role} at ${COMPANY}.`;
  const image = absUrl(leader.imageUrl);
  const url = `${ORIGIN}/governance/leadership/${leader.slug}`;

  return {
    title: `${leader.name} — ${role} | ${COMPANY}`,
    description,
    keywords: [
      leader.name, role, COMPANY, 'Baalvion Industries leadership', 'Baalvion executive team',
      TIER_LABEL[leader.tier] ?? 'leadership', 'investor relations', 'board of directors', 'management',
    ],
    alternates: { canonical: `/governance/leadership/${leader.slug}` },
    openGraph: {
      title: `${leader.name} — ${fullRole}`,
      description,
      url,
      type: 'profile',
      siteName: COMPANY,
      ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: leader.name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${leader.name} — ${role}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function SingleLeaderPage({ params }: SingleLeaderPageParams) {
  const { slug } = await params;
  const leader = await cmsGetLeadershipMember(slug);
  if (!leader) return notFound();

  const firstName = leader.name.split(' ')[0];
  const role = leader.title;
  const fullRole = leader.position ? `${role} — ${leader.position}` : role;
  const tierLabel = TIER_LABEL[leader.tier] ?? 'Leadership';
  const pageUrl = `${ORIGIN}/governance/leadership/${leader.slug}`;
  const image = absUrl(leader.imageUrl);

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${pageUrl}#person`,
    name: leader.name,
    jobTitle: role,
    description: leader.bio || `${leader.name} is ${role} at ${COMPANY}.`,
    ...(image ? { image } : {}),
    url: pageUrl,
    worksFor: {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: COMPANY,
      url: ORIGIN,
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Governance', item: `${ORIGIN}/governance/overview` },
      { '@type': 'ListItem', position: 2, name: 'Leadership', item: `${ORIGIN}/governance/leadership` },
      { '@type': 'ListItem', position: 3, name: leader.name, item: pageUrl },
    ],
  };

  return (
    <div
      className="min-h-screen bg-white text-[#1d1d1f]"
      style={{ fontFamily: '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif' }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Breadcrumb */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-[1100px] items-center gap-1.5 px-6 py-3 text-[12px] text-[#6e6e73]">
          <Link href="/governance/leadership" className="text-[#0066cc] hover:underline">Leadership</Link>
          <span>›</span>
          <span className="truncate">{leader.name}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-6 py-14 md:grid-cols-[1fr_320px] md:py-20">
          <div className="order-2 md:order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0066cc]">{tierLabel}</p>
            <h1 className="mt-3 text-[clamp(30px,5vw,52px)] font-semibold leading-[1.05] tracking-[-0.02em] text-black">
              {leader.name}
            </h1>
            <p className="mt-3 text-[clamp(16px,2.4vw,22px)] font-medium text-[#1d1d1f]">{fullRole}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#6e6e73]">
              <Building2 className="h-4 w-4" /> {COMPANY}
            </p>
          </div>

          <div className="order-1 md:order-2">
            <div className="mx-auto aspect-[4/5] w-[230px] overflow-hidden rounded-2xl bg-gray-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5 md:w-full">
              {leader.imageUrl ? (
                // Plain <img> (not next/image) so it loads reliably whether the photo is a
                // local /photos/* asset or an uploaded absolute CMS URL — no remote allow-list needed.
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={leader.imageUrl} alt={`Portrait of ${leader.name}, ${role} at ${COMPANY}`} className="h-full w-full object-cover object-top" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-black text-5xl font-semibold text-white/80">
                  {leader.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-6 py-14 lg:grid-cols-[1fr_300px]">
        {/* Bio */}
        <article>
          <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Biography</h2>
          {leader.bodyHtml ? (
            <div
              className="leader-richtext text-[16px] leading-[1.85] text-[#333]
                [&_p]:mb-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2
                [&_strong]:font-semibold [&_em]:italic [&_a]:text-[#0066cc] [&_a]:underline
                [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-black
                [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-black
                [&_img]:my-6 [&_img]:rounded-xl [&_img]:w-full [&_figure]:my-6
                [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-[#6e6e73]
                [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066cc] [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[#444]
                [&_hr]:my-10 [&_hr]:border-gray-200"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(leader.bodyHtml) }}
            />
          ) : (
            <div className="space-y-5 text-[16px] leading-[1.85] text-[#333]">
              <p>
                {leader.name} serves as {role} at {COMPANY}, where {firstName} leads with a focus on
                disciplined execution, long-term value creation and operational excellence across the
                organisation.
              </p>
              <p>
                {firstName}&apos;s work supports the company&apos;s mission to build resilient,
                technology-led infrastructure for global B2B commerce — and to deliver sustained,
                transparent value to shareholders and partners.
              </p>
            </div>
          )}
        </article>

        {/* At a glance */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">At a glance</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#0066cc]" />
                <div><dt className="text-[#6e6e73]">Role</dt><dd className="font-medium text-black">{fullRole}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0066cc]" />
                <div><dt className="text-[#6e6e73]">Organisation</dt><dd className="font-medium text-black">{COMPANY}</dd></div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0066cc]" />
                <div><dt className="text-[#6e6e73]">Group</dt><dd className="font-medium text-black">{tierLabel}</dd></div>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/resources/contact-ir" className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                <Mail className="h-4 w-4" /> Contact Investor Relations
              </Link>
              <Link href="/governance/leadership" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4" /> All leadership
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
