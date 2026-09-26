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
  {
    slug: 'legal-dispute',
    name: 'Legal Dispute',
    pillar: 'legal',
    description: 'Comprehensive analysis of high-stakes civil litigation, breach of contract arbitration, and multi-jurisdictional commercial disputes across federal and state courts.',
  },
  {
    slug: 'defamation-law',
    name: 'Defamation Law',
    pillar: 'legal',
    aliases: ['Defamation'],
    description: 'Legal standards governing libel, slander, public figure actual malice burdens under New York Times v. Sullivan, and media privacy tort enforcement.',
  },
  {
    slug: 'constitutional-law',
    name: 'Constitutional Law',
    pillar: 'legal',
    description: 'In-depth coverage of Supreme Court jurisprudence, Article II executive privilege, First Amendment press protections, and Fourteenth Amendment equal protection doctrines.',
  },
  {
    slug: 'equal-protection',
    name: 'Equal Protection',
    pillar: 'legal',
    description: 'Constitutional equal protection litigation, heightened scrutiny standards, and federal civil rights enforcement.',
  },
  {
    slug: 'press-freedom',
    name: 'Press Freedom',
    pillar: 'legal',
    description: 'First Amendment protections for investigative journalism, confidential source privilege, anti-SLAPP legislation, and international press safety.',
  },
  {
    slug: 'maritime-law',
    name: 'Maritime Law',
    pillar: 'legal',
    aliases: ['Jones Act'],
    description: 'Admiralty jurisdiction, Jones Act seaman injury claims, cruise ship liability, and international maritime safety regulations.',
  },
  {
    slug: 'entertainment-news',
    name: 'Entertainment News',
    pillar: 'entertainment',
    description: 'Breaking news and legal analysis covering Hollywood studio arbitrations, talent agency regulations, SAG-AFTRA labor agreements, and celebrity litigation.',
  },
  {
    slug: 'film-industry',
    name: 'Film Industry',
    pillar: 'entertainment',
    description: 'Motion picture financing, distribution window licensing, synthetic AI performance rights, and studio union contract developments.',
  },
  {
    slug: 'music-industry',
    name: 'Music Industry',
    pillar: 'entertainment',
    description: 'Master recording ownership, Section 203 statutory copyright terminations, streaming royalty auditing, and music catalog valuation deals.',
  },
  {
    slug: 'sports-news',
    name: 'Sports News',
    pillar: 'sports',
    description: 'Professional sports legal coverage, Collective Bargaining Agreement (CBA) salary cap mechanics, NCAA NIL regulations, and athlete endorsement disputes.',
  },
  {
    slug: 'olympics',
    name: 'Olympics',
    pillar: 'sports',
    aliases: ['Olympic Games'],
    description: 'Court of Arbitration for Sport (CAS) decisions, emergency ad-hoc eligibility panels, anti-doping code enforcement, and Olympic committee governance.',
  },
];

export function getAllTopics(): Topic[] {
  return TOPICS;
}

export function getTopicBySlug(slug: string): Topic | null {
  const target = slug.toLowerCase();
  return TOPICS.find((t) => t.slug === target) ?? null;
}
