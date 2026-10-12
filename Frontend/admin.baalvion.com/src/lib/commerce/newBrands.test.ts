import { describe, it, expect } from 'vitest';
import { buildBrandPlan, parseSections, slugify } from './newBrands';
import type { CommerceCategory } from '@/lib/types/commerce.types';

let n = 0;
const cat = (name: string, slug: string, parentId: string | null = null, sortOrder = 0): CommerceCategory =>
  ({ id: `id-${++n}`, storeId: 's', parentId, name, slug, depth: parentId ? 1 : 0, sortOrder, productCount: 0, isActive: true, seoMetadata: {}, createdAt: '', updatedAt: '' } as CommerceCategory);

const tree = () => {
  const other = cat('Other Brands', 'dept-other-brands', null, 4);
  other.children = [cat('The Row', 'the-row-bags', other.id, 0), cat('Fendi', 'fendi-bags', other.id, 3), cat('All Other Brands', 'other-bags-1', other.id, 5)];
  const hermes = cat('Hermès', 'dept-hermes', null, 1);
  return [hermes, other];
};

describe('slugify', () => {
  it('handles accents, ampersands and spacing', () => {
    expect(slugify('Hermès')).toBe('hermes');
    expect(slugify('Saint Laurent & Co.')).toBe('saint-laurent-and-co');
  });
});

describe('parseSections', () => {
  it('reads "Section: a, b" lines and merges repeats', () => {
    const r = parseSections('Handbags: Kelly, Birkin\nAccessories: Belts\nhandbags: Birkin, Lindy');
    expect(r.errors).toEqual([]);
    expect(r.sections).toEqual([{ title: 'Handbags', items: ['Kelly', 'Birkin', 'Lindy'] }, { title: 'Accessories', items: ['Belts'] }]);
  });
  it('explains a line it cannot read', () => {
    expect(parseSections('just words').errors[0]).toMatch(/Section: item/);
    expect(parseSections('Handbags:').errors[0]).toMatch(/no items/);
  });
});

describe('buildBrandPlan — under Other Brands', () => {
  it('adds new brands, skips ones that exist, and keeps "All Other Brands" last', () => {
    const plan = buildBrandPlan(tree(), { mode: 'under-other', names: ['Prada', 'fendi', 'Bottega Veneta', 'Prada'] });
    const creates = plan.steps.filter((s) => s.kind === 'create');
    expect(creates.map((s) => s.kind === 'create' && s.name)).toEqual(['Prada', 'Bottega Veneta']);
    expect(creates.map((s) => s.kind === 'create' && s.slug)).toEqual(['prada-bags', 'bottega-veneta-bags']);
    expect(plan.warnings.join(' ')).toMatch(/already listed/);
    const all = plan.steps.find((s) => s.kind === 'update');
    expect(all && all.kind === 'update' && all.patch.sortOrder).toBe(6); // after Prada=4, Bottega=5
  });
  it('asks for the standard structure first when there is no Other Brands group', () => {
    expect(buildBrandPlan([], { mode: 'under-other', names: ['Prada'] }).errors[0]).toMatch(/standard structure/);
  });
});

describe('buildBrandPlan — under Jewelry', () => {
  const withJewelry = () => {
    const t = tree();
    const j = cat('Jewelry', 'dept-jewelry', null, 5);
    j.children = [cat('Hermès', 'hermes', j.id, 0), cat('Chanel Jewelry', 'chanel', j.id, 1)];
    return [...t, j];
  };
  it('adds jewelry brands under Jewelry as "By brand" with jewelry slugs', () => {
    const plan = buildBrandPlan(withJewelry(), { mode: 'under-jewelry', names: ['Cartier', 'Van Cleef & Arpels', 'hermès'] });
    const creates = plan.steps.filter((s) => s.kind === 'create');
    expect(creates.map((s) => s.kind === 'create' && s.slug)).toEqual(['cartier-jewelry', 'van-cleef-and-arpels-jewelry']);
    expect(creates.every((s) => s.kind === 'create' && s.section === 'By brand')).toBe(true);
    expect(plan.warnings.join(' ')).toMatch(/already listed/);
  });
  it('asks for the standard structure first when Jewelry is missing', () => {
    expect(buildBrandPlan(tree(), { mode: 'under-jewelry', names: ['Cartier'] }).errors[0]).toMatch(/standard structure/);
  });
});

describe('buildBrandPlan — a brand with its own menu', () => {
  it('creates the brand, its sections and items with unique slugs, in order', () => {
    const plan = buildBrandPlan(tree(), { mode: 'own', brand: 'Cartier', sections: [{ title: 'Jewelry', items: ['Love Bracelets', 'Rings'] }, { title: 'Watches', items: ['Tank'] }] });
    expect(plan.errors).toEqual([]);
    expect(plan.summary).toEqual({ brands: 1, items: 3 });
    const root = plan.steps[0];
    expect(root.kind === 'create-root' && root.slug).toBe('dept-cartier');
    expect(root.kind === 'create-root' && root.sortOrder).toBe(5); // after Other Brands (4)
    const slugs = plan.steps.filter((s) => s.kind === 'create').map((s) => (s.kind === 'create' ? s.slug : ''));
    expect(slugs).toEqual(['cartier-love-bracelets', 'cartier-rings', 'cartier-tank']);
  });
  it('refuses a brand that already exists and points to the right action', () => {
    expect(buildBrandPlan(tree(), { mode: 'own', brand: 'hermes', sections: [{ title: 'A', items: ['b'] }] }).errors[0]).toMatch(/already exists/);
  });
  it('never reuses a slug already in the store', () => {
    const t = tree(); t[0].children = [cat('X', 'cartier-rings', t[0].id)];
    const plan = buildBrandPlan(t, { mode: 'own', brand: 'Cartier', sections: [{ title: 'Jewelry', items: ['Rings'] }] });
    expect(plan.steps.some((s) => s.kind === 'create' && s.slug === 'cartier-rings-2')).toBe(true);
  });
  it('requires at least one item', () => {
    expect(buildBrandPlan(tree(), { mode: 'own', brand: 'Cartier', sections: [] }).errors[0]).toMatch(/at least one/);
  });
});
