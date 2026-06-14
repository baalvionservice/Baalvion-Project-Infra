import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Users } from 'lucide-react';
import { cmsGetLeadership, type LeadershipMember } from '@/lib/cms';

// Read live from the central CMS on every request so console edits show immediately.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leadership | Baalvion Industries Private Limited',
  description:
    "Meet the executive committee and global leadership driving Baalvion Industries Private Limited's vision for the future of global B2B trade infrastructure.",
  alternates: { canonical: '/governance/leadership' },
  openGraph: {
    title: 'Baalvion Industries — Leadership',
    description: 'The executive committee and global leadership of Baalvion Industries Private Limited.',
    url: 'https://ir.baalvion.com/governance/leadership',
    type: 'website',
  },
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

function MemberCard({ member, featured = false }: { member: LeadershipMember; featured?: boolean }) {
  return (
    <Link href={`/governance/leadership/${member.slug}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gray-100 ${
          featured ? 'aspect-[4/5]' : 'aspect-[4/5]'
        }`}
      >
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={`Portrait of ${member.name}`}
            width={featured ? 520 : 360}
            height={featured ? 650 : 450}
            className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-black text-3xl font-semibold text-white/80">
            {initials(member.name)}
          </div>
        )}
        {/* hover overlay + view-profile affordance */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-xs font-semibold uppercase tracking-widest text-white">View profile</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-black">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="mt-4">
        <h4
          className={`font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary ${
            featured ? 'text-xl' : 'text-base'
          }`}
        >
          {member.name}
        </h4>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">{member.title}</p>
        {member.position && (
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{member.position}</p>
        )}
      </div>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, count }: { eyebrow: string; title: string; count: number }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6 border-b border-gray-200 pb-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{title}</h2>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 text-sm text-gray-400 sm:flex">
        <Users className="h-4 w-4" /> {count}
      </span>
    </div>
  );
}

export default async function LeadershipPage() {
  const { executiveCommittee, functionalLeadership, vicePresidents } = await cmsGetLeadership();

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container relative z-10 mx-auto px-4 py-20 md:py-28">
          <nav className="mb-6 text-xs text-gray-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/governance/overview" className="hover:text-white">Governance</Link>
            <span className="mx-2">/</span>
            <span className="text-primary">Leadership</span>
          </nav>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-primary">Leadership &amp; Governance</p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            The people leading Baalvion Industries
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            Strategic execution at scale — led by a committee of industry pioneers across technology,
            finance and logistics, supported by a deep bench of global functional leaders.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/governance/board-of-directors"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white hover:text-black">
              Board of Directors <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/resources/contact-ir"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">
              Contact Investor Relations
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 text-black md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Executive Committee — featured */}
          {executiveCommittee.length > 0 && (
            <div className="mb-20">
              <SectionHeading eyebrow="Executive Committee" title="Senior leadership" count={executiveCommittee.length} />
              <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
                {executiveCommittee.map((m) => <MemberCard key={m.slug} member={m} featured />)}
              </div>
            </div>
          )}

          {/* Functional Leadership */}
          {functionalLeadership.length > 0 && (
            <div className="mb-20">
              <SectionHeading eyebrow="Global Team" title="Functional Leadership" count={functionalLeadership.length} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                {functionalLeadership.map((m) => <MemberCard key={m.slug} member={m} />)}
              </div>
            </div>
          )}

          {/* Vice Presidents */}
          {vicePresidents.length > 0 && (
            <div className="mb-4">
              <SectionHeading eyebrow="Global Team" title="Vice Presidents" count={vicePresidents.length} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                {vicePresidents.map((m) => <MemberCard key={m.slug} member={m} />)}
              </div>
            </div>
          )}

          {executiveCommittee.length + functionalLeadership.length + vicePresidents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center text-gray-500">
              Leadership profiles will appear here once published.
            </div>
          )}
        </div>
      </section>

      {/* Governance note */}
      <section className="border-t border-gray-200 bg-gray-50 py-16 text-black">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Governance</p>
          <h3 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold leading-snug">
            Disciplined leadership, accountable to shareholders.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-600">
            Our leadership operates under a clear governance framework with independent board oversight.
            Explore how the Board of Directors and its committees safeguard long-term value.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/governance/board-of-directors"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Meet the Board <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/governance/committee-composition"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white">
              Committee composition
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
