import type { Person, PersonCategorySlug } from '@/types/person';

/**
 * Compact roster rows: `Name|country|what they are known for|flag`.
 * flag `d` = deceased, `r` = retired; anything else is active.
 *
 * Only real, widely documented public figures belong here, described in one
 * conservative factual clause. No photos (usage rights unsourced), no
 * biography beyond that clause, and never marked verified -- roster profiles
 * exist for discovery and are upgraded to full profiles by hand.
 */
export type RosterRow = string;

const slugify = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const article = (desc: string) => (/^[aeiou]/i.test(desc) ? 'an' : 'a');

export function buildRoster(category: PersonCategorySlug, rows: RosterRow[]): Person[] {
  return rows.map((row) => {
    const [name, countryCode, desc, flag] = row.split('|');
    const deceased = flag === 'd';
    const slug = slugify(name);
    return {
      slug,
      fullName: name,
      category,
      countryCode,
      avatarSeed: slug,
      biography: `${name} ${deceased ? 'was' : 'is'} ${article(desc)} ${desc}.`,
      career: [],
      thin: true,
      status: deceased ? 'deceased' : flag === 'r' ? 'retired' : 'active',
      verification: {
        verified: false,
        sourceNote: 'Public biographical record, listed for discovery. Not yet editorially reviewed.',
      },
    } satisfies Person;
  });
}
