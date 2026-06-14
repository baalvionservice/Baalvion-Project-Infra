'use client';

import { use, useState, useEffect } from 'react';
import { Plus, ArrowLeft, Tag, Search } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import CategoryTree from '@/components/cms/CategoryTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  seoTitle: string;
  seoDescription: string;
  keywords: string; // comma-separated in the form
  ogImage: string;
  noIndex: boolean;
}

const DEFAULT_FORM: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  parentId: '',
  seoTitle: '',
  seoDescription: '',
  keywords: '',
  ogImage: '',
  noIndex: false,
};

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
    const seo = node.seoMetadata ?? {};
    setForm({
      name: node.name,
      slug: node.slug,
      description: node.description ?? '',
      parentId: node.parentId ?? '',
      seoTitle: seo.title ?? '',
      seoDescription: seo.description ?? '',
      keywords: (seo.keywords ?? []).join(', '),
      ogImage: seo.ogImage ?? '',
      noIndex: seo.noIndex ?? false,
    });
    setCatDialog({ open: true, editing: node });
  };

  const closeDialog = () => {
    setCatDialog({ open: false });
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    const keywords = form.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const seoMetadata = {
      ...(form.seoTitle ? { title: form.seoTitle } : {}),
      ...(form.seoDescription ? { description: form.seoDescription } : {}),
      ...(keywords.length ? { keywords } : {}),
      ...(form.ogImage ? { ogImage: form.ogImage } : {}),
      ...(form.noIndex ? { noIndex: true } : {}),
    };
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      parentId: form.parentId || null,
      seoMetadata,
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {catDialog.editing ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
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

            {/* Per-category SEO — drives how this topic page ranks and appears in search */}
            <div className="rounded-md border bg-muted/20 p-2.5 space-y-3">
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-semibold">Search engine (SEO)</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Page title</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder={form.name ? `${form.name} — News & Analysis` : 'SEO title'}
                  value={form.seoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta description</Label>
                <textarea
                  className="min-h-[56px] w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Up to ~155 characters shown under the title in Google."
                  value={form.seoDescription}
                  onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Keywords</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="banking, savings, loans (comma separated)"
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Social image URL (Open Graph)</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="https://… (1200×630)"
                  value={form.ogImage}
                  onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Hide from search engines</Label>
                  <p className="text-[10px] text-muted-foreground">Adds noindex to this category page</p>
                </div>
                <Switch
                  checked={form.noIndex}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, noIndex: v }))}
                />
              </div>
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
