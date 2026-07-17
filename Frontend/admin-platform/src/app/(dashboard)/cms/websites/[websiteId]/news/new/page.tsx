'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, Radio, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentEditor from '@/components/cms/document-editor/DocumentEditor';
import { cn } from '@/lib/utils/cn';
import { slugify } from '@/lib/utils/format';
import { mediaApi } from '@/lib/api/media';
import { useCreateContent } from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useNewsTaxonomy } from '@/lib/hooks/useNewsTaxonomy';
import { NEWS_TOPICS, NEWS_REGIONS, type NewsTopic } from '@/lib/constants/news-taxonomy';
import { NEWS_LABELS, type ContentBlock, type CreateContentPayload, type NewsLabel } from '@/lib/types/cms-content.types';
import { useUIStore } from '@/lib/store/uiStore';
import { useCmsStore } from '@/lib/store/cmsStore';

/**
 * The WordPress-style "Add New Post" screen for daily news uploading — one big
 * writing surface, a right-hand sidebar for everything else. Deliberately a
 * full page rather than a modal: the block editor plus a dense sidebar felt
 * cramped and confusing stacked in a dialog (direct user feedback).
 */
export default function NewNewsPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const router = useRouter();
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsiteId = useCmsStore((s) => s.setActiveWebsiteId);
  useEffect(() => { setActiveWebsiteId(websiteId); }, [websiteId, setActiveWebsiteId]);

  const { data: website } = useWebsite(websiteId);
  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'News', href: `/cms/websites/${websiteId}/news` },
      { label: 'Add News' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const { resolveTopic, resolveRegion } = useNewsTaxonomy(websiteId);
  const { mutateAsync: create, isPending: isCreating } = useCreateContent();
  const { mutateAsync: transition, isPending: isPublishing } = useWorkflowTransition();
  const busy = isCreating || isPublishing;

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [region, setRegion] = useState<string>('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [labels, setLabels] = useState<NewsLabel[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTopic = (t: NewsTopic) =>
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleLabel = (l: NewsLabel) =>
    setLabels((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await mediaApi.files.upload(form);
      setFeaturedImage(res.data.data.url);
    } catch {
      /* surfaced by the global toast layer */
    } finally {
      setIsUploadingImage(false);
    }
  };

  const submit = async (publish: boolean) => {
    if (!title.trim()) return;
    const topicIds = await Promise.all(topics.map(resolveTopic));
    const regionId = region ? await resolveRegion(region) : null;
    const categoryIds = [...topicIds, ...(regionId ? [regionId] : [])];

    const payload: CreateContentPayload = {
      websiteId,
      type: 'news',
      title,
      slug: slugify(title),
      excerpt: excerpt || undefined,
      featuredImage: featuredImage || undefined,
      blocks,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      isBreaking,
      isTrending,
      isFeatured,
      newsLabels: labels,
    };
    const res = await create(payload);
    if (publish) {
      await transition({ contentId: res.data.data.id, action: 'publish' });
    }
    router.push(`/cms/websites/${websiteId}/news`);
  };

  return (
    <div className="space-y-4 pb-10">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href={`/cms/websites/${websiteId}/news`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          News
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column — title + writing surface */}
        <div className="space-y-4 min-w-0">
          <Input
            className="h-auto border-0 border-b rounded-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
            placeholder="Add headline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="rounded-md border px-4 py-3 min-h-[400px]">
            <DocumentEditor blocks={blocks} onChange={setBlocks} />
          </div>
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">/</span> for headings, lists, images and more — or select text to format it, like Google Docs.
          </p>
        </div>

        {/* Sidebar — everything else, WordPress-style boxes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Publish</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={busy || !title.trim()} onClick={() => submit(false)}>
                Save Draft
              </Button>
              <Button size="sm" className="flex-1" disabled={busy || !title.trim()} onClick={() => submit(true)}>
                {busy ? 'Publishing…' : 'Publish Now'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/pasted URL
                <img src={featuredImage} alt="" className="w-full rounded object-cover aspect-video border" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                  No image — one will be auto-generated
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isUploadingImage}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingImage ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                {featuredImage ? 'Replace image' : 'Upload image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { void handleImagePick(e.target.files?.[0]); e.target.value = ''; }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Topic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {NEWS_TOPICS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={topics.includes(t)} onCheckedChange={() => toggleTopic(t)} className="h-3.5 w-3.5" />
                  {t}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {NEWS_REGIONS.map((r) => {
                  const active = region === r.slug;
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => setRegion(active ? '' : r.slug)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs transition-colors',
                        active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="text-sm min-h-[70px]"
                placeholder="One or two plain-text sentences — shown in cards and search results."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Flags & Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isBreaking} onCheckedChange={(c) => setIsBreaking(!!c)} className="h-3.5 w-3.5" />
                  <Radio className="h-3.5 w-3.5 text-red-500" /> Breaking
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isTrending} onCheckedChange={(c) => setIsTrending(!!c)} className="h-3.5 w-3.5" />
                  <TrendingUp className="h-3.5 w-3.5 text-orange-500" /> Trending
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(!!c)} className="h-3.5 w-3.5" />
                  <Star className="h-3.5 w-3.5 text-amber-500" /> Featured
                </label>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Labels</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {NEWS_LABELS.map((label) => {
                    const active = labels.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleLabel(label)}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors',
                          active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
