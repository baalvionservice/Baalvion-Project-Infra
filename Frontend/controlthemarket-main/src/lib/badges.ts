import type { Badge } from './types';

/**
 * Achievement badge catalog — static reference data (the set of badges that exist + their
 * display metadata). Which badges a given user has *earned* is dynamic and comes from
 * ctm-service; this is just the catalog definitions. Relocated out of mock-data.ts.
 */
export const badges: Badge[] = [
  { id: 'badge-1', name: 'Top 10 Performer', description: 'Achieved a ranking in the top 10% of all candidates.', icon: 'Trophy', rarity: 'Elite' },
  { id: 'badge-2', name: 'Verified Talent', description: 'Manually verified by the SkillMatch Pro team for exceptional skill.', icon: 'ShieldCheck', rarity: 'Elite' },
  { id: 'badge-3', name: 'Quick Starter', description: 'Completed the first assigned task within 24 hours.', icon: 'Rocket', rarity: 'Rare' },
  { id: 'badge-4', name: 'Specialist', description: 'Completed 5 tasks within the same role category.', icon: 'Award', rarity: 'Rare' },
  { id: 'badge-5', name: 'Problem Solver', description: 'Achieved a score of 90+ on a task of Advanced or Expert difficulty.', icon: 'BrainCircuit', rarity: 'Common' },
];
