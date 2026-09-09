import type { MetadataRoute } from 'next';
import { PRODUCTS } from '@/lib/products';

// Generated from the registry, so a new product is in the sitemap the moment it is registered —
// there is no second list to keep in step.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://baalvionstack.com';
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...PRODUCTS.map((p) => ({
      url: `${base}/products/${p.id}`,
      changeFrequency: 'monthly' as const,
      // Live properties rank ahead of ones that do not serve traffic yet.
      priority: p.status === 'live' ? 0.8 : 0.4,
    })),
  ];
}
