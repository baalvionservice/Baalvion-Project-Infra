'use client';

import { use, useState, useEffect } from 'react';
import { Plus, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import CategoryTree from '@/components/cms/CategoryTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useWebsiteCategoryTree,
  useWebsiteCategories,
  useWebsiteTags,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateTag,
  useDeleteTag,
} from '@/lib/queries/cms-taxonomy.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { WebsiteCategory, CategoryTree as CategoryTreeType } from '@/lib/types/cms-taxonomy.types';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  parentId: string;
}

const DEFAULT_FORM: CategoryForm = { name: '', slug: '', description: '', parentId: '' };

export default function WebsiteCategoriesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  const { data: tree, isLoading: loadingTree } = useWebsiteCategoryTree(websiteId);
  const { data: flatCategories } = useWebsiteCategories(websiteId);
  const { data: tags, isLoading: loadingTags } = useWebsiteTags(websiteId);

  const { mutate: createCategory, isPending: creatingCat } = useCreateCategory(websiteId);
  const { mutate: updateCategory, isPending: updatingCat } = useUpdateCategory(websiteId);
  const { mutate: deleteCategory } = useDeleteCategory(websiteId);
  const { mutate: createTag, isPending: creatingTag } = useCreateTag(websiteId);
  const { mutate: deleteTag } = useDeleteTag(websiteId);

  const [catDialog, setCatDialog] = useState<{ open: boolean; editing?: CategoryTreeType }>({ open: false });
  const [form, setForm] = useState<CategoryForm>(DEFAULT_FORM);
  const [forcedParentId, setForcedParentId] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Categories' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const openCreate = (parentId?: string) => {
    setForm({ ...DEFAULT_FORM, parentId: parentId ?? '' });
    setForcedParentId(parentId ?? '');
    setCatDialog({ open: true });
  };

  const openEdit = (node: CategoryTreeType) => {
    setForm({
      name: node.name,
      slug: node.slug,
      description: node.description ?? '',
      parentId: node.parentId ?? '',
    });
    setCatDialog({ open: true, editing: node });
  };

  const closeDialog = () => {
    setCatDialog({ open: false });
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      parentId: form.parentId || null,
    };
    if (catDialog.editing) {
      updateCategory(
        { id: catDialog.editing.id, payload },
        { onSuccess: closeDialog }
      );
    } else {
      createCategory(
        { ...payload, websiteId },
        { onSuccess: closeDialog }
      );
    }
  };

  const handleCreateTag = () => {
    if (!newTag.trim()) return;
    createTag(
      {
        websiteId,
        name: newTag.trim(),
        slug: newTag.trim().toLowerCase().replace(/\s+/g, '-'),
      },
      { onSuccess: () => setNewTag('') }
    );
  };

  const autoSlug = (val: string) =>
    val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Taxonomy"
          description="Categories and tags for content organisation"
          actions={
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">
            Categories ({flatCategories?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="tags">Tags ({tags?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardContent className="p-2">
              <CategoryTree
                tree={tree ?? []}
                isLoading={loadingTree}
                onEdit={openEdit}
                onDelete={(id) => deleteCategory(id)}
                onAddChild={(parentId) => openCreate(parentId)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tags</CardTitle>
              <div className="flex gap-2 mt-2">
                <Input
                  className="h-8 text-xs"
                  placeholder="New tag name..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTags ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(tags ?? []).map((tag) => (
                    <div key={tag.id} className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Tag className="h-3 w-3" />
                        {tag.name}
                        <span className="text-muted-foreground">({tag.contentCount})</span>
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => deleteTag(tag.id)}
                        >
                          ×
                        </button>
                      </Badge>
                    </div>
                  ))}
                  {!tags?.length && (
                    <p className="text-xs text-muted-foreground">No tags yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category dialog */}
      <Dialog open={catDialog.open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {catDialog.editing ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                className="h-8 text-xs"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: f.slug === autoSlug(f.name) ? autoSlug(name) : f.slug,
                  }));
                }}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input
                className="h-8 text-xs"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parent Category</Label>
              <Select
                value={form.parentId || '__none__'}
                onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (top level)</SelectItem>
                  {(flatCategories ?? [])
                    .filter((c) => c.id !== catDialog.editing?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {'  '.repeat(c.depth)}{c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                className="h-8 text-xs"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={creatingCat || updatingCat || !form.name.trim()}
            >
              {catDialog.editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
