import { describe, it, expect } from 'vitest';
import { AMARISE_STRUCTURE, buildPlan, sectionOf } from './amariseStructure';
import type { CommerceCategory } from '@/lib/types/commerce.types';

let n = 0;
const cat = (name: string, slug: string, parentId: string | null = null, extra: Partial<CommerceCategory> = {}): CommerceCategory => ({
  id: `id-${++n}`, storeId: 's', parentId, name, slug, depth: parentId ? 1 : 0, sortOrder: 0, productCount: 0, isActive: true, seoMetadata: {}, createdAt: '', updatedAt: '', ...extra,
} as CommerceCategory);

// The live US store: brand roots (dept-*) with every item from the website menu, all at order 0, no sections.
const usTree = (): CommerceCategory[] =>
  AMARISE_STRUCTURE.map((b) => {
    const root = cat(b.name, b.slug);
    root.children = b.sections.flatMap((s) => s.items).map((i) => cat(i.name, i.slug, root.id));
    return root;
  });

describe('buildPlan — the live US store (all items present, no sections)', () => {
  it('organises every item and creates nothing', () => {
    const plan = buildPlan(usTree());
    const items = AMARISE_STRUCTURE.flatMap((b) => b.sections.flatMap((s) => s.items)).length;
    expect(plan.counts.create).toBe(0);
    expect(plan.counts.organise).toBe(items - 0); // order 0 already matches the first item only
    expect(plan.steps.every((s) => s.kind !== 'create' && s.kind !== 'create-root')).toBe(true);
  });
  it('gives each Hermès item its menu section', () => {
    const plan = buildPlan(usTree());
    const sec = (slug: string) => {
      const tree = usTree();
      const target = tree.flatMap((t) => t.children ?? []).find((c) => c.slug === slug)!;
      const p = buildPlan(tree);
      const step = p.steps.find((s) => s.kind === 'update' && s.id === target.id);
      return step && step.kind === 'update' ? (step.patch.seoMetadata as { section: string }).section : sectionOf(target);
    };
    expect(plan.counts.keptAsOther).toBe(0);
    expect(sec('hermes-birkin-handbags')).toBe('Handbags');
    expect(sec('hermes-wallets')).toBe('Accessories');
    expect(sec('hermes-exotic-handbags')).toBe('Curations');
  });
  it('is idempotent: applying the plan then planning again changes nothing', () => {
    const tree = usTree();
    const plan = buildPlan(tree);
    const byId = new Map(tree.flatMap((t) => [t, ...(t.children ?? [])]).map((c) => [c.id, c]));
    for (const s of plan.steps) {
      if (s.kind === 'update') Object.assign(byId.get(s.id)!, { ...s.patch });
      if (s.kind === 'update-root') byId.get(s.id)!.sortOrder = s.sortOrder;
    }
    expect(buildPlan(tree).steps).toHaveLength(0);
  });
  it('never repeats a category in two sections', () => {
    const slugs = AMARISE_STRUCTURE.flatMap((b) => b.sections.flatMap((s) => s.items.map((i) => i.slug)));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('buildPlan — a thin country store', () => {
  // Mirrors the live UK/AE/IN/SG stores: plain brand slugs, a few categories with longer names.
  const country = (): CommerceCategory[] => {
    const hermes = cat('Hermès', 'hermes'); const chanel = cat('Chanel', 'chanel'); const jewelry = cat('Jewelry', 'jewelry');
    hermes.children = [cat('Hermès Birkin Bags', 'hermes-birkin-handbags', hermes.id), cat('Hermès Wallets', 'hermes-wallets', hermes.id)];
    chanel.children = [cat('Chanel Flap Bags', 'chanel-flap-bags', chanel.id)];
    jewelry.children = [cat('Fine Jewelry', 'fine-jewelry', jewelry.id), cat('Watches', 'watches', jewelry.id)];
    return [hermes, chanel, jewelry];
  };
  it('creates the missing brands and items, and renames to the standard names', () => {
    const plan = buildPlan(country());
    expect(plan.steps.some((s) => s.kind === 'create-root' && s.name === 'Goyard')).toBe(true);
    expect(plan.steps.some((s) => s.kind === 'create-root' && s.name === 'New Arrivals')).toBe(true);
    expect(plan.counts.create).toBeGreaterThan(40);
    const birkin = plan.steps.find((s) => s.kind === 'update' && s.label === 'Birkin Bags');
    expect(birkin && birkin.kind === 'update' && birkin.patch.name).toBe('Birkin Bags');
  });
  it('moves Watches and Jewelry under Hermès to match the website, not duplicating them', () => {
    const plan = buildPlan(country());
    const moved = plan.steps.filter((s) => s.kind === 'update' && s.patch.parentId).map((s) => (s.kind === 'update' ? s.label : ''));
    expect(moved).toEqual(expect.arrayContaining(['Watches', 'Jewelry']));
    const creates = plan.steps.filter((s) => s.kind === 'create').map((s) => (s.kind === 'create' ? s.slug : ''));
    expect(creates).not.toContain('watches');
    expect(new Set(creates).size).toBe(creates.length);
  });
  it('avoids a slug that is already a brand (e.g. chanel, hermes, jewelry) and says so', () => {
    const plan = buildPlan(country());
    const creates = plan.steps.filter((s) => s.kind === 'create');
    expect(creates.some((s) => s.kind === 'create' && s.slug === 'chanel')).toBe(false);
    expect(plan.warnings.length).toBeGreaterThan(0);
  });
});

// The real Amarisé (US) store as it is live today: names and slugs read from the production database.
const LIVE_US: Array<[string, string, string]> = [
  ['-', 'Chanel', 'dept-chanel'], ['-', 'Goyard', 'dept-goyard'], ['-', 'Hermès', 'dept-hermes'], ['-', 'Jewelry', 'dept-jewelry'], ['-', 'New Arrivals', 'dept-new-arrivals'], ['-', 'Other Brands', 'dept-other-brands'],
  ['Hermès', 'All Hermès Bags', 'hermes-handbags'], ['Hermès', 'Bag Besties & Organizers', 'bag-besties-organizers'], ['Hermès', 'Belts', 'hermes-belts'], ['Hermès', 'Birkin Bags', 'hermes-birkin-handbags'], ['Hermès', 'Bolide Bags', 'hermes-bolide-bags'], ['Hermès', 'Charms', 'hermes-charms'], ['Hermès', 'Constance Bags', 'hermes-constance-handbags'], ['Hermès', 'Evelyne Bags', 'hermes-evelyne-bags'], ['Hermès', 'Exotic Handbags', 'hermes-exotic-handbags'], ['Hermès', 'Herbag Collection', 'hermes-herbag-collection'], ['Hermès', 'HSS Special Order Bags', 'hermes-hss-special-order-bags'], ['Hermès', 'Jewelry', 'fine-jewelry'], ['Hermès', 'Kelly Bags', 'hermes-kelly-handbags'], ['Hermès', 'Lindy Bags', 'hermes-lindy-bags'], ['Hermès', 'Picotin Bags', 'hermes-picotin-bags'], ['Hermès', 'Pochettes & Kelly Cuts', 'hermes-clutch'], ['Hermès', 'Pre-Owned & Vintage', 'hermes-pre-owned-vintage'], ['Hermès', 'Rare & Unique Bags', 'hermes-rare-handbags'], ['Hermès', 'Scarves', 'hermes-scarves'], ['Hermès', 'Shoes', 'hermes-shoes'], ['Hermès', 'Wallets', 'hermes-wallets'], ['Hermès', 'Watches', 'watches'],
  ['Other Brands', 'All Other Brands', 'other-bags-1'], ['Other Brands', 'Christian Dior', 'christian-dior-bags'], ['Other Brands', 'Fendi', 'fendi-bags'], ['Other Brands', 'Loro Piana', 'loro-piana-bags'], ['Other Brands', 'Louis Vuitton', 'louis-vuitton-bags'], ['Other Brands', 'The Row', 'the-row-bags'],
  ['Chanel', 'All Chanel Bags', 'chanel-bags'], ['Chanel', 'Chanel 22 Bags', 'chanel-22-bags'], ['Chanel', 'Chanel 25 Bags', 'chanel-25-bags'], ['Chanel', 'Classic Flap Bags', 'chanel-flap-bags'], ['Chanel', 'Classic Medium Bags', 'chanel-classic-medium'], ['Chanel', 'Classic Mini Bags', 'chanel-classic-mini'], ['Chanel', 'Classic Small Bags', 'chanel-classic-small'], ['Chanel', 'Contemporary Jewelry', 'chanel-contemporary-jewelry'], ['Chanel', 'Fashion & Runway', 'chanel-fashion-runway-bags'], ['Chanel', 'Jumbo & Maxi Flaps', 'chanel-jumbo-maxi-flaps'], ['Chanel', 'Pre-Owned & Vintage', 'chanel-pre-owned'], ['Chanel', 'Shoes', 'chanel-shoes'], ['Chanel', 'Totes', 'chanel-tote'], ['Chanel', 'Vintage Chanel Jewelry', 'vintage-chanel-jewelry'], ['Chanel', 'Wallet on Chain', 'chanel-wallet-on-chain'], ['Chanel', 'Wallets', 'chanel-wallets'],
  ['Jewelry', 'Bracelets', 'fine-jewelry-bracelets'], ['Jewelry', 'Chanel Jewelry', 'chanel'], ['Jewelry', 'Contemporary', 'jewelry-contemporary'], ['Jewelry', 'Costume Jewelry', 'costume-jewelry'], ['Jewelry', 'Earrings', 'fine-jewelry-earrings'], ['Jewelry', 'Fine Jewelry Brands', 'jewelry'], ['Jewelry', 'Hermès', 'hermes'], ['Jewelry', 'Necklaces', 'fine-jewelry-necklaces'], ['Jewelry', 'Rings', 'fine-jewelry-rings'], ['Jewelry', 'Vintage Jewelry', 'jewelry-vintage'],
  ['New Arrivals', 'Chanel', 'new-arrivals-chanel-handbags-and-accessories'], ['New Arrivals', 'Hermès', 'new-arrivals-hermes'], ['New Arrivals', 'Jewelry New Arrivals', 'jewelry-new-arrivals'], ['New Arrivals', 'New Arrivals', 'new-arrivals-handbags'], ['New Arrivals', 'Other Brands', 'view-all-new-arrivals'],
  ['Goyard', 'All Goyard Bags', 'goyard'], ['Goyard', 'Anjou', 'goyard-anjou-bags'], ['Goyard', 'Artois', 'goyard-artois-bags'], ['Goyard', 'Other Styles', 'goyard-other-styles'], ['Goyard', 'Saigon', 'goyard-saigon-bags'], ['Goyard', 'Saint Louis', 'goyard-st-louis-bags'],
];

describe('buildPlan — against the real live US store', () => {
  const tree = () => {
    const roots = LIVE_US.filter(([p]) => p === '-').map(([, name, slug]) => cat(name, slug));
    for (const r of roots) r.children = LIVE_US.filter(([p]) => p === r.name).map(([, name, slug]) => cat(name, slug, r.id));
    return roots;
  };
  it('has 71 categories to work with', () => { expect(LIVE_US.length).toBe(71); });
  it('adds nothing, renames nothing, and leaves no category as "Other"', () => {
    const plan = buildPlan(tree());
    expect(plan.counts).toMatchObject({ create: 0, rename: 0, keptAsOther: 0 });
    expect(plan.warnings).toEqual([]);
    expect(plan.steps.some((s) => s.kind === 'update' && s.patch.parentId)).toBe(false); // nothing moves between brands
  });
  it('puts all 22 Hermès items into Handbags / Accessories / Curations', () => {
    const t = tree();
    const plan = buildPlan(t);
    const hermes = t.find((r) => r.name === 'Hermès')!;
    const sections = (hermes.children ?? []).map((c) => {
      const step = plan.steps.find((s) => s.kind === 'update' && s.id === c.id);
      return step && step.kind === 'update' ? (step.patch.seoMetadata as { section: string }).section : '';
    });
    expect(sections.filter((x) => x === 'Handbags')).toHaveLength(11);
    expect(sections.filter((x) => x === 'Accessories')).toHaveLength(7);
    expect(sections.filter((x) => x === 'Curations')).toHaveLength(4);
  });
});
