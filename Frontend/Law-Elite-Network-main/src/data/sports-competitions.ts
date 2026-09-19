/**
 * @fileOverview LEN Sports — bundled SportsCompetition entities. Real,
 * well-documented events only, each with a real athlete connection via
 * `peopleInvolved` — same content-integrity posture as every other LEN data
 * file (no invented results, no unverifiable statistics).
 */

import type { SportsCompetition } from '@/types/sports';

export const SPORTS_COMPETITIONS: SportsCompetition[] = [
  {
    slug: '2008-beijing-olympics-mens-basketball',
    name: '2008 Beijing Olympics — Men’s Basketball',
    sport: 'Basketball',
    level: 'olympic',
    countryCode: 'CN',
    date: '2008-08',
    description: 'The men’s basketball tournament at the 2008 Summer Olympics in Beijing. The United States national team, nicknamed the "Redeem Team," won the gold medal.',
    peopleInvolved: [
      { personSlug: 'lebron-james', role: 'Player, United States national team', result: 'Gold medal' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry.' },
  },
  {
    slug: '2012-london-olympics-mens-basketball',
    name: '2012 London Olympics — Men’s Basketball',
    sport: 'Basketball',
    level: 'olympic',
    countryCode: 'GB',
    date: '2012-08',
    description: 'The men’s basketball tournament at the 2012 Summer Olympics in London. The United States national team won the gold medal.',
    peopleInvolved: [
      { personSlug: 'lebron-james', role: 'Player, United States national team', result: 'Gold medal' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry.' },
  },
  {
    slug: '2016-nba-finals',
    name: '2016 NBA Finals',
    sport: 'Basketball',
    level: 'championship',
    countryCode: 'US',
    date: '2016-06',
    description: 'The championship series of the NBA’s 2015–16 season, in which the Cleveland Cavaliers defeated the Golden State Warriors after trailing 3–1 in the series, the franchise’s first NBA championship.',
    peopleInvolved: [
      { personSlug: 'lebron-james', role: 'Player, Cleveland Cavaliers', result: 'NBA Finals MVP; won championship' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry.' },
  },
];

export function getAllSportsCompetitions(): SportsCompetition[] {
  return SPORTS_COMPETITIONS;
}

export function getSportsCompetitionBySlug(slug: string): SportsCompetition | null {
  const target = slug.toLowerCase();
  return SPORTS_COMPETITIONS.find((c) => c.slug === target) ?? null;
}

export function getSportsCompetitionsForPerson(personSlug: string): SportsCompetition[] {
  return SPORTS_COMPETITIONS.filter((c) => c.peopleInvolved?.some((p) => p.personSlug === personSlug));
}
