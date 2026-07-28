/**
 * @file src/app/(public)/page.tsx
 * @description The authoritative Home Page for the Baalvion OS — a server component
 * that owns SEO (metadata + JSON-LD) and renders the interactive client hero.
 */

import type { Metadata } from 'next';
import { HomeClient } from './_components/home-client';
import { pageMetadata, softwareApplicationJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { getPlatformPulse } from '@/server/public/platform-pulse';
import { listAuthoritiesDirectory } from '@/server/gckb/public-read';

export const metadata: Metadata = pageMetadata({
  title: 'Baalvion — The Global Trade Operating System',
  description:
    'Baalvion is the neutral institutional infrastructure for global trade: run sourcing, RFQs, escrow-secured payments, trade finance, compliance, and logistics on one governed platform trusted by enterprises, banks, and governments worldwide.',
  path: '/',
  keywords: [
    'global trade platform',
    'trade operating system',
    'trade finance',
    'escrow payments',
    'supply chain',
    'logistics',
    'KYC compliance',
    'RFQ marketplace',
    'cross-border trade',
    'Baalvion',
  ],
});

// Reads the DB directly (platform pulse + GCKB authorities) — forced dynamic so
// build doesn't require a reachable DB at build time. See authorities/page.tsx
// for the full rationale.
export const dynamic = 'force-dynamic';

export default async function RootHomePage() {
  // getPlatformPulse() never throws (see its own doc comment). listAuthoritiesDirectory()
  // can throw on a DB outage — the homepage is the site's front door and must stay up
  // through a transient blip, so this specific count degrades to 0 rather than 500ing
  // the whole page (unlike /authorities itself, whose entire purpose requires the DB).
  const [pulse, authorities] = await Promise.all([
    getPlatformPulse(),
    listAuthoritiesDirectory().catch(() => []),
  ]);
  const customsAuthorityCount = authorities.filter((a) => a.kind === 'CUSTOMS').length;

  return (
    <>
      <script {...jsonLdScriptProps(softwareApplicationJsonLd())} />
      <HomeClient pulse={pulse} customsAuthorityCount={customsAuthorityCount} />
    </>
  );
}
