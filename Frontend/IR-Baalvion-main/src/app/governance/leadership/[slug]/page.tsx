import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { cmsGetLeadershipMember } from '@/lib/cms';
import { AppConfig } from '@/config';

// Read live from the central CMS on every request so console edits show immediately.
export const dynamic = 'force-dynamic';

const ORIGIN = AppConfig.baseUrl.replace(/\/$/, '');
const absUrl = (u?: string) => (u ? (u.startsWith('http') ? u : `${ORIGIN}${u}`) : undefined);

export interface SingleLeaderPageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SingleLeaderPageParams): Promise<Metadata> {
  const { slug } = await params;
  const leader = await cmsGetLeadershipMember(slug);
  if (!leader) return { title: 'Leader not found | Baalvion' };
  const role = leader.position ? `${leader.title} — ${leader.position}` : leader.title;
  const description = leader.bio || role;
  const image = absUrl(leader.imageUrl);
  return {
    title: `${leader.name} | Leadership`,
    description,
    alternates: { canonical: `/governance/leadership/${leader.slug}` },
    openGraph: {
      title: `${leader.name} — ${role}`,
      description,
      url: `${ORIGIN}/governance/leadership/${leader.slug}`,
      type: 'profile',
      ...(image ? { images: [{ url: image, alt: leader.name }] } : {}),
    },
  };
}

export default async function SingleLeaderPage({ params }: SingleLeaderPageParams) {
  const { slug } = await params;
  const leader = await cmsGetLeadershipMember(slug);
  if (!leader) return notFound();

  const firstName = leader.name.split(' ')[0];
  const role = leader.position ? `${leader.title} — ${leader.position}` : leader.title;
  const pageUrl = `${ORIGIN}/governance/leadership/${leader.slug}`;

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${pageUrl}#person`,
    name: leader.name,
    jobTitle: role,
    ...(leader.bio ? { description: leader.bio } : {}),
    ...(absUrl(leader.imageUrl) ? { image: absUrl(leader.imageUrl) } : {}),
    url: pageUrl,
    worksFor: { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: 'Baalvion' },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Leadership', item: `${ORIGIN}/governance/leadership` },
      { '@type': 'ListItem', position: 2, name: leader.name, item: pageUrl },
    ],
  };

  return (
    <div
      className="min-h-screen bg-white text-[#333333]"
      style={{ fontFamily: '"SF Pro Display","SF Pro Text",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,Arial,sans-serif' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <nav className="bg-white">
        <div className="max-w-[980px] mx-auto px-5 py-[10px] flex items-center gap-1.5 text-[12px] text-[#6e6e73]">
          <Link href="/governance/leadership" className="text-[#0066cc] hover:underline">
            Leadership
          </Link>
          <svg width="5" height="9" viewBox="0 0 5 9" fill="none" aria-hidden="true">
            <path d="M1 1l3 3.5L1 8" stroke="#6e6e73" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{leader.name}</span>
        </div>
      </nav>

      {/* ── Hero — name left + photo right ── */}
      <section className="bg-white max-w-4xl mx-auto overflow-hidden">
        <div className="max-w-[980px] mx-auto h-fit px-5 pt-12 flex flex-col-reverse items-center gap-6 sm:flex-col sm:items-end sm:justify-between sm:pt-14">
          {/* Left — name + title */}
          <div className="w-full pb-4 text-center sm:text-left sm:pb-6 sm:flex-1 sm:min-w-0">
            <h1 className="text-[clamp(26px,4.2vw,44px)] font-semibold tracking-[-0.01em] leading-[1.07] text-black mb-2.5">
              {leader.name}
            </h1>
            <p className="text-[clamp(14px,2vw,20px)] font-normal leading-snug text-[#555555]">
              {role}
            </p>
          </div>

          {/* Right — portrait */}
          {leader.imageUrl && (
            <div className="flex-shrink-0 max-h-[300px] aspect-square self-center w-full sm:self-end sm:w-[clamp(170px,30vw,330px)] sm:max-w-none leading-[0]">
              <Image
                src={leader.imageUrl}
                alt={leader.name}
                width={230}
                height={210}
                className="block w-full h-full object-cover object-top"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Bio ─────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[980px] mx-auto px-5 py-11 grid grid-cols-1 gap-5 md:gap-x-12">
          <div className="flex flex-col gap-5">
            {leader.bio ? (
              <p className="text-[15px] leading-[1.78] text-[#333333]">{leader.bio}</p>
            ) : (
              <p className="text-[15px] leading-[1.78] text-[#333333]">
                {firstName} is a senior member of Baalvion&apos;s leadership team, driving strategy across technology,
                capital markets, and global trade infrastructure. Their work underpins the firm&apos;s mission to build
                a unified operating system for institutional B2B commerce at global scale.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
