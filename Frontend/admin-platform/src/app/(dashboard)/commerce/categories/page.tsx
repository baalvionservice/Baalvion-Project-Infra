'use client';

import { useEffect, useState } from 'react';
import { Plus, FolderOpen, Pencil, Trash2, GripVertical } from 'lucide-react';
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
import { useCommerceCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { CommerceCategory } from '@/lib/types/commerce.types';

interface CategoryFormState {
  name: string;
  description: string;
  parentId: string;
}

const defaultForm: CategoryFormState = { name: '', description: '', parentId: '' };

function flattenCategories(categories: CommerceCategory[], depth = 0): Array<CommerceCategory & { depth: number }> {
  const result: Array<CommerceCategory & { depth: number }> = [];
  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children?.length) {
      result.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return result;
}

export default function CategoriesPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommerceCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);

  const { data: categories, isLoading } = useCommerceCategories(storeId);
  const createCategory = useCreateCategory(storeId);
  const updateCategory = useUpdateCategory(storeId);
  const deleteCategory = useDeleteCategory(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Categories' }]);
  }, [setBreadcrumbs]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: CommerceCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '', parentId: cat.parentId ?? '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      parentId: form.parentId || undefined,
    };
    if (editing) {
      updateCategory.mutate({ categoryId: editing.id, payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createCategory.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const flat = flattenCategories(categories ?? []);
  const topLevel = (categories ?? []).filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description={`${flat.length} categories`}
        actions={
          <Button size="sm" onClick={openCreate} disabled={!storeId}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : flat.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No categories yet</p>
              <Button size="sm" onClick={openCreate} disabled={!storeId}>Add Category</Button>
            </div>
          ) : (
            <div className="divide-y">
              {flat.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                  style={{ paddingLeft: `${16 + cat.depth * 24}px` }}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <FolderOpen className={`h-4 w-4 ${cat.depth === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.children?.length ? (
                      <Badge variant="secondary" className="text-xs">{cat.children.length} sub</Badge>
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteCategory.mutate(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
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
              <Label>Parent Category</Label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">None (top-level)</option>
                {topLevel
                  .filter((c) => c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
