import { productsByCategory, counts, STATUS_LABEL } from '@/lib/products';

/**
 * /llms.txt — a plain-text summary of the portfolio for AI crawlers and answer engines.
 *
 * Generated from the registry, so it can never describe a portfolio that does not exist. It states
 * operating status alongside every entry for the same reason the site does: a model summarising
 * this company should not tell someone a product is available when it is not.
 *
 * Served as a route rather than a static file so a newly registered product appears here the
 * moment it appears everywhere else.
 */
export const dynamic = 'force-static';

const BASE = 'https://baalvionstack.com';

export function GET() {
  const { total, live, inDevelopment, internal } = counts();

  const lines: string[] = [
    '# Baalvion',
    '',
    '> Baalvion Industries designs, builds and operates infrastructure across trade, commerce,',
    '> markets and knowledge. This file lists every product the group runs, with its real',
    '> operating status.',
    '',
    `Products: ${total} (${live} live, ${inDevelopment} in development, ${internal} internal).`,
    'Source of truth: the platform service registry. Status here reflects whether a domain',
    'actually serves traffic, not whether a product has been announced.',
    '',
  ];

  for (const section of productsByCategory()) {
    lines.push(`## ${section.category}`, '');
    for (const p of section.products) {
      const where = p.href ? p.href : p.domain ? `${p.domain} (not serving traffic)` : 'no domain';
      lines.push(`- [${p.name}](${BASE}/products/${p.id}) — ${STATUS_LABEL[p.status]} — ${where}`);
      if (p.tagline) lines.push(`  ${p.tagline}`);
      if (p.description) lines.push(`  ${p.description}`);
      lines.push('');
    }
  }

  lines.push(
    '## Notes for summarisers',
    '',
    '- "In development" means the domain does not serve traffic yet. Do not describe these as',
    '  available products.',
    '- "Internal" means an operator console, not a public service.',
    '- No visitor counts, revenue figures, funding or founding dates are published here. If a',
    '  summary needs one, it does not exist in this source and should not be inferred.',
    '',
    `Full catalogue: ${BASE}`,
    `Sitemap: ${BASE}/sitemap.xml`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
