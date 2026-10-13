import type { CommerceCategory } from '@/lib/types/commerce.types';

// The Amarisé shop structure, taken from the website's own navigation menu
// (Frontend/amarisemaisonavenue.com/src/components/layout/Header.tsx, MEGA_MENU_DATA).
// Brand → Section → Item. Items use the website's own category slugs so the live site keeps working.
// A category can sit in one section only; where the menu lists the same category twice, the first
// listing wins. Links in the menu that point at another brand's page (e.g. "Best Sellers") are not
// categories and are not included.
export interface StructItem { name: string; slug: string }
export interface StructSection { title: string; items: StructItem[] }
export interface StructBrand { name: string; slug: string; sections: StructSection[] }

export const AMARISE_STRUCTURE: StructBrand[] = [
  {
    name: 'New Arrivals', slug: 'dept-new-arrivals',
    sections: [{ title: 'New Arrivals', items: [
      { name: 'New Arrivals', slug: 'new-arrivals-handbags' },
      { name: 'Hermès', slug: 'new-arrivals-hermes' },
      { name: 'Chanel', slug: 'new-arrivals-chanel-handbags-and-accessories' },
      { name: 'Other Brands', slug: 'view-all-new-arrivals' },
      { name: 'Jewelry New Arrivals', slug: 'jewelry-new-arrivals' },
    ] }],
  },
  {
    name: 'Hermès', slug: 'dept-hermes',
    sections: [
      { title: 'Handbags', items: [
        { name: 'Birkin Bags', slug: 'hermes-birkin-handbags' },
        { name: 'Kelly Bags', slug: 'hermes-kelly-handbags' },
        { name: 'Constance Bags', slug: 'hermes-constance-handbags' },
        { name: 'Evelyne Bags', slug: 'hermes-evelyne-bags' },
        { name: 'Picotin Bags', slug: 'hermes-picotin-bags' },
        { name: 'Lindy Bags', slug: 'hermes-lindy-bags' },
        { name: 'Bolide Bags', slug: 'hermes-bolide-bags' },
        { name: 'Herbag Collection', slug: 'hermes-herbag-collection' },
        { name: 'Pochettes & Kelly Cuts', slug: 'hermes-clutch' },
        { name: 'HSS Special Order Bags', slug: 'hermes-hss-special-order-bags' },
        { name: 'All Hermès Bags', slug: 'hermes-handbags' },
      ] },
      { title: 'Accessories', items: [
        { name: 'Wallets', slug: 'hermes-wallets' },
        { name: 'Watches', slug: 'watches' },
        { name: 'Belts', slug: 'hermes-belts' },
        { name: 'Charms', slug: 'hermes-charms' },
        { name: 'Scarves', slug: 'hermes-scarves' },
        { name: 'Shoes', slug: 'hermes-shoes' },
        { name: 'Jewelry', slug: 'fine-jewelry' },
      ] },
      { title: 'Curations', items: [
        { name: 'Exotic Handbags', slug: 'hermes-exotic-handbags' },
        { name: 'Rare & Unique Bags', slug: 'hermes-rare-handbags' },
        { name: 'Pre-Owned & Vintage', slug: 'hermes-pre-owned-vintage' },
        { name: 'Bag Besties & Organizers', slug: 'bag-besties-organizers' },
      ] },
    ],
  },
  {
    name: 'Chanel', slug: 'dept-chanel',
    sections: [
      { title: 'Handbags', items: [
        { name: 'Classic Flap Bags', slug: 'chanel-flap-bags' },
        { name: 'Classic Mini Bags', slug: 'chanel-classic-mini' },
        { name: 'Classic Small Bags', slug: 'chanel-classic-small' },
        { name: 'Classic Medium Bags', slug: 'chanel-classic-medium' },
        { name: 'Jumbo & Maxi Flaps', slug: 'chanel-jumbo-maxi-flaps' },
        { name: 'Chanel 22 Bags', slug: 'chanel-22-bags' },
        { name: 'Chanel 25 Bags', slug: 'chanel-25-bags' },
        { name: 'Totes', slug: 'chanel-tote' },
        { name: 'Wallet on Chain', slug: 'chanel-wallet-on-chain' },
        { name: 'Fashion & Runway', slug: 'chanel-fashion-runway-bags' },
        { name: 'All Chanel Bags', slug: 'chanel-bags' },
      ] },
      { title: 'Accessories', items: [
        { name: 'Wallets', slug: 'chanel-wallets' },
        { name: 'Shoes', slug: 'chanel-shoes' },
      ] },
      { title: 'Jewelry', items: [
        { name: 'Vintage Chanel Jewelry', slug: 'vintage-chanel-jewelry' },
        { name: 'Contemporary Jewelry', slug: 'chanel-contemporary-jewelry' },
      ] },
      { title: 'Curations', items: [{ name: 'Pre-Owned & Vintage', slug: 'chanel-pre-owned' }] },
    ],
  },
  {
    name: 'Goyard', slug: 'dept-goyard',
    sections: [{ title: 'Handbags', items: [
      { name: 'Saint Louis', slug: 'goyard-st-louis-bags' },
      { name: 'Saigon', slug: 'goyard-saigon-bags' },
      { name: 'Anjou', slug: 'goyard-anjou-bags' },
      { name: 'Artois', slug: 'goyard-artois-bags' },
      { name: 'Other Styles', slug: 'goyard-other-styles' },
      { name: 'All Goyard Bags', slug: 'goyard' },
    ] }],
  },
  {
    name: 'Other Brands', slug: 'dept-other-brands',
    sections: [{ title: 'Brands', items: [
      { name: 'The Row', slug: 'the-row-bags' },
      { name: 'Louis Vuitton', slug: 'louis-vuitton-bags' },
      { name: 'Christian Dior', slug: 'christian-dior-bags' },
      { name: 'Fendi', slug: 'fendi-bags' },
      { name: 'Loro Piana', slug: 'loro-piana-bags' },
      { name: 'All Other Brands', slug: 'other-bags-1' },
    ] }],
  },
  {
    name: 'Jewelry', slug: 'dept-jewelry',
    sections: [
      { title: 'Fine Jewelry', items: [
        { name: 'Fine Jewelry Brands', slug: 'jewelry' },
        { name: 'Vintage Jewelry', slug: 'jewelry-vintage' },
        { name: 'Contemporary', slug: 'jewelry-contemporary' },
        { name: 'Costume Jewelry', slug: 'costume-jewelry' },
      ] },
      { title: 'By type', items: [
        { name: 'Earrings', slug: 'fine-jewelry-earrings' },
        { name: 'Bracelets', slug: 'fine-jewelry-bracelets' },
        { name: 'Necklaces', slug: 'fine-jewelry-necklaces' },
        { name: 'Rings', slug: 'fine-jewelry-rings' },
      ] },
      { title: 'By brand', items: [
        { name: 'Hermès', slug: 'hermes' },
        { name: 'Chanel Jewelry', slug: 'chanel' },
      ] },
    ],
  },
];

