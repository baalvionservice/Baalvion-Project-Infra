import { commerceStoresApi } from '@/lib/api/commerce-stores';
import type { Plan } from '@/lib/commerce/amariseStructure';
import type { CommerceCategory } from '@/lib/types/commerce.types';

/** Runs a plan against one store: brands first (so every new item has a parent), then items. */
export async function applyPlan(storeId: string, plan: Pick<Plan, 'steps'>): Promise<void> {
  const api = commerceStoresApi.categories;
  const rootIds = new Map<string, string>();
  for (const s of plan.steps) {
    if (s.kind === 'create-root') {
      const res = await api.create(storeId, { name: s.name, slug: s.slug, sortOrder: s.sortOrder, seoMetadata: { brand: true } });
      rootIds.set(s.key, res.data.data.id);
    } else if (s.kind === 'update-root') {
      await api.update(storeId, s.id, { sortOrder: s.sortOrder });
    }
  }
  for (const s of plan.steps) {
    if (s.kind === 'create') {
      const parentId = s.brandId ?? rootIds.get(s.brandKey);
      if (!parentId) throw new Error(`No brand found for ${s.name}`);
      await api.create(storeId, { name: s.name, slug: s.slug, parentId, sortOrder: s.sortOrder, seoMetadata: { section: s.section } });
    } else if (s.kind === 'update') {
      await api.update(storeId, s.id, s.patch as Partial<CommerceCategory>);
    }
  }
}
