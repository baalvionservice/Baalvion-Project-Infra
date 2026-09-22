/**
 * @fileOverview LEN Sports — bundled Team entities. Identity + description
 * only, no rosters/schedules/standings. Same content-integrity posture as
 * the other LEN data files: real, long-settled public record.
 */

import type { SportsTeam } from '@/types/sports';

export const SPORTS_TEAMS: SportsTeam[] = [
  {
    slug: 'los-angeles-lakers',
    name: 'Los Angeles Lakers',
    sport: 'Basketball',
    countryCode: 'US',
    description: 'A National Basketball Association (NBA) team based in Los Angeles, California, one of the league’s most successful franchises.',
    url: 'https://www.nba.com/lakers',
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry, not affiliated with the team or the NBA.' },
  },
  {
    slug: 'cleveland-cavaliers',
    name: 'Cleveland Cavaliers',
    sport: 'Basketball',
    countryCode: 'US',
    description: 'A National Basketball Association (NBA) team based in Cleveland, Ohio.',
    url: 'https://www.nba.com/cavaliers',
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry, not affiliated with the team or the NBA.' },
  },
  {
    slug: 'miami-heat',
    name: 'Miami Heat',
    sport: 'Basketball',
    countryCode: 'US',
    description: 'A National Basketball Association (NBA) team based in Miami, Florida.',
    url: 'https://www.nba.com/heat',
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry, not affiliated with the team or the NBA.' },
  },
  {
    slug: 'inter-miami-cf',
    name: 'Inter Miami CF',
    sport: 'Soccer',
    countryCode: 'US',
    description: 'Major League Soccer club based in Fort Lauderdale, Florida, featuring landmark international player equity contracts.',
    url: 'https://www.intermiamicf.com',
    verification: { verified: true, sourceNote: 'Official MLS records.' },
  },
  {
    slug: 'real-madrid-cf',
    name: 'Real Madrid CF',
    sport: 'Soccer',
    countryCode: 'ES',
    description: 'Renowned Spanish football club operating landmark international image rights and UEFA competition frameworks.',
    url: 'https://www.realmadrid.com',
    verification: { verified: true, sourceNote: 'Official La Liga & UEFA records.' },
  },
];

export function getAllSportsTeams(): SportsTeam[] {
  return SPORTS_TEAMS;
}

export function getSportsTeamBySlug(slug: string): SportsTeam | null {
  const target = slug.toLowerCase();
  return SPORTS_TEAMS.find((t) => t.slug === target) ?? null;
}
