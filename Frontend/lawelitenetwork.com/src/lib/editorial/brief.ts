import { getMergedPeople, getMergedPersonBySlug } from '@/lib/people-server';
import { getEditorialCatalog } from '@/lib/editorial/context';
import { getLegalCasesForPerson } from '@/lib/legal-server';
import { getSportsCompetitionsForPerson } from '@/lib/sports-server';
import { personCategoryLabel } from '@/types/person';
import { countryNameByCode } from '@/lib/countries';
import { personUrl } from '@/lib/person-url';
import { keyOf } from '@/lib/editorial/analyze';

export interface PersonBrief {
  slug: string;
  name: string;
  category: string;
  url: string;
  /** One line each, straight from the profile. The writer turns them into prose; nothing here is invented. */
  facts: string[];
  /** Section headings offered only where the profile has material for them. */
  outline: string[];
  related: { label: string; kind: string; url: string }[];
  articles: { title: string; url: string }[];
  sources: { label: string; url: string }[];
  photo?: { credit: string; license: string };
  depth: { hasBio: boolean; hasPhoto: boolean; hasSources: boolean };
}

const yearRange = (a?: number, b?: number) => (a ? `${a}–${b ?? 'present'}` : '');

export async function getPersonBrief(slug: string): Promise<PersonBrief | null> {
  const p = await getMergedPersonBySlug(slug);
  if (!p) return null;
  const name = p.displayName || p.fullName;
  const catalog = await getEditorialCatalog();
  const facts: string[] = [];
  const outline: string[] = [];

  if (p.birthDate) facts.push(`Born ${p.birthDate}${p.birthPlace ? ` in ${p.birthPlace}` : ''}`);
  if (p.deathDate) facts.push(`Died ${p.deathDate}`);
  if (p.countryCode) facts.push(`Country: ${countryNameByCode(p.countryCode)}`);
  if (p.status && p.status !== 'active') facts.push(`Status: ${p.status}`);
  if (p.career.length) {
    outline.push('Career');
    p.career.forEach((c) => facts.push(`${c.title}${c.organization ? `, ${c.organization}` : ''}${yearRange(c.startYear, c.endYear) ? ` (${yearRange(c.startYear, c.endYear)})` : ''}`));
  }
  if (p.education?.length) {
    outline.push('Education');
    p.education.forEach((e) => facts.push(`Studied at ${e.institution}${e.degree ? ` (${e.degree})` : ''}`));
  }
  if (p.awards?.length) {
    outline.push('Awards and honours');
    p.awards.forEach((a) => facts.push(`${a.title}${a.year ? `, ${a.year}` : ''}`));
  }
  p.timeline?.forEach((t) => facts.push(`${t.date}: ${t.title}`));
  const cases = await getLegalCasesForPerson(p.slug);
  if (cases.length) { outline.push('Legal cases'); cases.forEach((c) => facts.push(`Connected to the case ${c.caseName}`)); }
  const comps = await getSportsCompetitionsForPerson(p.slug);
  if (comps.length) { outline.push('Competitions'); comps.forEach((c) => facts.push(`Took part in ${c.name}`)); }
  p.relatedWorks?.filter((w) => w.type !== 'legal-case').forEach((w) => facts.push(`${w.title}${w.year ? ` (${w.year})` : ''}${w.role ? `: ${w.role}` : ''}`));
  if (p.relatedWorks?.some((w) => w.type !== 'legal-case')) outline.push('Notable work');

  const related = (catalog.relations.get(keyOf({ entityType: 'person', slug: p.slug })) ?? [])
    .map((k) => catalog.entities.find((e) => keyOf(e.ref) === k))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map((e) => ({ label: e.label, kind: e.kind, url: e.url }));

  const articles = catalog.articles
    .filter((a) => a.entities.some((r) => r.entityType === 'person' && r.slug === p.slug))
    .map((a) => ({ title: a.title, url: a.url }));

  return {
    slug: p.slug, name, category: personCategoryLabel(p.category), url: personUrl(p.slug),
    facts, outline, related, articles,
    sources: p.sources ?? [],
    photo: p.photo ? { credit: p.photo.credit, license: p.photo.license } : undefined,
    depth: { hasBio: p.biography.length > 200 && !p.thin, hasPhoto: !!p.photo, hasSources: !!p.sources?.length },
  };
}

/** Quick pick list for the Studio: name + slug of everyone, cheap to ship. */
export async function listPeopleForPicker() {
  return (await getMergedPeople()).map((p) => ({ slug: p.slug, name: p.displayName || p.fullName, category: p.category, thin: !!p.thin }));
}
