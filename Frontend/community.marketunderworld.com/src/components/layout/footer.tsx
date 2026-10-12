"use client"

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useSetup } from '@/lib/setup';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Explore',
    links: [
      ['Everything we offer', '/services'],
      ['Marketplace', '/marketplace'],
      ['Clubs', '/clubs'],
      ['Events and DJ nights', '/clubs/events'],
      ['Locals', '/locals'],
      ['Calendar', '/calendar'],
      ['Live sessions', '/live-sessions'],
      ['Forum', '/forum'],
    ],
  },
  {
    title: 'Trade and wallet',
    links: [
      ['Buyer pass', '/buyer-pass'],
      ['Load your wallet', '/payments'],
      ['Intermediaries', '/escrow/intermediaries'],
      ['Become a seller', '/seller/onboarding'],
      ['Become an intermediary', '/escrow/apply-agent'],
      ['Gift cards', '/gift-cards'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Get started', '/onboarding'],
      ['Support', '/support'],
      ['Contact us', '/contact'],
      ['Grievance', '/grievance'],
      ['Sign in', '/auth/signin'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['About', '/about'],
      ['Terms of use', '/terms'],
      ['Privacy policy', '/privacy'],
      ['Refund policy', '/refund-policy'],
      ['Shipping policy', '/shipping-policy'],
    ],
  },
];

export const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { setup } = useSetup();
  const columns = COLUMNS.map((col) => col.title === 'Help'
    ? { ...col, links: col.links.map(([label, href]): [string, string] => (href === '/auth/signin' ? (isAuthenticated ? ['My dashboard', '/dashboard'] : [label, href]) : [label, href])) }
    : col);
  return (
  <footer className="bg-[#07080a] border-t border-[#1F232B] text-gray-400">
    <div className="max-w-[1200px] mx-auto px-5 sm:px-6 pt-12 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-10">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Hell Road home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" className="w-9 h-9 rounded object-cover border border-white/10" />
            <span className="text-white font-bold tracking-wide">Hell Road</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-gray-500 max-w-xs">
            Clubs, locals, events, a marketplace and a forum in one community.
          </p>
          {isAuthenticated ? (
            <Link href={setup && !setup.complete ? '/onboarding' : '/dashboard'} className="mt-5 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              {setup && !setup.complete ? `Finish setting up (${setup.done} of ${setup.total} done)` : 'Go to my dashboard'}
            </Link>
          ) : (
            <Link href="/auth/registration" className="mt-5 inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Create an account
            </Link>
          )}
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
            <ul className="space-y-1">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-block py-1.5 text-sm text-gray-400 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-[#1F232B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <span>© {new Date().getFullYear()} Hell Road. All rights reserved.</span>
        <span className="flex gap-5">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </span>
      </div>
    </div>
  </footer>
);
};
