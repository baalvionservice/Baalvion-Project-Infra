'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
      { label: 'Simulator', href: '/simulator' },
      { label: 'Banking', href: '/banking' },
      { label: 'Personal Finance', href: '/personal-finance' },
      { label: 'Economy', href: '/economy' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Dictionary', href: '/dictionary' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Advertise', href: '/advertise' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Editorial Process', href: '/editorial-process' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Transparency Hub', href: '/transparency' },
    ],
  },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Editorial Process', href: '/editorial-process' },
  { label: 'Contact Us', href: '/contact' },
];

const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
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
      <button
        type="submit"
        className="
          w-full rounded py-2.5 cursor-pointer
          bg-blue-500 hover:bg-blue-600 active:bg-blue-700
          text-white text-[11px] font-bold tracking-widest uppercase
          transition-colors duration-150
        "
      >
        Newsletter Sign Up
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
              <span
                className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </span>
              <span className="text-xl text-center font-bold tracking-tight text-white font-serif">
                Imperial<span className="text-blue-400">pedia</span>
              </span>
            </Link>

            {/* Newsletter */}
            <InlineNewsletter />

            {/* Social icons */}
            <div className='w-xl mx-auto md:w-full'>
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
            <nav
              key={col.label}
              className=""
              aria-label={`${col.label} links`}
            >

              <ul className="grid md:flex md:flex-col grid-cols-2 md:w-xl gap-3.5 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-slate-100 hover:text-white
                        text-[13px] font-semibold tracking-wide uppercase
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

        {/* ── Alphabet Row ─────────────────────────────────────────── */}
        <div
          className=" hidden 
            sm:flex flex-wrap justify-between items-center gap-1
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
        <div className="
          flex flex-col sm:flex-row justify-between items-center
          gap-4 pt-7 flex-wrap
        ">
          <p className="text-slate-500 text-center text-xs font-sans">
            &copy; {new Date().getFullYear()} Imperialpedia. AI Knowledge Infrastructure.
          </p>

        </div>

      </Container>
    </footer>
  );
}