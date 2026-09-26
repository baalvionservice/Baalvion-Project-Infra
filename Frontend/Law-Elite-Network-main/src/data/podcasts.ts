import type { Podcast } from '@/types/media';

/**
 * Law Elite Network podcast series. Episodes link out to hosting platforms.
 */
export const PODCASTS: Podcast[] = [
  {
    slug: 'law-elite-daily-scoop',
    title: 'Law Elite Daily Scoop',
    description:
      'Your morning briefing on the day\'s most important court rulings, high-profile celebrity legal cases, and SCOTUS docket updates — delivered in under 12 minutes.',
    host: 'Elena Rostova',
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    episodes: [
      {
        title: 'SCOTUS Emergency Stay Granted in Corporate Governance Case',
        url: 'https://open.spotify.com',
        description:
          'The Supreme Court issues an emergency administrative stay blocking a lower court order affecting a major Fortune 100 board governance dispute.',
        publishedAt: 'September 19, 2026',
        durationSeconds: 690,
      },
      {
        title: 'Taylor Swift Re-Recording Rights: The Legal Blueprint That Changed Music',
        url: 'https://open.spotify.com',
        description:
          'A deep-dive into Section 203 copyright termination rights and how Taylor Swift\'s Fearless (Taylor\'s Version) set a landmark precedent.',
        publishedAt: 'September 17, 2026',
        durationSeconds: 780,
      },
      {
        title: 'Ronaldo Wins €9.7M Arbitration Against Juventus',
        url: 'https://open.spotify.com',
        description:
          'The sports arbitration tribunal ruling explained: pandemic wage deferrals, Italian employment law, and what it means for athlete contracts worldwide.',
        publishedAt: 'September 15, 2026',
        durationSeconds: 610,
      },
      {
        title: 'Delaware Chancery Court: The Nation\'s Most Powerful Corporate Tribunal',
        url: 'https://open.spotify.com',
        description:
          'Why every major U.S. corporation files disputes in Delaware and how the Chancery Court has shaped modern corporate governance.',
        publishedAt: 'September 12, 2026',
        durationSeconds: 720,
      },
      {
        title: 'Celebrity AI Deepfakes & the Right of Publicity',
        url: 'https://open.spotify.com',
        description:
          'Tom Hanks, Scarlett Johansson, and others fight unauthorized AI likeness usage — analyzing California Civil Code 3344 and federal copyright protections.',
        publishedAt: 'September 10, 2026',
        durationSeconds: 650,
      },
    ],
  },
  {
    slug: 'law-elite-sports-law-weekly',
    title: 'Sports Law Weekly by Law Elite',
    description:
      'Breaking down the legal mechanics of the world\'s biggest sports contracts, athlete arbitrations, and league governance frameworks.',
    host: 'Marcus Vance',
    coverUrl: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=600&q=80',
    episodes: [
      {
        title: 'NBA Second Apron Rules: How They Reshape Team Building Strategy',
        url: 'https://open.spotify.com',
        description:
          'Breaking down the 2024 NBA CBA luxury tax second apron penalties and their impact on franchise championship-building decisions.',
        publishedAt: 'September 18, 2026',
        durationSeconds: 820,
      },
    ],
  },
];

export function getAllPodcasts(): Podcast[] {
  return PODCASTS;
}

export function getPodcastBySlug(slug: string): Podcast | null {
  return PODCASTS.find((p) => p.slug === slug) ?? null;
}
