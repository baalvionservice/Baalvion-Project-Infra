'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, FolderPlus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { useCreateCategory, useWebsiteCategories, useWebsiteCategoryTree } from '@/lib/queries/cms-taxonomy.queries';
import type { CategoryTree } from '@/lib/types/cms-taxonomy.types';

interface Props {
  websiteId: string;
  value: string; // '' = All Sections
  onChange: (categoryId: string) => void;
}

interface FlatEntry {
  id: string;
  name: string;
  depth: number;
  contentCount: number;
}

// Parents immediately followed by their children (depth-first), so subcategories render
// nested/indented under their parent instead of scattered through an alphabetical list —
// that ordering is what makes a 60+ category site actually scannable.
function flattenForDisplay(tree: CategoryTree[]): FlatEntry[] {
  const out: FlatEntry[] = [];
  const walk = (nodes: CategoryTree[], depth: number) => {
    for (const n of nodes) {
      out.push({ id: n.id, name: n.name, depth, contentCount: n.contentCount });
      if (n.children?.length) walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);
  return out;
}

const autoSlug = (val: string) => val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CategoryFilterCombobox({ websiteId, value, onChange }: Props) {
  const { data: tree } = useWebsiteCategoryTree(websiteId);
  const { data: flatCategories } = useWebsiteCategories(websiteId);
  const { mutate: createCategory, isPending: creating } = useCreateCategory(websiteId);

  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState('');

  const entries = flattenForDisplay(tree ?? []);
  const selected = entries.find((e) => e.id === value);

  const openAddDialog = (parentId?: string) => {
    setNewName('');
    setNewParentId(parentId ?? '');
    setOpen(false);
    setAddOpen(true);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory(
      { websiteId, name: newName.trim(), slug: autoSlug(newName), parentId: newParentId || null },
      {
        onSuccess: (res) => {
          setAddOpen(false);
          if (res.data.data?.id) onChange(res.data.data.id);
        },
      },
    );
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-48 justify-between font-normal"
          >
            <span className="truncate">{selected ? selected.name : 'All Sections'}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search sections..." />
            <CommandList>
              <CommandEmpty>
                No section matches. You can create it below.
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__all__ all sections"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-3.5 w-3.5', value === '' ? 'opacity-100' : 'opacity-0')} />
                  All Sections
                </CommandItem>
                {entries.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={`${e.name} ${e.id}`}
                    onSelect={() => {
                      onChange(e.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === e.id ? 'opacity-100' : 'opacity-0')} />
                    <span style={{ paddingLeft: e.depth * 12 }} className="truncate">
                      {e.depth > 0 && <span className="text-muted-foreground">↳ </span>}
                      {e.name}
                    </span>
                    <span className="ml-auto pl-2 text-xs text-muted-foreground">{e.contentCount}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="__add_category__" onSelect={() => openAddDialog()}>
                  <FolderPlus className="mr-2 h-3.5 w-3.5" />
                  New category or subcategory…
                </CommandItem>
                <CommandItem asChild value="__manage__">
                  <Link
                    href={`/cms/websites/${websiteId}/categories`}
                    className="flex items-center"
                    onClick={() => setOpen(false)}
                  >
                    <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
                    Manage all categories
                  </Link>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Create a top-level section, or pick a parent to add it as a subcategory. For SEO
              fields and reordering, use{' '}
              <Link href={`/cms/websites/${websiteId}/categories`} className="underline">
                Manage all categories
              </Link>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Retirement Planning"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              {newName.trim() && (
                <p className="text-xs text-muted-foreground">/{autoSlug(newName)}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Parent (optional — leave blank for a top-level section)</Label>
              <Select value={newParentId || '__none__'} onValueChange={(v) => setNewParentId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No parent (top-level section)</SelectItem>
                  {(flatCategories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!newName.trim() || creating} onClick={handleCreate}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
