'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Search, Clock, History, Settings2, Tag as TagIcon, Eye, Pencil, Send, Globe, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DocumentEditor from './document-editor/DocumentEditor';
import ContentPreview from './ContentPreview';
import LivePreviewFrame from './LivePreviewFrame';
import SeoPanel from './SeoPanel';
import RevisionHistory from './RevisionHistory';
import WorkflowPanel from './WorkflowPanel';
import ContentClassificationPanel from './ContentClassificationPanel';
import NewsMetaPanel, { type NewsMeta } from './NewsMetaPanel';
import CustomFieldsPanel from './CustomFieldsPanel';
import ReviewerPanel from './ReviewerPanel';
import CitationsPanel from './CitationsPanel';
import ContentWorkflowBadge from './ContentWorkflowBadge';
import RelatedContentSuggestions from './newsroom/RelatedContentSuggestions';
import { useUpdateContent, useAutosave } from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { useWebsiteCategoryTree } from '@/lib/queries/cms-taxonomy.queries';
import { flattenCategoryTree } from '@/lib/types/cms-taxonomy.types';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { ContentItem, ContentBlock } from '@/lib/types/cms-content.types';
import type { SeoMeta } from '@/lib/types/cms.types';
import type { CmsRole } from '@/lib/types/cms-website.types';

interface Props {
  content: ContentItem;
  userRole?: CmsRole;
  /** Can this user publish/schedule/unpublish (cms_publisher+)? Gates the toolbar's
   *  primary action — contributors/authors below that level get "Submit for Review"
   *  instead of a "Publish" button that would just 403 when they click it. */
  canPublish?: boolean;
  websiteTitleSuffix?: string;
  websiteDomain?: string | null;
  websiteSlug?: string;
}

