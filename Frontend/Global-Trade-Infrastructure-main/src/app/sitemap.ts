import { MetadataRoute } from 'next';
import { listCountries, listAgreements } from '@/server/gckb/public-read';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trade.baalvion.com';

// Regenerate hourly so newly published countries/agreements show up without a
// redeploy. If the DB is unreachable at build time the try/catch below falls
// back to the static routes instead of failing the build.
export const revalidate = 3600;

/**
 * Sitemap of the public, indexable marketing surface. Static marketing routes are
 * hardcoded below; the per-country and per-agreement detail pages are generated
 * from the GCKB database so every published jurisdiction and trade agreement is
 * discoverable by crawlers, not just the directory pages that link to them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1.0 },
    { path: '/platform', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/banks', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/governments', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/enterprises', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/logistics', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/onboard', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/onboard/buyer', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/onboard/seller', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/countries', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/ports', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/tariffs', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/fta', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/authorities', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/compare', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Best-effort: if the GCKB database isn't reachable (e.g. mid-migration), fall
  // back to the static routes rather than failing the whole sitemap request.
  try {
    const [countries, agreements] = await Promise.all([listCountries(), listAgreements()]);

    const countryEntries: MetadataRoute.Sitemap = countries.map((c) => ({
      url: `${BASE_URL}/countries/${c.code.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const agreementEntries: MetadataRoute.Sitemap = agreements.map((a) => ({
      url: `${BASE_URL}/fta/${a.recordKey.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...staticEntries, ...countryEntries, ...agreementEntries];
  } catch {
    return staticEntries;
  }
}
