import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-builder';
import { BaseEntity } from '@/types/entity';

/**
 * @fileOverview Specialized utility for generating high-fidelity SEO metadata for entities.
 * Supports Countries, Companies, Industries, and Technologies.
 */

export function generateEntityMetadata(entity: any, type: string): Metadata {
  const name = entity.name || 'Unknown Entity';
  const description = entity.description || '';
  const tags = entity.tags || [];
  
  // Create specialized titles and descriptions based on entity type
  let seoTitle = '';
  let seoDescription = '';
  
  switch (type) {
    case 'country':
      seoTitle = `${name} | Global Economic Profile & Intelligence`;
      seoDescription = `Audit ${name}'s economic benchmarks, population data, and market reach. Part of the Imperialpedia Sovereign Index.`;
      break;
    case 'company':
      seoTitle = `${name} | Institutional Node & Corporate Audit`;
      seoDescription = `Explore ${name}'s founding intelligence, industry influence, and technical competitors. Verified institutional data.`;
      break;
    case 'industry':
      seoTitle = `${name} | Market Architecture & Sector Intelligence`;
      seoDescription = `Trace the global scale and growth velocity of the ${name} sector. Analyze key players and innovation nodes.`;
      break;
    case 'technology':
      seoTitle = `${name} | Innovation Node & Technical Analysis`;
      seoDescription = `Deep-dive into ${name}. Explore core applications, market impact, and institutional implementation benchmarks.`;
      break;
    default:
      seoTitle = `${name} | Knowledge Node`;
      seoDescription = description;
  }

  return buildMetadata({
    title: seoTitle,
    description: seoDescription,
    keywords: [...tags, type, 'intelligence', 'analytics'],
    canonical: `/${type}s/${entity.slug}`,
    ogType: 'article',
  });
}
