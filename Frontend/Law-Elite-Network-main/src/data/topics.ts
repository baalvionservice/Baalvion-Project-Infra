/**
 * @fileOverview LEN Topics — a small, extensible cross-cutting tag set (the
 * "Topics" pillar of the master IA). Deliberately minimal: a topic is just a
 * name + optional aliases the entity-tagging engine matches against article
 * text, not a managed taxonomy tree. Add a new topic by adding one entry.
 */

export interface Topic {
  slug: string;
  name: string;
  pillar?: 'legal' | 'entertainment' | 'sports' | 'general';
  /** Alternate phrasings the tagging engine should also match, e.g. "Olympics" / "Olympic Games". */
  aliases?: string[];
  /** Editor-written introduction shown on the topic page (admin panel). */
  description?: string;
  /** Explicit override from the admin panel. */
  indexable?: boolean;
}

export const TOPICS: Topic[] = [
  { slug: 'legal-dispute', name: 'Legal Dispute', pillar: 'legal' },
  { slug: 'defamation-law', name: 'Defamation Law', pillar: 'legal', aliases: ['Defamation'] },
  { slug: 'constitutional-law', name: 'Constitutional Law', pillar: 'legal' },
  { slug: 'equal-protection', name: 'Equal Protection', pillar: 'legal' },
  { slug: 'press-freedom', name: 'Press Freedom', pillar: 'legal' },
  { slug: 'maritime-law', name: 'Maritime Law', pillar: 'legal', aliases: ['Jones Act'] },
  { slug: 'entertainment-news', name: 'Entertainment News', pillar: 'entertainment' },
  { slug: 'film-industry', name: 'Film Industry', pillar: 'entertainment' },
  { slug: 'music-industry', name: 'Music Industry', pillar: 'entertainment' },
  { slug: 'sports-news', name: 'Sports News', pillar: 'sports' },
  { slug: 'olympics', name: 'Olympics', pillar: 'sports', aliases: ['Olympic Games'] },
];

export function getAllTopics(): Topic[] {
  return TOPICS;
}

export function getTopicBySlug(slug: string): Topic | null {
  const target = slug.toLowerCase();
  return TOPICS.find((t) => t.slug === target) ?? null;
}
