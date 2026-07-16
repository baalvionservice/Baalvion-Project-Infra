import { ApiResponse } from '@/types';
import { TransparencyData } from '@/types/system';

/**
 * @fileOverview Last-resort static fallback for the Platform Transparency page, used
 * only if both the CMS (article count) and creators (contributor count) backends are
 * unreachable. Deliberately holds no invented moderation/editorial/quality numbers —
 * see `@/types/system` for why that shape was removed. The policy links are the same
 * real, static policy pages the live path uses.
 */

const fallbackTransparencyData: TransparencyData = {
  metrics: {
    articles_published: 0,
    contributors: 0,
  },
  policies: [
    { title: 'Editorial Policy', description: 'How our editorial team sources, reviews, and publishes intelligence content.', href: '/editorial-policy' },
    { title: 'Ethics Policy', description: 'Our standards for conflicts of interest, sourcing, and journalistic integrity.', href: '/ethics-policy' },
    { title: 'Comment Policy', description: 'How community discussion and moderation works on Imperialpedia.', href: '/comment-policy' },
    { title: 'Corrections', description: 'How we handle and disclose factual corrections to published content.', href: '/corrections' },
  ],
};

export const getTransparencyData = async (): Promise<ApiResponse<TransparencyData>> => {
  return {
    data: fallbackTransparencyData,
    status: 200,
  };
};
