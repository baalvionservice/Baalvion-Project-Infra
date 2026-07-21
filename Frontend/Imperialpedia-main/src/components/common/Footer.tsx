'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ImperialpediaMark } from '@/components/icons/ImperialpediaMark';

// ─── Remove stubs and restore your real imports in production ─────────────────
//   import { Container } from '@/design-system/layout/container';
//   import Newsletter from '@/components/common/Newsletter';
//   import { logEvent } from '@/lib/utils/analytics';

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-screen-xl px-6 lg:px-8">{children}</div>
);
// ─────────────────────────────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.17 8.17 0 0 0 4.78 1.53V6.83a4.85 4.85 0 0 1-1.01-.14z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon fill="#2d3a4f" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
];

const NAV_COLUMNS = [
  {
    label: 'Explore',
    links: [
      { label: 'News', href: '/news' },
      { label: 'Investing', href: '/investing' },
      { label: 'Banking', href: '/banking' },
      { label: 'Personal Finance', href: '/personal-finance' },
      { label: 'Economy', href: '/economy' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Dictionary', href: '/terms' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Authors', href: '/authors' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Transparency Hub', href: '/transparency' },
    ],
  },
];

const LEGAL_TRUST_COLUMNS = [
  {
    label: 'Editorial Integrity',
    links: [
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Corrections Policy', href: '/corrections' },
      { label: 'Fact-Checking Policy', href: '/fact-checking' },
      { label: 'Review Policy', href: '/review-policy' },
      { label: 'Ethics Policy', href: '/ethics-policy' },
      { label: 'Conflict of Interest Policy', href: '/conflict-of-interest-policy' },
      { label: 'Diversity Policy', href: '/diversity-policy' },
    ],
  },
  {
    label: 'Content & AI',
    links: [
      { label: 'AI Usage Policy', href: '/ai-usage-policy' },
      { label: 'Comment & Community Policy', href: '/comment-policy' },
      { label: 'Source Attribution Policy', href: '/source-attribution-policy' },
    ],
  },
  {
    label: 'Ads & Disclosures',
    links: [
      { label: 'Advertise', href: '/advertise' },
      { label: 'Advertising Policy', href: '/advertising-policy' },
      { label: 'Sponsored Content Policy', href: '/sponsored-content-policy' },
      { label: 'Affiliate Disclosure', href: '/affiliate-disclosure' },
      { label: 'Ownership Disclosure', href: '/ownership-disclosure' },
    ],
  },
  {
    label: 'Legal & Access',
    links: [
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'DMCA Policy', href: '/dmca-policy' },
      { label: 'Copyright Policy', href: '/copyright-policy' },
      { label: 'Accessibility Statement', href: '/accessibility' },
      { label: 'Careers', href: '/careers' },
    ],
  },
];

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

// A handful of the most-searched-for legal links repeated at the very bottom,
// tiny and pipe-separated — the rest already live in the Legal & Access
// column above; this is a quick-access row, not a duplicate of that nav.
const BOTTOM_LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
  { label: 'Accessibility', href: '/accessibility' },
];

// Shared outlined-pill CTA button — bold, small, uppercase, tracked-out, matching
// the promo-box treatment below (deliberately louder than the calm nav links).
const PILL_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-full border border-white/25 ' +
  'px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white ' +
  'hover:bg-white/10 hover:border-white/40 transition-colors duration-150 no-underline';

// ─── Inline Newsletter ────────────────────────────────────────────────────────
// Replace <InlineNewsletter /> with your real <Newsletter /> component
function InlineNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setStatus('error'); return; }
    setStatus('success');
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="
          w-full rounded px-3.5 py-2.5 text-sm
          bg-white/[0.07] border border-white/[0.12]
          text-slate-200 placeholder:text-slate-500
          outline-none focus:border-blue-400/60
          transition-colors duration-150
        "
      />
      <button type="submit" className={`${PILL_BUTTON_CLASS} w-full bg-blue-500 border-blue-500 hover:bg-blue-600 hover:border-blue-600`}>
        Sign Up Now
      </button>
      {status === 'success' && (
        <p className="text-green-400 text-xs">✓ You&apos;re subscribed!</p>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-xs">Please enter a valid email.</p>
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
      <h2 className="text-lg sm:text-xl font-bold text-white font-headline tracking-tight">
        {title}
      </h2>
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
      className="bg-[#2d3a4f] text-slate-300 pt-14 pb-8"
      role="contentinfo"
    >
      <Container>

        {/* ── Top Grid ─────────────────────────────────────────────── */}
        <div className="
          grid gap-10
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-[220px_1fr_1fr_1fr]
          pb-12 border-b border-white/[0.08]
        ">

          {/* Brand column — logo + newsletter + socials */}
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

            {/* Social icons */}
            <div className="w-full">
              <p className="text-[10px] font-bold text-center md:text-start tracking-[0.18em] uppercase text-slate-100/60 mb-3 font-sans">
                Follow Us
              </p>
              <nav className="flex items-center  gap-4 flex-wrap" aria-label="Social media links">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="text-slate-100 hover:text-white transition-colors duration-150 grid place-items-center"
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.icon}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map((col) => (
            <nav key={col.label} aria-label={`${col.label} links`}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-100/60 mb-3.5 font-sans">
                {col.label}
              </p>
              <ul className="grid grid-cols-2 md:flex md:flex-col gap-3.5 list-none p-0 m-0">
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

        {/* ── Legal, Trust & Editorial Standards ───────────────────── */}
        <div className="grid gap-8 grid-cols-2 lg:grid-cols-4 py-10 border-b border-white/[0.08]">
          {LEGAL_TRUST_COLUMNS.map((col) => (
            <nav key={col.label} aria-label={`${col.label} links`}>
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-100/60 mb-3.5 font-sans">
                {col.label}
              </p>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
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
            </nav>
          ))}
        </div>

        {/* ── Alphabet Row ─────────────────────────────────────────── */}
        <div
          className="
            hidden sm:flex flex-wrap justify-start items-center gap-1
            py-8 border-b border-white/[0.08]
          "
          aria-label="Browse dictionary by letter"
        >
          {ALPHABET.map((letter) => (
            <Link
              key={letter}
              href={`/terms-beginning-with-${letter === '#' ? 'num' : letter.toLowerCase()}`}
              aria-label={
                letter === '#'
                  ? 'Terms beginning with number'
                  : `Terms beginning with ${letter}`
              }
              className="
                text-slate-300 hover:text-white hover:bg-blue-500/15
                text-base sm:text-lg font-medium font-sans
                px-1.5 sm:px-2 py-1.5
                min-w-[26px] sm:min-w-[32px]
                text-center rounded
                transition-colors duration-150
                no-underline
              "
            >
              {letter}
            </Link>
          ))}
        </div>

        {/* ── Bottom Bar ───────────────────────────────────────────── */}
        <div className="pt-7 space-y-3">
          <nav
            className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1.5"
            aria-label="Legal quick links"
          >
            {BOTTOM_LEGAL_LINKS.map((link, i) => (
              <React.Fragment key={link.href}>
                {i > 0 && <span className="text-slate-600 text-[11px]" aria-hidden>|</span>}
                <Link
                  href={link.href}
                  className="text-slate-400 hover:text-white text-[11px] font-sans transition-colors duration-150 no-underline"
                >
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
          <p className="text-slate-500 text-center sm:text-left text-xs font-sans">
            &copy; {new Date().getFullYear()} Imperialpedia. AI Knowledge Infrastructure.
          </p>
        </div>

      </Container>
    </footer>
  );
}