'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ImperialpediaMark } from '@/components/icons/ImperialpediaMark';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { PreferredSourceButton } from '@/components/common/PreferredSourceButton';

// ─── Remove stubs and restore your real imports in production ─────────────────
//   import { Container } from '@/design-system/layout/container';
//   import Newsletter from '@/components/common/Newsletter';
//   import { logEvent } from '@/lib/utils/analytics';

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-screen-xl px-6 lg:px-8">{children}</div>
);
// ─────────────────────────────────────────────────────────────────────────────

// Core site navigation — kept separate from the Company/Editorial/Legal
// columns below, which are policy & about-the-company links, not site nav.
// "Dictionary" (/terms) intentionally omitted — glossary is offline pending
// AdSense approval, see src/config/glossary.ts.
// 2026-09-04: was News/Investing/Banking/Personal Finance/Economy/Reviews —
// four of those six (Investing, Banking, Personal Finance, Economy) are
// retired categories that 301 to / (see next.config.ts). This footer column
// was never updated when the Navbar was fixed for the same issue. Replaced
// with the site's actual live sections.
const EXPLORE_COLUMN = {
  label: 'Explore',
  links: [
    { label: 'Stocks', href: '/stocks' },
    { label: 'Budgeting', href: '/budgeting-basics' },
    { label: 'Scams & Fraud Protection', href: '/fraud-protection' },
    { label: 'Market News', href: '/market-news' },
    { label: 'Financial Tools', href: '/financial-tools' },
    { label: 'News', href: '/news' },
    { label: 'Reviews', href: '/reviews' },
  ],
};

// Essential company/editorial/legal links only — pruned from a much longer list
// of policy and disclosure pages (advertising policy, ownership disclosure,
// ethics policy, diversity policy, source-attribution policy, DMCA, etc.) that
// added clutter without helping a reader. Those pages still exist for anyone
// who links to them directly; they're just no longer part of the footer's
// primary navigation.
const FOOTER_COLUMNS = [
  EXPLORE_COLUMN,
  {
    label: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Our Authors', href: '/authors' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    label: 'Editorial',
    links: [
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Fact-Checking Policy', href: '/fact-checking' },
      { label: 'Corrections Policy', href: '/corrections' },
    ],
  },
  {
    label: 'Legal & Privacy',
    links: [
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Sitemap', href: '/sitemap.xml' },
    ],
  },
];

// Shared outlined-pill CTA button — bold, small, uppercase, tracked-out, matching
// the promo-box treatment below (deliberately louder than the calm nav links).
const PILL_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-full border border-white/25 ' +
  'px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white ' +
  'hover:bg-white/10 hover:border-white/40 transition-colors duration-150 no-underline';

// ─── Inline Newsletter ────────────────────────────────────────────────────────
// Posts to the same /api/newsletter route as components/common/Newsletter.tsx
// and the homepage's NewsletterBand, restyled to fit this footer column.
function InlineNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setStatus('error'); setMessage('Please enter a valid email.'); return; }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Thanks for signing up.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
        className="
          w-full rounded px-3.5 py-2.5 text-sm
          bg-white/[0.07] border border-white/[0.12]
          text-slate-200 placeholder:text-slate-500
          outline-none focus:border-blue-400/60
          transition-colors duration-150
        "
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`${PILL_BUTTON_CLASS} w-full bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600 disabled:opacity-70`}
      >
        {status === 'loading' ? 'Signing up…' : 'Sign Up Now'}
      </button>
      {status === 'success' && (
        <p className="text-green-400 text-xs">✓ {message}</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-xs">{message}</p>
      )}
    </form>
  );
}

// ─── Promo Row (News Tips / Advertise / Newsletter) ────────────────────────────
// Deliberately the loudest thing in the footer — bold ~20px headers over a
// short blurb and an outlined pill CTA, so the footer reads with real
// hierarchy (promo > nav column labels > nav links > legend) instead of
// every block being the same small muted-uppercase treatment.
function PromoBox({
  title,
  blurb,
  cta,
  href,
  children,
}: {
  title: string;
  blurb: string;
  cta?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg sm:text-xl font-bold text-white font-headline tracking-tight">
        {title}
      </h3>
      <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
        {blurb}
      </p>
      {children}
      {cta && href && (
        <Link href={href} className={PILL_BUTTON_CLASS}>
          {cta}
        </Link>
      )}
    </div>
  );
}

// ─── Main Footer ──────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer
      className="bg-[#0B1528] text-white pt-14 pb-8 border-t border-[#16284A]"
      role="contentinfo"
    >
      <Container>

        {/* ── Top Grid ─────────────────────────────────────────────── */}
        <div className="
          grid gap-10
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-[220px_1fr_1fr_1fr_1fr]
          pb-12 border-b border-white/[0.08]
        ">

          {/* Brand column — logo + newsletter */}
          <div className="flex flex-col gap-7 sm:col-span-2 lg:col-span-1">

            {/* Logo */}
            <Link
              href="/"
              className="inline-flex items-center mx-auto gap-2.5 outline-none w-fit md:w-full"
              aria-label="Imperialpedia Home"
            >
              <ImperialpediaMark className="w-7 h-7 flex-shrink-0 text-white" />
              <span className="text-xl text-center font-bold tracking-tight text-white font-headline">
                Imperial<span className="text-blue-400">pedia</span>
              </span>
            </Link>
          </div>

          {/* Nav columns — grid layout on tablet/desktop; a compact accordion
              takes over below md so four full columns don't stack into one
              long scroll on a phone. */}
          <div className="hidden md:contents">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.label} aria-label={`${col.label} links`}>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-100/60 mb-3.5 font-sans">
                  {col.label}
                </p>
                <ul className="flex flex-col gap-3.5 list-none p-0 m-0">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="
                          text-slate-300 hover:text-white
                          text-[13px] font-medium
                          font-sans transition-colors duration-150
                          no-underline
                        "
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Mobile accordion — same four columns, collapsed by default. */}
          <Accordion type="single" collapsible className="md:hidden sm:col-span-2 -mb-2">
            {FOOTER_COLUMNS.map((col) => (
              <AccordionItem key={col.label} value={col.label} className="border-white/[0.08]">
                <AccordionTrigger className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-100/60 font-sans hover:no-underline py-3.5 [&>svg]:text-slate-400">
                  {col.label}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-3 list-none p-0 m-0">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-slate-300 hover:text-white text-[13px] font-medium font-sans transition-colors duration-150 no-underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* ── Promo Row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 py-12 border-b border-white/[0.08]">
          <PromoBox
            title="Have a Tip?"
            blurb="Spotted an error, or have a story we should be covering? We want to hear from you."
            cta="Get in Touch"
            href="/contact"
          />
          <PromoBox
            title="Advertise With Us"
            blurb="Reach an engaged personal-finance and markets audience alongside our editorial coverage."
            cta="Learn More"
            href="/advertise"
          />
          <PromoBox title="Get Our Newsletter" blurb="Free weekly insights on markets, investing, and personal finance, delivered to your inbox.">
            <InlineNewsletter />
          </PromoBox>
        </div>

        {/* ── Bottom Bar ───────────────────────────────────────────── */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-center sm:text-left text-xs font-sans">
            &copy; {new Date().getFullYear()} Imperialpedia. All rights reserved.
          </p>
          <PreferredSourceButton theme="dark" />
        </div>

      </Container>
    </footer>
  );
}