// ── planner ────────────────────────────────────────────────────────────────────

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const sectionOf = (c: Pick<CommerceCategory, 'seoMetadata'>): string =>
  typeof (c.seoMetadata as { section?: unknown } | undefined)?.section === 'string'
    ? ((c.seoMetadata as { section: string }).section)
    : '';

export type PlanStep =
  | { kind: 'create-root'; key: string; name: string; slug: string; sortOrder: number }
  | { kind: 'create'; brandKey: string; brandId?: string; name: string; slug: string; section: string; sortOrder: number }
  | { kind: 'update-root'; id: string; sortOrder: number }
  | { kind: 'update'; id: string; patch: { name?: string; parentId?: string; sortOrder: number; seoMetadata: Record<string, unknown> }; label: string };

export interface Plan {
  steps: PlanStep[];
  counts: { organise: number; rename: number; create: number; keptAsOther: number };
  warnings: string[];
}

const flatten = (tree: CommerceCategory[]): CommerceCategory[] =>
  tree.flatMap((c) => [c, ...flatten(c.children ?? [])]);

/**
 * Compares a store's current categories with the standard structure and lists exactly what would
 * change. Nothing is ever deleted and nothing outside the structure is renamed: leftover categories
 * are kept under an "Other" section.
 */
export function buildPlan(tree: CommerceCategory[]): Plan {
  const all = flatten(tree);
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const roots = tree.filter((c) => !c.parentId);
  const steps: PlanStep[] = [];
  const warnings: string[] = [];
  const counts = { organise: 0, rename: 0, create: 0, keptAsOther: 0 };
  const placed = new Set<string>();

  AMARISE_STRUCTURE.forEach((brand, bi) => {
    const root = roots.find((r) => norm(r.name) === norm(brand.name));
    const brandKey = brand.slug;
    if (!root) {
      steps.push({ kind: 'create-root', key: brandKey, name: brand.name, slug: bePlain(brand.slug, bySlug, warnings), sortOrder: bi });
      counts.create++;
    } else if (root.sortOrder !== bi) {
      steps.push({ kind: 'update-root', id: root.id, sortOrder: bi });
    }

    let order = 0;
    for (const section of brand.sections) {
      for (const item of section.items) {
        const existing = bySlug.get(item.slug);
        const taken = placed.has(item.slug);
        if (taken) continue;
        placed.add(item.slug);
        const sortOrder = order++;
        // A slug that is already a *brand* in this store (country stores use plain brand slugs)
        // cannot be reused for an item, so give the item a distinct, still-readable slug.
        const slugIsRoot = existing && !existing.parentId;
        if (existing && !slugIsRoot) {
          const wantsParent = root?.id;
          const metadata = { ...(existing.seoMetadata ?? {}), section: section.title };
          const changed =
            existing.sortOrder !== sortOrder || sectionOf(existing) !== section.title ||
            existing.name !== item.name || (wantsParent && existing.parentId !== wantsParent);
          if (changed) {
            steps.push({
              kind: 'update', id: existing.id, label: item.name,
              patch: {
                ...(existing.name !== item.name ? { name: item.name } : {}),
                ...(wantsParent && existing.parentId !== wantsParent ? { parentId: wantsParent } : {}),
                sortOrder, seoMetadata: metadata,
              },
            });
            counts.organise++;
            if (existing.name !== item.name) counts.rename++;
          }
        } else {
          const slug = slugIsRoot ? `${norm(brand.name).replace(/[^a-z0-9]+/g, '-')}-${item.slug}` : item.slug;
          if (slugIsRoot) warnings.push(`"${item.name}" (${brand.name}) uses the address ${slug} here because ${item.slug} is already a brand in this store.`);
          steps.push({ kind: 'create', brandKey, brandId: root?.id, name: item.name, slug, section: section.title, sortOrder });
          counts.create++;
        }
      }
    }

  });

  // Second pass, once every brand has claimed its items: whatever is left under a brand stays
  // where it is, grouped as "Other" after the standard items. Nothing is deleted.
  for (const brand of AMARISE_STRUCTURE) {
    const root = roots.find((r) => norm(r.name) === norm(brand.name));
    if (!root) continue;
    let order = 0;
    for (const c of (root.children ?? []).filter((k) => !placed.has(k.slug))) {
      placed.add(c.slug);
      const sortOrder = 100 + order++;
      if (sectionOf(c) !== 'Other' || c.sortOrder !== sortOrder) {
        steps.push({ kind: 'update', id: c.id, label: c.name, patch: { sortOrder, seoMetadata: { ...(c.seoMetadata ?? {}), section: 'Other' } } });
      }
      counts.keptAsOther++;
    }
  }
  return { steps, counts, warnings };
}

// Root slugs are only created for missing brands; keep the standard slug unless it is taken.
function bePlain(slug: string, taken: Map<string, CommerceCategory>, warnings: string[]): string {
  if (!taken.has(slug)) return slug;
  warnings.push(`Brand address ${slug} was taken, so a numbered one is used.`);
  return `${slug}-2`;
}
