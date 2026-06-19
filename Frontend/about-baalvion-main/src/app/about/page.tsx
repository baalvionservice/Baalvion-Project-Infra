import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { SubPageHero } from '@/components/sub-page-hero';
import { cmsGetAboutPages } from '@/lib/cms';
import { JsonLd } from '@/components/json-ld';
import { BASE_URL, SITE_NAME, breadcrumbSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

const TITLE = 'About Baalvion | Mission, Vision & Story';
const DESCRIPTION =
  'Who we are, why we exist, and where we are going. Baalvion Industries builds the unified operating system for global trade, finance, and compliance.';
const URL = `${BASE_URL}/about`;
const OG = `${BASE_URL}/api/og?title=${encodeURIComponent('About Baalvion')}&eyebrow=${encodeURIComponent('Baalvion Industries')}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL, siteName: SITE_NAME, images: [{ url: OG, width: 1200, height: 630 }], type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG] },
};

const STATIC_LINKS = [
  { title: 'What We Do', excerpt: 'The Baalvion Operating System and the platform layers that power global commerce.', href: '/company' },
  { title: 'Company Structure', excerpt: 'One foundation operating across three layers: corporate, platform, and independent brands.', href: '/structure' },
  { title: 'Philosophy', excerpt: 'The principles Baalvion builds against: permanence, systems, discipline, and trust.', href: '/philosophy' },
  { title: 'Leadership & Founders', excerpt: 'The people steering the Baalvion Group.', href: '/leadership' },
  { title: 'Careers', excerpt: 'Build infrastructure-grade software with us.', href: '/careers' },
  { title: 'Trust & Security', excerpt: 'How we keep the platform secure, compliant, and auditable.', href: '/trust' },
];

export default async function AboutPage() {
  const pages = await cmsGetAboutPages();
  const dynamic = pages.map((p) => ({ title: p.title, excerpt: p.excerpt || '', href: `/about/${p.slug}` }));
  const cards = [...dynamic, ...STATIC_LINKS];

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'About', url: '/about' }])} />
      <Navbar />
      <main>
        <SubPageHero category="Baalvion Industries" title="About Baalvion" />
        <div className="section-container py-20">
          <p className="max-w-3xl text-lg text-gray-600 leading-relaxed mb-12">{DESCRIPTION}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <h2 className="text-xl font-bold text-[#111111] group-hover:text-[#007185] transition-colors">{c.title}</h2>
                {c.excerpt && <p className="mt-3 text-sm text-gray-500 leading-relaxed flex-1">{c.excerpt}</p>}
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                  Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