export default function ContentEditor({ content, userRole, canPublish, websiteTitleSuffix, websiteDomain, websiteSlug }: Props) {
  const { mutate: save, isPending: isSaving } = useUpdateContent(content.id);
  const { mutate: runTransition, isPending: isTransitioning } = useWorkflowTransition();
  const autosave = useAutosave(content.id);
  const isPublished = content.status === 'published';
  // Matches the backend's submit_for_review transition `from` states (see cms-service
  // workflowService.js TRANSITIONS) — only offer the button when it would actually work.
  const canSubmitForReview = content.status === 'draft' || content.status === 'changes_requested';
  const { hasUnsavedChanges, lastAutosaveAt, markUnsaved, activeSidePanel, toggleSidePanel } =
    useCmsStore();

  const [title, setTitle] = useState(content.title);
  const [slug, setSlug] = useState(content.slug);
  const [excerpt, setExcerpt] = useState(content.excerpt ?? '');
  const [blocks, setBlocks] = useState<ContentBlock[]>(content.blocks);
  const [seo, setSeo] = useState<SeoMeta>(content.seo ?? {});
  // Classification — one or more categories (first = primary) plus any number of tags.
  // Drives the article's section + which topic pages it lands on.
  const [categoryIds, setCategoryIds] = useState<string[]>(content.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<string[]>(content.tagIds ?? []);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>(content.customFields ?? {});
  const [newsMeta, setNewsMeta] = useState<NewsMeta>({
    galleryImages: content.galleryImages ?? [],
    videoUrl: content.videoUrl,
    readingTimeMinutes: content.readingTimeMinutes,
    isFeatured: content.isFeatured,
    isBreaking: content.isBreaking,
    isTrending: content.isTrending,
    isEditorsPick: content.isEditorsPick,
    isPremium: content.isPremium,
    newsLabels: content.newsLabels ?? [],
    externalSourceName: content.externalSourceName,
    externalSourceUrl: content.externalSourceUrl,
  });
  const [mode, setMode] = useState<'edit' | 'preview' | 'live'>('edit');

  const { data: categoryTree } = useWebsiteCategoryTree(content.websiteId);
  const flatCategories = useMemo(() => flattenCategoryTree(categoryTree ?? []), [categoryTree]);

  // Client-side estimate shown as a placeholder in the panel — the server recomputes
  // the authoritative value from contentBlocks on save when the field is left blank.
  const autoReadingTime = (() => {
    const words = blocks
      .map((b) => (typeof b.content?.text === 'string' ? b.content.text : ''))
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return words ? Math.max(1, Math.round(words / 200)) : null;
  })();

  const autoSlug = (val: string) =>
    val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (slug === autoSlug(content.title)) {
      setSlug(autoSlug(val));
    }
    markUnsaved();
  };

  const handleBlocksChange = useCallback(
    (newBlocks: ContentBlock[]) => {
      setBlocks(newBlocks);
      markUnsaved();
      autosave({ blocks: newBlocks, title, slug, excerpt, seo });
    },
    [title, slug, excerpt, seo, markUnsaved, autosave]
  );

  const handleSave = () => {
    save({
      title,
      slug,
      excerpt,
      blocks,
      seo,
      categoryIds,
      tagIds,
      customFields,
      ...newsMeta,
    });
  };

  // One-click publish/unpublish from the toolbar — saves current edits first, then runs
  // the workflow transition so what goes live is exactly what's on screen.
  const handlePublish = () => {
    save(
      { title, slug, excerpt, blocks, seo, categoryIds, tagIds, customFields, ...newsMeta },
      {
        onSuccess: () =>
          runTransition({ contentId: content.id, action: isPublished ? 'unpublish' : 'publish' }),
      },
    );
  };

  const handleSubmitForReview = () => {
    save(
      { title, slug, excerpt, blocks, seo, categoryIds, tagIds, customFields, ...newsMeta },
      {
        onSuccess: () => runTransition({ contentId: content.id, action: 'submit_for_review' }),
      },
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
          <div className="flex items-center gap-3">
            <ContentWorkflowBadge status={content.status} />
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
            {!hasUnsavedChanges && lastAutosaveAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Autosaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode !== 'edit' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setMode('edit')}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <Button
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode((m) => (m === 'preview' ? 'edit' : 'preview'))}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              variant={mode === 'live' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              disabled={!websiteDomain}
              title={websiteDomain ? 'See the real site render this item, including unpublished edits' : 'This website has no live domain configured'}
              onClick={() => setMode((m) => (m === 'live' ? 'edit' : 'live'))}
            >
              <Radio className="h-3.5 w-3.5" />
              Live
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => toggleSidePanel('versions')}
            >
              <History className="h-3.5 w-3.5" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => toggleSidePanel('seo')}
            >
              <Search className="h-3.5 w-3.5" />
              SEO
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => toggleSidePanel('settings')}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleSave} disabled={isSaving}>
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {canPublish ? (
              isPublished ? (
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePublish} disabled={isSaving || isTransitioning} title="Take this off the public site">
                  <Globe className="h-3.5 w-3.5" />
                  {isTransitioning ? 'Working…' : 'Unpublish'}
                </Button>
              ) : (
                <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePublish} disabled={isSaving || isTransitioning} title="Save and publish — goes live on the site">
                  <Send className="h-3.5 w-3.5" />
                  {isSaving || isTransitioning ? 'Publishing…' : 'Save & Publish'}
                </Button>
              )
            ) : canSubmitForReview ? (
              // Contributor/author: can't publish, so the primary action moves them
              // into the approval queue instead of dead-ending on a 403.
              <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSubmitForReview} disabled={isSaving || isTransitioning} title="Save and send to a publisher for review — you can't publish directly">
                <Send className="h-3.5 w-3.5" />
                {isSaving || isTransitioning ? 'Submitting…' : 'Save & Submit for Review'}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground px-1" title="A publisher or admin needs to act on this next">
                Awaiting {content.status === 'pending_review' ? 'review' : content.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Content area */}
        {mode === 'live' ? (
          <div className="flex-1 overflow-hidden">
            <LivePreviewFrame contentId={content.id} websiteDomain={websiteDomain} />
          </div>
        ) : (
        <ScrollArea className="flex-1">
          {mode === 'preview' ? (
            <div className="bg-white">
              <ContentPreview title={title} blocks={blocks} />
            </div>
          ) : (
          <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
            {/* Title */}
            <div>
              <input
                className="w-full border-0 bg-transparent text-3xl font-bold focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="Untitled"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">/</span>
                <input
                  className="border-0 bg-transparent text-xs text-muted-foreground focus:outline-none focus:text-foreground"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>

            {/* Excerpt */}
            {content.type === 'post' || content.type === 'article' || content.type === 'news' ? (
              <textarea
                className="w-full resize-none border-0 bg-transparent text-sm text-muted-foreground focus:outline-none focus:text-foreground min-h-[60px] italic"
                placeholder="Short excerpt (optional)..."
                value={excerpt}
                onChange={(e) => { setExcerpt(e.target.value); markUnsaved(); }}
              />
            ) : null}

            <Separator />

            {/* Document editor */}
            <DocumentEditor blocks={blocks} onChange={handleBlocksChange} />
          </div>
          )}
        </ScrollArea>
        )}
      </div>

      {/* Side panel */}
      {activeSidePanel && (
        <div className="w-72 shrink-0 border-l flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-medium capitalize">{activeSidePanel}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSidePanel(activeSidePanel)}>
              ×
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {activeSidePanel === 'seo' && (
              <SeoPanel
                value={seo}
                onChange={(s) => { setSeo(s); markUnsaved(); }}
                titleSuffix={websiteTitleSuffix}
              />
            )}
            {activeSidePanel === 'versions' && (
              <RevisionHistory
                contentId={content.id}
                currentVersion={content.revisionCount}
              />
            )}
            {activeSidePanel === 'settings' && (
              <div className="divide-y">
                <ContentClassificationPanel
                  websiteId={content.websiteId}
                  categoryIds={categoryIds}
                  tagIds={tagIds}
                  onCategoriesChange={(ids) => { setCategoryIds(ids); markUnsaved(); }}
                  onTagsChange={(ids) => { setTagIds(ids); markUnsaved(); }}
                />
                <div className="space-y-1.5 p-4">
                  <Label className="text-xs">Related Content</Label>
                  <p className="text-[11px] text-muted-foreground">Other published content sharing this item&apos;s primary category — link to it from the body.</p>
                  <RelatedContentSuggestions
                    websiteId={content.websiteId}
                    websiteSlug={websiteSlug}
                    websiteDomain={websiteDomain}
                    categoryId={categoryIds[0]}
                    excludeContentId={content.id}
                    categories={flatCategories}
                  />
                </div>
                <NewsMetaPanel
                  value={newsMeta}
                  onChange={(v) => { setNewsMeta(v); markUnsaved(); }}
                  autoReadingTime={autoReadingTime}
                />
                <CustomFieldsPanel
                  value={customFields}
                  onChange={(v) => { setCustomFields(v); markUnsaved(); }}
                />
                <ReviewerPanel
                  websiteId={content.websiteId}
                  value={customFields}
                  onChange={(v) => { setCustomFields(v); markUnsaved(); }}
                />
                <CitationsPanel
                  value={customFields}
                  onChange={(v) => { setCustomFields(v); markUnsaved(); }}
                />
                <div className="p-4 space-y-4">
                  <WorkflowPanel
                    contentId={content.id}
                    currentStatus={content.status}
                    userRole={userRole}
                    scheduledAt={content.scheduledAt}
                  />
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
