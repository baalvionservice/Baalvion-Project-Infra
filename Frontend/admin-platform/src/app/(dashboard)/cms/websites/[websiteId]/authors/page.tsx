'use client';

import { use, useState, useEffect } from 'react';
import { Plus, ArrowLeft, Search, Pencil, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useWebsiteAuthors,
  useCreateAuthor,
  useUpdateAuthor,
  useDeleteAuthor,
} from '@/lib/queries/cms-authors.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { WebsiteAuthor } from '@/lib/types/cms-authors.types';

interface AuthorForm {
  name: string;
  slug: string;
  title: string;
  credentials: string;
  bio: string;
  avatarUrl: string;
  expertise: string; // comma-separated in the form
  linkedin: string;
  x: string;
  status: boolean; // true = active
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogImage: string;
  noIndex: boolean;
}

const DEFAULT_FORM: AuthorForm = {
  name: '',
  slug: '',
  title: '',
  credentials: '',
  bio: '',
  avatarUrl: '',
  expertise: '',
  linkedin: '',
  x: '',
  status: true,
  seoTitle: '',
  seoDescription: '',
  keywords: '',
  ogImage: '',
  noIndex: false,
};

const autoSlug = (val: string) =>
  val.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function WebsiteAuthorsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  const { data: authors, isLoading } = useWebsiteAuthors(websiteId);

  const { mutate: createAuthor, isPending: creating } = useCreateAuthor(websiteId);
  const { mutate: updateAuthor, isPending: updating } = useUpdateAuthor(websiteId);
  const { mutate: deleteAuthor } = useDeleteAuthor(websiteId);

  const [dialog, setDialog] = useState<{ open: boolean; editing?: WebsiteAuthor }>({ open: false });
  const [form, setForm] = useState<AuthorForm>(DEFAULT_FORM);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Authors' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setDialog({ open: true });
  };

  const openEdit = (a: WebsiteAuthor) => {
    const seo = a.seoMetadata ?? {};
    setForm({
      name: a.name,
      slug: a.slug,
      title: a.title ?? '',
      credentials: a.credentials ?? '',
      bio: a.bio ?? '',
      avatarUrl: a.avatarUrl ?? '',
      expertise: (a.expertise ?? []).join(', '),
      linkedin: a.social?.linkedin ?? '',
      x: a.social?.x ?? '',
      status: a.status !== 'inactive',
      seoTitle: seo.title ?? '',
      seoDescription: seo.description ?? '',
      keywords: (seo.keywords ?? []).join(', '),
      ogImage: seo.ogImage ?? '',
      noIndex: seo.noIndex ?? false,
    });
    setDialog({ open: true, editing: a });
  };

  const closeDialog = () => {
    setDialog({ open: false });
    setForm(DEFAULT_FORM);
  };

  const handleSave = () => {
    const expertise = form.expertise.split(',').map((k) => k.trim()).filter(Boolean);
    const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
    const social = {
      ...(form.linkedin ? { linkedin: form.linkedin } : {}),
      ...(form.x ? { x: form.x } : {}),
    };
    const seoMetadata = {
      ...(form.seoTitle ? { title: form.seoTitle } : {}),
      ...(form.seoDescription ? { description: form.seoDescription } : {}),
      ...(keywords.length ? { keywords } : {}),
      ...(form.ogImage ? { ogImage: form.ogImage } : {}),
      ...(form.noIndex ? { noIndex: true } : {}),
    };

    if (dialog.editing) {
      updateAuthor(
        {
          id: dialog.editing.id,
          payload: {
            name: form.name,
            slug: form.slug || undefined,
            title: form.title || null,
            credentials: form.credentials || null,
            bio: form.bio || null,
            avatarUrl: form.avatarUrl || null,
            expertise,
            social,
            seoMetadata,
            status: form.status ? 'active' : 'inactive',
          },
        },
        { onSuccess: closeDialog }
      );
    } else {
      createAuthor(
        {
          websiteId,
          name: form.name,
          slug: form.slug || undefined,
          title: form.title || null,
          credentials: form.credentials || null,
          bio: form.bio || null,
          avatarUrl: form.avatarUrl || null,
          expertise,
          social,
          seoMetadata,
        },
        { onSuccess: closeDialog }
      );
    }
  };

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
          title="Authors"
          description="Contributor profiles powering bylines and E-E-A-T author pages"
          actions={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Author
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(authors ?? []).map((a) => (
            <Card key={a.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.title || '—'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => deleteAuthor(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {a.status === 'inactive' && (
                    <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                  )}
                  {(a.expertise ?? []).slice(0, 3).map((x) => (
                    <Badge key={x} variant="secondary" className="text-[10px]">{x}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {!authors?.length && (
            <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">
              No authors yet. Create one to power bylines on this site.
            </p>
          )}
        </div>
      )}

      {/* Author dialog */}
      <Dialog open={dialog.open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? 'Edit Author' : 'New Author'}</DialogTitle>
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
                placeholder="auto-generated from name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Editorial title</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Corporate & Securities Editor"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Credentials</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. LL.M. · 12+ years covering corporate law"
                value={form.credentials}
                onChange={(e) => setForm((f) => ({ ...f, credentials: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Biography</Label>
              <textarea
                className="min-h-[96px] w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Multi-sentence bio shown on the author page (E-E-A-T)."
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expertise (focus areas)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Business & Corporate, Tax & Finance (comma separated)"
                value={form.expertise}
                onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Portrait URL (optional)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="https://… (square headshot)"
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">LinkedIn URL</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.linkedin}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">X (Twitter) URL</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.x}
                  onChange={(e) => setForm((f) => ({ ...f, x: e.target.value }))}
                />
              </div>
            </div>

            {dialog.editing && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Active</Label>
                  <p className="text-[10px] text-muted-foreground">Inactive authors are hidden from the public site</p>
                </div>
                <Switch
                  checked={form.status}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, status: v }))}
                />
              </div>
            )}

            {/* Per-author SEO */}
            <div className="rounded-md border bg-muted/20 p-2.5 space-y-3">
              <div className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-semibold">Search engine (SEO)</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Page title</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder={form.name ? `${form.name} — ${form.title || 'Contributor'}` : 'SEO title'}
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
                  placeholder="comma separated"
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
                  <p className="text-[10px] text-muted-foreground">Adds noindex to this author page</p>
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
            <Button size="sm" onClick={handleSave} disabled={creating || updating || !form.name.trim()}>
              {dialog.editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
