import type { Person } from '@/types/person';
import { ACTORS } from './actors';
import { ATHLETES } from './athletes';
import { CREATORS } from './creators';
import { DIRECTORS } from './directors';
import { INFLUENCERS } from './influencers';
import { JUDGES } from './judges';
import { LAWYERS } from './lawyers';
import { MUSICIANS } from './musicians';
import { OTHER_FIGURES } from './other';
import { PRODUCERS } from './producers';
import { TV_PERSONALITIES } from './tv-personalities';

/** Roster profiles for discovery. The hand-written profiles in ../people.ts win on a slug collision, and the first category listed here wins between rosters. */
export const ROSTER_PEOPLE: Person[] = [
  ...ACTORS, ...MUSICIANS, ...DIRECTORS, ...PRODUCERS, ...TV_PERSONALITIES, ...INFLUENCERS,
  ...CREATORS, ...ATHLETES, ...LAWYERS, ...JUDGES, ...OTHER_FIGURES,
];
