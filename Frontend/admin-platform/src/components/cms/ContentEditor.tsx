'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Search, Clock, History, Settings2, Tag as TagIcon, Eye, Pencil, Send, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BlockBuilder from './BlockBuilder';
import ContentPreview from './ContentPreview';
import SeoPanel from './SeoPanel';
import RevisionHistory from './RevisionHistory';
import WorkflowPanel from './WorkflowPanel';
import ContentClassificationPanel from './ContentClassificationPanel';
import CustomFieldsPanel from './CustomFieldsPanel';
import ContentWorkflowBadge from './ContentWorkflowBadge';
import { useUpdateContent, useAutosave } from '@/lib/queries/cms-content.queries';
import { useWorkflowTransition } from '@/lib/queries/cms-workflow.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import type { ContentItem, ContentBlock } from '@/lib/types/cms-content.types';
import type { SeoMeta } from '@/lib/types/cms.types';
import type { CmsRole } from '@/lib/types/cms-website.types';

interface Props {
  content: ContentItem;
  userRole?: CmsRole;
  websiteTitleSuffix?: string;
}

export default function ContentEditor({ content, userRole, websiteTitleSuffix }: Props) {
  const { mutate: save, isPending: isSaving } = useUpdateContent(content.id);
  const { mutate: runTransition, isPending: isTransitioning } = useWorkflowTransition();
  const autosave = useAutosave(content.id);
  const isPublished = content.status === 'published';
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
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

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
    });
  };

  // One-click publish/unpublish from the toolbar — saves current edits first, then runs
  // the workflow transition so what goes live is exactly what's on screen.
  const handlePublish = () => {
    save(
      { title, slug, excerpt, blocks, seo, categoryIds, tagIds, customFields },
      {
        onSuccess: () =>
          runTransition({ contentId: content.id, action: isPublished ? 'unpublish' : 'publish' }),
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
            <Button
              variant={mode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
            >
              {mode === 'edit' ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              {mode === 'edit' ? 'Preview' : 'Edit'}
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
            {isPublished ? (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePublish} disabled={isSaving || isTransitioning} title="Take this off the public site">
                <Globe className="h-3.5 w-3.5" />
                {isTransitioning ? 'Working…' : 'Unpublish'}
              </Button>
            ) : (
              <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handlePublish} disabled={isSaving || isTransitioning} title="Save and publish — goes live on the site">
                <Send className="h-3.5 w-3.5" />
                {isSaving || isTransitioning ? 'Publishing…' : 'Save & Publish'}
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
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

            {/* Block builder */}
            <BlockBuilder blocks={blocks} onChange={handleBlocksChange} />
          </div>
          )}
        </ScrollArea>
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
                <CustomFieldsPanel
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
