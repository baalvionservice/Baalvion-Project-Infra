import type { CommerceCategory } from '@/lib/types/commerce.types';

export interface CategoryOption {
  id: string;
  /** "Hermès › Hermès Birkin Bags › Birkin 25" */
  label: string;
  depth: number;
  name: string;
}

// Depth-first walk of the category tree so brand → category → subcategory read as one path.
export function flattenCategoryPaths(tree: CommerceCategory[] = [], trail: string[] = []): CategoryOption[] {
  const out: CategoryOption[] = [];
  for (const c of tree) {
    const path = [...trail, c.name];
    // A category's section (Handbags, Accessories…) is shown between brand and item so the
    // picker reads "Hermès › Handbags › Birkin Bags".
    const section = typeof (c.seoMetadata as { section?: unknown } | undefined)?.section === 'string' ? (c.seoMetadata as { section: string }).section : '';
    const label = trail.length === 1 && section ? [trail[0], section, c.name].join(' › ') : path.join(' › ');
    out.push({ id: c.id, label, depth: trail.length, name: c.name });
    if (c.children?.length) out.push(...flattenCategoryPaths(c.children, path));
  }
  return out;
}
