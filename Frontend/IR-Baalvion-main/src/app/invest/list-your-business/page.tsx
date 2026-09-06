import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, FileSearch, Landmark } from 'lucide-react';
import ListBusinessForm from '@/components/invest/ListBusinessForm';

/**
 * The founder side of the marketplace: post your business so investors can find it.
 *
 * Server-rendered so the pitch above the form is indexable — this is the page founders have to
 * be able to find. The form itself is the only client island.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'List Your Business — Raise From Vetted Investors | Baalvion Invest',
  description:
    'Post your company and your round on Baalvion Invest. Qualified investors review your business, then diligence, terms, signing and funding all happen in a secure deal room.',
  alternates: { canonical: '/invest/list-your-business' },
};

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Post your business',
    body: 'Company details, what you do, and the round you are raising. It stays private until you publish it.',
  },
  {
    icon: FileSearch,
    title: 'Get verified',
    body: 'We run KYC on the company before anything goes live. Nothing reaches investors until that clears.',
  },
  {
    icon: Landmark,
    title: 'Meet investors in a deal room',
    body: 'An interested investor opens a private room. NDA, diligence, term sheet, signing and funding all happen inside it.',
  },
];

export default function ListYourBusinessPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://ir.baalvion.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: base },
          { '@type': 'ListItem', position: 2, name: 'Invest', item: `${base}/invest` },
          { '@type': 'ListItem', position: 3, name: 'List Your Business', item: `${base}/invest/list-your-business` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'List your business and raise from qualified investors',
        description: 'Post your company and your round, get verified, then meet investors in a secure deal room.',
        step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#0a0a0a] to-[#161616] text-white">
        <div className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">For founders</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
            Post your business. Let the right investors come to you.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            Tell investors what you are building and what you are raising. Everything after
            that — diligence, terms, signing, funding — happens in one private room, on the record.
          </p>
          <a href="#post" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Post your business <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-6 py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Step {i + 1}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="post" className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[760px] px-6 py-14">
          <h2 className="text-2xl font-bold tracking-tight">Post your business</h2>
          <p className="mt-2 text-sm text-gray-600">
            Saved as a draft under your account. Nothing is visible to investors until the company
            is verified and you publish a round.
          </p>
          <div className="mt-8">
            <ListBusinessForm />
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-[1180px] px-6 py-10 text-center text-xs text-gray-500">
          Already posted?{' '}
          <Link href="/invest/my-business" className="font-semibold text-primary hover:underline">
            Go to your business dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
