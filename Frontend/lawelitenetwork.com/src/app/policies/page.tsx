import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import {
  ShieldCheck,
  FileText,
  Cookie,
  Gavel,
  ClipboardList,
  BadgeCheck,
  MessageSquareWarning,
  Wrench,
  Handshake,
  Megaphone,
  Users,
  Accessibility,
} from 'lucide-react';

interface PolicyLink {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CORE_POLICIES: PolicyLink[] = [
  {
    href: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'What we collect, why, and the choices you have over your data.',
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/terms-of-service',
    title: 'Terms of Service',
    description: 'The rules for using Law Elite Network, including our legal disclaimer.',
    icon: <FileText className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/cookie-policy',
    title: 'Cookie Policy',
    description: 'How cookies and similar technologies are used across the site.',
    icon: <Cookie className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/editorial-disclosure-policy',
    title: 'Editorial, DMCA & Disclosure Policy',
    description: 'Source attribution, editorial independence, copyright, and advertising disclosure.',
    icon: <Gavel className="w-5 h-5 text-blue-600" />,
  },
];

const EDITORIAL_POLICIES: PolicyLink[] = [
  {
    href: '/editorial-standards',
    title: 'Editorial Standards',
    description: 'How our content is researched, written, and fact-checked.',
    icon: <BadgeCheck className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/editorial-process',
    title: 'Editorial Process',
    description: 'The step-by-step process every article goes through before publication.',
    icon: <ClipboardList className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/corrections',
    title: 'Corrections Policy',
    description: 'How we handle and disclose corrections to published content.',
    icon: <Wrench className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/comment-policy',
    title: 'Comment & Review Policy',
    description: 'Guidelines for reader comments and reviews on the site.',
    icon: <MessageSquareWarning className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/conflict-of-interest-policy',
    title: 'Conflict of Interest Policy',
    description: 'How we identify and disclose potential conflicts of interest.',
    icon: <Handshake className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/sponsored-content-policy',
    title: 'Sponsored Content Policy',
    description: 'How sponsored or paid content is labeled and kept separate from editorial coverage.',
    icon: <Megaphone className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/diversity-policy',
    title: 'Diversity Policy',
    description: 'Our commitment to diverse perspectives across our contributor network.',
    icon: <Users className="w-5 h-5 text-blue-600" />,
  },
];

const SITE_POLICIES: PolicyLink[] = [
  {
    href: '/accessibility',
    title: 'Accessibility Statement',
    description: 'Our WCAG 2.2 AA commitment and how to report an accessibility barrier.',
    icon: <Accessibility className="w-5 h-5 text-blue-600" />,
  },
];

export default function PoliciesIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Accuracy &amp; Trust
              </span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Policies &amp; Guidelines
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
              Every policy that governs how Law Elite Network is written, published, and operated, in one place.
            </p>
          </header>

          <PolicyGroup title="Core Policies" links={CORE_POLICIES} />
          <PolicyGroup title="Editorial Policies" links={EDITORIAL_POLICIES} />
          <PolicyGroup title="Site Policies" links={SITE_POLICIES} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function PolicyGroup({ title, links }: { title: string; links: PolicyLink[] }) {
  return (
    <section className="mb-14">
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-400 mb-5">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-3 p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              {link.icon}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight mb-1">{link.title}</p>
              <p className="text-sm text-slate-500 leading-snug">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
