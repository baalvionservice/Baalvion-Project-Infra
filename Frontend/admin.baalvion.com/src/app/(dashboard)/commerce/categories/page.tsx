'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Folder, Pencil, ChevronRight, ChevronDown, Search, Package } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCommerceCategories, useCreateCategory, useUpdateCategory } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { CommerceCategory } from '@/lib/types/commerce.types';
import { flattenCategoryPaths } from '@/lib/utils/categoryPaths';
import StructureSetupDialog from '@/components/commerce/StructureSetupDialog';
import { sectionOf } from '@/lib/commerce/amariseStructure';

interface CategoryFormState {
  name: string;
  description: string;
  parentId: string;
  section: string;
}

const defaultForm: CategoryFormState = { name: '', description: '', parentId: '', section: '' };

// Total products at or below a node, so a brand row shows everything under it.
function totalProducts(c: CommerceCategory): number {
  return (c.productCount ?? 0) + (c.children ?? []).reduce((n, k) => n + totalProducts(k), 0);
}

function matches(c: CommerceCategory, q: string): boolean {
  return c.name.toLowerCase().includes(q) || (c.children ?? []).some((k) => matches(k, q));
}

// A brand's items grouped under their section, sections ordered by where their first item sits.
function sectionGroups(kids: CommerceCategory[]) {
  const groups = new Map<string, CommerceCategory[]>();
  for (const k of kids.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))) {
    const t = sectionOf(k) || 'Other';
    groups.set(t, [...(groups.get(t) ?? []), k]);
  }
  return Array.from(groups, ([title, items]) => ({ title, items }));
}

export default function CategoriesPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommerceCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [query, setQuery] = useState('');
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const { data: categories, isLoading } = useCommerceCategories(storeId);
  const createCategory = useCreateCategory(storeId);
  const updateCategory = useUpdateCategory(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Categories' }]);
  }, [setBreadcrumbs]);

  const openCreate = (parentId = '') => {
    setEditing(null);
    setForm({ ...defaultForm, parentId });
    setDialogOpen(true);
  };

  const openEdit = (cat: CommerceCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '', parentId: cat.parentId ?? '', section: sectionOf(cat) });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const section = form.section.trim();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      parentId: form.parentId || undefined,
      // Merge so nothing else stored on the category is lost when only the section changes.
      seoMetadata: { ...(editing?.seoMetadata ?? {}), ...(section ? { section } : {}) },
    };
    if (editing) {
      updateCategory.mutate({ categoryId: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createCategory.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const tree = categories ?? [];
  const knownSections = Array.from(new Set(tree.flatMap((b) => (b.children ?? []).map((c) => sectionOf(c)).filter(Boolean))));
  const options = flattenCategoryPaths(tree);
  const q = query.trim().toLowerCase();
  const visibleTree = q ? tree.filter((c) => matches(c, q)) : tree;
  const brands = tree.length;
  const subs = options.length - brands;

  const renderNode = (cat: CommerceCategory, depth: number): React.ReactNode => {
    const kids = (cat.children ?? []).filter((k) => !q || matches(k, q) || cat.name.toLowerCase().includes(q));
    const isClosed = !q && closed[cat.id];
    const count = totalProducts(cat);
    return (
      <div key={cat.id}>
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5 transition-colors hover:bg-muted/30 sm:px-4"
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {kids.length ? (
              <button
                type="button"
                aria-label={isClosed ? 'Expand' : 'Collapse'}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                onClick={() => setClosed((c) => ({ ...c, [cat.id]: !c[cat.id] }))}
              >
                {isClosed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            {depth === 0 ? <FolderOpen className="h-4 w-4 shrink-0 text-primary" /> : <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <div className="min-w-0">
              <p className={`truncate text-sm ${depth === 0 ? 'font-semibold' : 'font-medium'}`}>{cat.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {depth === 0 ? 'Brand' : depth === 1 ? (sectionOf(cat) || 'Category') : 'Subcategory'}
                {cat.children?.length ? ` · ${cat.children.length} inside` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={count ? 'default' : 'secondary'} className="text-xs">
              {count} {count === 1 ? 'product' : 'products'}
            </Badge>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" asChild>
              <Link href={`/commerce/products/new?category=${cat.id}`}>
                <Package className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add product</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => openCreate(cat.id)}>
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sub</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)} aria-label={`Edit ${cat.name}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {!isClosed && (depth === 0 && kids.some((k) => sectionOf(k))
          ? sectionGroups(kids).map((g) => (
              <div key={g.title}>
                <div className="border-b bg-muted/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ paddingLeft: `${12 + 20}px` }}>
                  {g.title} <span className="font-normal normal-case tracking-normal">· {g.items.length}</span>
                </div>
                {g.items.map((k) => renderNode(k, depth + 1))}
              </div>
            ))
          : kids.map((k) => renderNode(k, depth + 1)))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands & categories"
        description={`${brands} brands · ${subs} categories and subcategories. Open any row to add a product straight into it.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StructureSetupDialog />
          <Button size="sm" onClick={() => openCreate()} disabled={!storeId}>
            <Plus className="mr-2 h-4 w-4" />
            New brand / category
          </Button>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brands and categories" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !storeId ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Pick a store first (Commerce overview, or the Online shop section on the website page).
            </div>
          ) : visibleTree.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">{q ? 'Nothing matches that search' : 'No categories yet'}</p>
              {!q && <Button size="sm" onClick={() => openCreate()}>Add Category</Button>}
            </div>
          ) : (
            <div>{visibleTree.map((c) => renderNode(c, 0))}</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : form.parentId ? 'New subcategory' : 'New brand / category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Section <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input
                list="section-suggestions"
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                placeholder="e.g. Handbags, Accessories, Curations"
              />
              <datalist id="section-suggestions">
                {knownSections.map((t) => <option key={t} value={t} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Groups this item under a heading inside its brand. Leave empty for a brand.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">None (top-level brand)</option>
                {options
                  .filter((c) => c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createCategory.isPending || updateCategory.isPending}
            >
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
