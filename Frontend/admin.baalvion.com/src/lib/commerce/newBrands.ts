import type { CommerceCategory } from '@/lib/types/commerce.types';
import { sectionOf, type PlanStep } from '@/lib/commerce/amariseStructure';

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const slugify = (s: string) => norm(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const flatten = (tree: CommerceCategory[]): CommerceCategory[] => tree.flatMap((c) => [c, ...flatten(c.children ?? [])]);

export interface SectionInput { title: string; items: string[] }

/** "Handbags: Kelly, Birkin" per line → sections. Returns what could not be understood, in plain words. */
export function parseSections(text: string): { sections: SectionInput[]; errors: string[] } {
  const sections: SectionInput[] = [];
  const errors: string[] = [];
  text.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line, i) => {
    const at = line.indexOf(':');
    if (at < 1) { errors.push(`Line ${i + 1} ("${line.slice(0, 30)}"): write it as  Section: item, item, item`); return; }
    const title = line.slice(0, at).trim();
    const items = Array.from(new Set(line.slice(at + 1).split(',').map((x) => x.trim()).filter(Boolean)));
    if (!items.length) { errors.push(`Line ${i + 1}: "${title}" has no items after the colon.`); return; }
    const existing = sections.find((s) => norm(s.title) === norm(title));
    if (existing) existing.items.push(...items.filter((x) => !existing.items.some((y) => norm(y) === norm(x))));
    else sections.push({ title, items });
  });
  return { sections, errors };
}

export type BrandInput =
  | { mode: 'under-other'; names: string[] }
  | { mode: 'under-jewelry'; names: string[] }
  | { mode: 'own'; brand: string; sections: SectionInput[] };

export interface BrandPlan {
  steps: PlanStep[];
  summary: { brands: number; items: number };
  warnings: string[];
  errors: string[];
}

const MAX_ITEMS = 80;

/** Works out exactly which categories to add for new brands. Never edits or removes anything except re-ordering "All Other Brands" to stay last. */
export function buildBrandPlan(tree: CommerceCategory[], input: BrandInput): BrandPlan {
  const all = flatten(tree);
  const taken = new Set(all.map((c) => c.slug));
  const uniq = (base: string) => { let s = base || 'brand'; let n = 2; while (taken.has(s)) s = `${base}-${n++}`; taken.add(s); return s; };
  const roots = tree.filter((c) => !c.parentId);
  const steps: PlanStep[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  let brands = 0, items = 0;

  if (input.mode === 'under-other' || input.mode === 'under-jewelry') {
    const jewelry = input.mode === 'under-jewelry';
    const group = jewelry ? 'jewelry' : 'other brands';
    const groupLabel = jewelry ? 'Jewelry' : 'Other Brands';
    const section = jewelry ? 'By brand' : 'Brands';
    const suffix = jewelry ? 'jewelry' : 'bags';
    const rootCat = roots.find((r) => norm(r.name) === group);
    if (!rootCat) { errors.push(`This store has no "${groupLabel}" group yet. Run "Set up standard structure" first.`); return { steps, summary: { brands, items }, warnings, errors }; }
    const kids = rootCat.children ?? [];
    const allItem = jewelry ? undefined : kids.find((k) => k.slug === 'other-bags-1' || norm(k.name).startsWith('all '));
    const others = kids.filter((k) => k !== allItem);
    let order = Math.max(-1, ...others.map((k) => k.sortOrder)) + 1;
    const seen = new Set(kids.map((k) => norm(k.name)));
    for (const raw of input.names.map((n) => n.trim()).filter(Boolean)) {
      if (raw.length > 200) { errors.push(`"${raw.slice(0, 30)}…" is too long for a brand name.`); continue; }
      if (seen.has(norm(raw))) { warnings.push(`${raw} is already listed, so it was skipped.`); continue; }
      seen.add(norm(raw));
      steps.push({ kind: 'create', brandKey: rootCat.slug, brandId: rootCat.id, name: raw, slug: uniq(`${slugify(raw)}-${suffix}`), section, sortOrder: order++ });
      brands++; items++;
    }
    if (steps.length && allItem) {
      // Keep "All Other Brands" at the end of the list.
      steps.push({ kind: 'update', id: allItem.id, label: allItem.name, patch: { sortOrder: order, seoMetadata: { ...(allItem.seoMetadata ?? {}), section: sectionOf(allItem) || 'Brands' } } });
    }
    return { steps, summary: { brands, items }, warnings, errors };
  }

  const brand = input.brand.trim();
  if (!brand) { errors.push('Type the brand name.'); return { steps, summary: { brands, items }, warnings, errors }; }
  if (roots.some((r) => norm(r.name) === norm(brand))) {
    errors.push(`${brand} already exists. Open it in the list and use "Sub" to add to it, or choose "Under Other Brands".`);
    return { steps, summary: { brands, items }, warnings, errors };
  }
  const count = input.sections.reduce((n, s) => n + s.items.length, 0);
  if (count === 0) errors.push('Add at least one section with items, for example  Handbags: Classic Flap, Mini Bag');
  if (count > MAX_ITEMS) errors.push(`That is ${count} items. Add up to ${MAX_ITEMS} at a time.`);
  if (errors.length) return { steps, summary: { brands, items }, warnings, errors };

  const base = slugify(brand);
  const key = uniq(`dept-${base}`);
  steps.push({ kind: 'create-root', key, name: brand, slug: key, sortOrder: Math.max(-1, ...roots.map((r) => r.sortOrder)) + 1 });
  brands = 1;
  let order = 0;
  for (const s of input.sections) {
    for (const item of s.items) {
      steps.push({ kind: 'create', brandKey: key, name: item, slug: uniq(`${base}-${slugify(item)}`), section: s.title, sortOrder: order++ });
      items++;
    }
  }
  return { steps, summary: { brands, items }, warnings, errors };
}

// Well-known luxury names offered as one-click suggestions in the Add brands tool. They are
// suggestions to choose from, not a statement about what any store stocks.
export const SUGGESTED_BAG_BRANDS = [
  'Prada', 'Gucci', 'Bottega Veneta', 'Céline', 'Saint Laurent', 'Balenciaga', 'Valentino', 'Loewe',
  'Givenchy', 'Burberry', 'Miu Miu', 'Bulgari', 'Berluti', 'Delvaux', 'Dolce & Gabbana', 'Alexander McQueen',
];
export const SUGGESTED_JEWELRY_BRANDS = [
  'Cartier', 'Van Cleef & Arpels', 'Tiffany & Co.', 'Bulgari', 'Harry Winston', 'Graff', 'Chopard', 'David Yurman',
];
