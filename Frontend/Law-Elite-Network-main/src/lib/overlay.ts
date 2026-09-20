/**
 * Bundled records overridden field by field by whatever editors manage in the
 * admin panel (undefined never overwrites), with admin-only records appended
 * and archived slugs removed from the bundled set. Shared by every
 * admin-managed entity so they all merge the same way.
 */
export function overlay<T extends { slug: string }>(bundled: T[], managed: T[], hidden: Set<string>): T[] {
  const bySlug = new Map(managed.map((m) => [m.slug, m]));
  const merged = bundled
    .filter((b) => !hidden.has(b.slug))
    .map((b) => {
      const m = bySlug.get(b.slug);
      if (!m) return b;
      bySlug.delete(b.slug);
      const defined = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined));
      return { ...b, ...defined } as T;
    });
  return [...merged, ...bySlug.values()];
}
