export interface WebsiteCategory {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  depth: number;
  order: number;
  contentCount: number;
  children?: WebsiteCategory[];
  createdAt: string;
  updatedAt: string;
}

export type CategoryTree = WebsiteCategory & { children: CategoryTree[] };

export interface WebsiteTag {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  contentCount: number;
  createdAt: string;
}

export interface CreateCategoryPayload {
  websiteId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  order?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  order?: number;
}

export interface ReorderCategoryPayload {
  items: Array<{ id: string; order: number; parentId: string | null }>;
}

export interface CreateTagPayload {
  websiteId: string;
  name: string;
  slug: string;
}

export function buildCategoryTree(flat: WebsiteCategory[]): CategoryTree[] {
  const map = new Map<string, CategoryTree>();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryTree[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (nodes: CategoryTree[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}
