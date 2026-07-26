'use client';

import { useMemo, useState } from 'react';
import { FolderTree, Tag as TagIcon, Plus, Check, Star, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';
import {
  useWebsiteCategoryTree,
  useWebsiteTags,
  useCreateTag,
  useCreateCategory,
} from '@/lib/queries/cms-taxonomy.queries';
import { slugify } from '@/lib/utils/format';
import type { CategoryTree } from '@/lib/types/cms-taxonomy.types';

interface Props {
  websiteId: string;
  categoryIds: string[];
  tagIds: string[];
  onCategoriesChange: (ids: string[]) => void;
  onTagsChange: (ids: string[]) => void;
}

export default function ContentClassificationPanel({
  websiteId,
  categoryIds,
  tagIds,
  onCategoriesChange,
  onTagsChange,
}: Props) {
  const { data: tree } = useWebsiteCategoryTree(websiteId);
  const { data: tags } = useWebsiteTags(websiteId);
  const createTag = useCreateTag(websiteId);
  const createCategory = useCreateCategory(websiteId);
  const [newTag, setNewTag] = useState('');
  const [addingChildUnder, setAddingChildUnder] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState('');

  const groups = useMemo(() => (tree ?? []) as CategoryTree[], [tree]);
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    const walk = (nodes: CategoryTree[]) =>
      nodes.forEach((n) => {
        m.set(n.id, n.name);
        if (n.children?.length) walk(n.children);
      });
    walk(groups);
    return m;
  }, [groups]);

  const toggleCategory = (id: string) => {
    onCategoriesChange(
      categoryIds.includes(id) ? categoryIds.filter((c) => c !== id) : [...categoryIds, id],
    );
  };

  const makePrimary = (id: string) => {
    onCategoriesChange([id, ...categoryIds.filter((c) => c !== id)]);
  };

  const toggleTag = (id: string) => {
    onTagsChange(tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id]);
  };

  const addTag = () => {
    const name = newTag.trim();
    if (!name) return;
    createTag.mutate(
      { websiteId, name, slug: slugify(name) },
      {
        onSuccess: (res) => {
          onTagsChange([...tagIds, res.data.data.id]);
          setNewTag('');
        },
      },
    );
  };

  // Lets editors add a country (or any sub-category) under a region without
  // leaving the article — e.g. "India" under "Asia-Pacific" — and checks it
  // immediately so the geo-tagging combination is complete in one step.
  const addChildCategory = async (parentId: string) => {
    const name = newChildName.trim();
    if (!name) return;
    const res = await createCategory.mutateAsync({ websiteId, name, slug: slugify(name), parentId });
    onCategoriesChange([...categoryIds, res.data.data.id]);
    setAddingChildUnder(null);
    setNewChildName('');
  };

  const CategoryRow = ({ id, name, indent, onAddChild }: { id: string; name: string; indent?: boolean; onAddChild?: () => void }) => {
    const checked = categoryIds.includes(id);
    const isPrimary = categoryIds[0] === id;
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded px-1.5 py-1 hover:bg-muted/50',
          indent && 'pl-6',
        )}
      >
        <Checkbox checked={checked} onCheckedChange={() => toggleCategory(id)} className="h-3.5 w-3.5" />
        <button
          type="button"
          onClick={() => toggleCategory(id)}
          className={cn('flex-1 text-left text-xs', checked && 'font-medium')}
        >
          {name}
        </button>
        {onAddChild && (
          <button
            type="button"
            onClick={onAddChild}
            className="text-muted-foreground hover:text-foreground"
            title={`Add a sub-category under ${name} (e.g. a country under a region)`}
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
        {checked &&
          (isPrimary ? (
            <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase text-amber-500">
              <Star className="h-3 w-3 fill-amber-500" />
              Primary
            </span>
          ) : (
            <button
              type="button"
              onClick={() => makePrimary(id)}
              className="text-[9px] uppercase text-muted-foreground hover:text-amber-500"
              title="Make primary category"
            >
              <Star className="h-3 w-3" />
            </button>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4">
      {/* Categories — multi-select with a primary */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs">
          <FolderTree className="h-3.5 w-3.5 text-amber-500" />
          Categories
        </Label>
        <p className="text-[11px] text-muted-foreground">
          Pick one or more. The <span className="font-medium">primary</span> drives the article&apos;s
          URL section; it also appears on every chosen topic page.
        </p>
        <p className="text-[11px] text-muted-foreground">
          For World News tied to a specific country, also check{' '}
          <span className="font-medium">World</span>, the region (e.g. Asia-Pacific), and the
          country (e.g. India) — that combination gives the article its own
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[10px]">/world/&lt;region&gt;/&lt;country&gt;/...</code>
          page automatically.
        </p>
        <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md border p-1">
          {groups.length === 0 && (
            <p className="px-2 py-3 text-[11px] text-muted-foreground">No categories yet.</p>
          )}
          {groups.map((root) => (
            <div key={root.id}>
              <CategoryRow id={root.id} name={root.name} onAddChild={() => { setAddingChildUnder(root.id); setNewChildName(''); }} />
              {root.children.map((child) => (
                <CategoryRow key={child.id} id={child.id} name={child.name} indent />
              ))}
              {addingChildUnder === root.id && (
                <div className="flex gap-1.5 py-1 pl-6">
                  <Input
                    className="h-7 text-xs"
                    placeholder={`New sub-category under ${root.name}…`}
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addChildCategory(root.id); } }}
                    autoFocus
                  />
                  <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" disabled={!newChildName.trim() || createCategory.isPending} onClick={() => void addChildCategory(root.id)}>
                    {createCategory.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setAddingChildUnder(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        {categoryIds.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {categoryIds.map((id, i) => (
              <span
                key={id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]',
                  i === 0
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-500'
                    : 'border-border text-muted-foreground',
                )}
              >
                {i === 0 && <Star className="h-2.5 w-2.5 fill-amber-500" />}
                {nameById.get(id) ?? 'Category'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs">
          <TagIcon className="h-3.5 w-3.5 text-cyan-500" />
          Tags
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {(tags ?? []).length === 0 && (
            <span className="text-[11px] text-muted-foreground">No tags yet — add one below.</span>
          )}
          {(tags ?? []).map((t) => {
            const active = tagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/60',
                )}
              >
                {active && <Check className="h-3 w-3" />}
                {t.name}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <Input
            className="h-8 text-xs"
            placeholder="Add a tag…"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={addTag}
            disabled={!newTag.trim() || createTag.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
