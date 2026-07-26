'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, Radio, TrendingUp, Star, Plus, X, Link2 } from 'lucide-react';
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
import RelatedContentSuggestions from '@/components/cms/newsroom/RelatedContentSuggestions';

const pad2 = (n: number) => String(n).padStart(2, '0');

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

  const {
    resolveTopic, resolveRegion, resolveCountry, getCountriesForRegion,
    resolveState, getStatesForCountry, topicIdByName, regionIdBySlug, categories,
  } = useNewsTaxonomy(websiteId);
  const { mutateAsync: create, isPending: isCreating } = useCreateContent();
  const { mutateAsync: transition, isPending: isPublishing } = useWorkflowTransition();
  const busy = isCreating || isPublishing;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [featuredImage, setFeaturedImage] = useState('');
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [region, setRegion] = useState<string>('');
  const [countryName, setCountryName] = useState('');
  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState('');
  const [isCreatingCountry, setIsCreatingCountry] = useState(false);
  const [stateName, setStateName] = useState('');
  const [isAddingState, setIsAddingState] = useState(false);
  const [newStateInput, setNewStateInput] = useState('');
  const [isCreatingState, setIsCreatingState] = useState(false);
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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) setSlug(slugify(val));
  };

  const handleRegionChange = (next: string) => {
    setRegion(next);
    setCountryName('');
    setIsAddingCountry(false);
    setNewCountryInput('');
    setStateName('');
    setIsAddingState(false);
    setNewStateInput('');
  };

  const handleCountryChange = (next: string) => {
    setCountryName(next);
    setStateName('');
    setIsAddingState(false);
    setNewStateInput('');
  };

  const handleAddCountry = async () => {
    const name = newCountryInput.trim();
    if (!name || !region) return;
    setIsCreatingCountry(true);
    try {
      await resolveCountry(region, name);
      handleCountryChange(name);
      setIsAddingCountry(false);
      setNewCountryInput('');
    } finally {
      setIsCreatingCountry(false);
    }
  };

  const handleAddState = async () => {
    const name = newStateInput.trim();
    if (!name || !region || !countryName) return;
    setIsCreatingState(true);
    try {
      await resolveState(region, countryName, name);
      setStateName(name);
      setIsAddingState(false);
      setNewStateInput('');
    } finally {
      setIsCreatingState(false);
    }
  };

  // Preview only — mirrors lib/newsroom/public-url.ts's scheme without needing
  // real category IDs yet (region/country/state categories may not exist until submit).
  // "Publish Now" sets publishedAt to this same moment, so "today" is accurate;
  // "Save Draft" shows the date it WOULD get if published right now.
  const previewPath = (() => {
    const now = new Date();
    const datePath = `${now.getUTCFullYear()}/${pad2(now.getUTCMonth() + 1)}/${pad2(now.getUTCDate())}`;
    const finalSlug = slug || slugify(title) || 'untitled-headline';
    if (region && region !== 'world' && countryName && stateName) {
      return `/world/${region}/${slugify(countryName)}/${slugify(stateName)}/${datePath}/${finalSlug}`;
    }
    if (region && region !== 'world' && countryName) {
      return `/world/${region}/${slugify(countryName)}/${datePath}/${finalSlug}`;
    }
    return `/${datePath}/${finalSlug}`;
  })();

  const relatedCategoryId = topics.length
    ? topicIdByName.get(topics[0].toLowerCase())
    : (region ? regionIdBySlug.get(region) : undefined);

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
    const countryId = region && countryName ? (await resolveCountry(region, countryName)).id : null;
    const stateId = region && countryName && stateName ? (await resolveState(region, countryName, stateName)).id : null;
    const categoryIds = [...topicIds, ...(regionId ? [regionId] : []), ...(countryId ? [countryId] : []), ...(stateId ? [stateId] : [])];

    const payload: CreateContentPayload = {
      websiteId,
      type: 'news',
      title,
      slug: slug || slugify(title),
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
            onChange={(e) => handleTitleChange(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="shrink-0">{website?.domain ?? 'imperialpedia.com'}{previewPath}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Slug:</span>
            <Input
              className="h-7 max-w-sm text-xs font-mono"
              value={slug}
              placeholder={slugify(title) || 'auto-generated-from-headline'}
              onChange={(e) => { setIsSlugManuallyEdited(true); setSlug(slugify(e.target.value)); }}
            />
          </div>
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
              <CardTitle className="text-sm">Region, Country &amp; State</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {NEWS_REGIONS.map((r) => {
                  const active = region === r.slug;
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => handleRegionChange(active ? '' : r.slug)}
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

              {region && region !== 'world' && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Country <span className="italic">(gives the article its own /world/{region}/&lt;country&gt;/... page)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getCountriesForRegion(region).map((c) => {
                      const active = countryName === c.name;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCountryChange(active ? '' : c.name)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs transition-colors',
                            active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                    {!isAddingCountry && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCountry(true)}
                        className="flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/60"
                      >
                        <Plus className="h-3 w-3" /> New country
                      </button>
                    )}
                  </div>
                  {isAddingCountry && (
                    <div className="flex gap-1.5">
                      <Input
                        className="h-7 text-xs"
                        placeholder="e.g. India"
                        value={newCountryInput}
                        onChange={(e) => setNewCountryInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAddCountry(); } }}
                        autoFocus
                      />
                      <Button type="button" size="sm" className="h-7 text-xs" disabled={!newCountryInput.trim() || isCreatingCountry} onClick={() => void handleAddCountry()}>
                        {isCreatingCountry ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setIsAddingCountry(false); setNewCountryInput(''); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {region && region !== 'world' && countryName && (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    State / Province <span className="italic">(optional — nests one level deeper: /world/{region}/{slugify(countryName)}/&lt;state&gt;/...)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getStatesForCountry(region, countryName).map((s) => {
                      const active = stateName === s.name;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setStateName(active ? '' : s.name)}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs transition-colors',
                            active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted/60',
                          )}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                    {!isAddingState && (
                      <button
                        type="button"
                        onClick={() => setIsAddingState(true)}
                        className="flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted/60"
                      >
                        <Plus className="h-3 w-3" /> New state
                      </button>
                    )}
                  </div>
                  {isAddingState && (
                    <div className="flex gap-1.5">
                      <Input
                        className="h-7 text-xs"
                        placeholder="e.g. California"
                        value={newStateInput}
                        onChange={(e) => setNewStateInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAddState(); } }}
                        autoFocus
                      />
                      <Button type="button" size="sm" className="h-7 text-xs" disabled={!newStateInput.trim() || isCreatingState} onClick={() => void handleAddState()}>
                        {isCreatingState ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setIsAddingState(false); setNewStateInput(''); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Related Content</CardTitle>
            </CardHeader>
            <CardContent>
              <RelatedContentSuggestions
                websiteId={websiteId}
                websiteSlug={website?.slug}
                websiteDomain={website?.domain}
                categoryId={relatedCategoryId}
                categories={categories}
              />
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
