'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceClients } from '@/lib/api/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EntityOption {
  slug: string;
  name: string;
  type: string;
}

interface EntityPickerProps {
  /** Restricts the search to one knowledge-graph entity type, e.g. "company" | "country" | "industry" | "technology". */
  entityType: string;
  /** Selected entity slugs. */
  value: string[];
  onChange: (slugs: string[]) => void;
  /** Single-select mode (used for `country`/`industry`, which are 1:1 relationships) closes the popover on pick. */
  multiple?: boolean;
  /** Excludes an entity from its own picker (e.g. a company can't list itself as a competitor). */
  excludeSlug?: string;
  placeholder?: string;
}

/**
 * Searchable entity relationship picker — replaces free-text inputs for entity-to-entity
 * relationships (country, industry, competitors, technologies) with a real autocomplete
 * against the live knowledge graph, so relationships are always valid slugs of entities
 * that actually exist rather than hand-typed strings that can silently drift or typo.
 */
export function EntityPicker({ entityType, value, onChange, multiple = true, excludeSlug, placeholder }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [labelCache, setLabelCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ['imperialpedia', 'entities', 'picker', entityType, debounced],
    queryFn: () =>
      serviceClients.imperialpedia
        .get('/entities', { params: { type: entityType, search: debounced || undefined, limit: 20 } })
        .then((r) => r.data),
    enabled: open,
  });

  const options: EntityOption[] = ((data?.data?.items ?? []) as EntityOption[]).filter((e) => e.slug !== excludeSlug);

  useEffect(() => {
    if (options.length === 0) return;
    setLabelCache((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const o of options) {
        if (next[o.slug] !== o.name) {
          next[o.slug] = o.name;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Resolve labels for pre-selected slugs (e.g. loaded from an existing entity) that
  // haven't appeared in a search result yet, so chips never show a bare slug.
  useEffect(() => {
    const missing = value.filter((slug) => !(slug in labelCache));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((slug) =>
        serviceClients.imperialpedia
          .get(`/entities/${entityType}/${encodeURIComponent(slug)}`)
          .then((r) => [slug, (r.data?.data?.name as string | undefined) ?? slug] as const)
          .catch(() => [slug, slug] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      setLabelCache((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      cancelled = true;
    };
    // Re-run only when the selected slug set changes, not on every labelCache update
    // (which this effect itself causes) — would otherwise loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join(','), entityType]);

  const toggle = (slug: string) => {
    if (multiple) {
      onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
    } else {
      onChange([slug]);
      setOpen(false);
    }
  };

  const remove = (slug: string) => onChange(value.filter((s) => s !== slug));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((slug) => (
            <Badge key={slug} variant="secondary" className="gap-1 pr-1">
              {labelCache[slug] || slug}
              <button
                type="button"
                onClick={() => remove(slug)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
                aria-label={`Remove ${labelCache[slug] || slug}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal text-muted-foreground"
          >
            {placeholder || `Search ${entityType}…`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={`Search ${entityType}…`} value={search} onValueChange={setSearch} />
            <CommandList>
              {isFetching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isFetching && options.length === 0 && <CommandEmpty>No {entityType} entities found.</CommandEmpty>}
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.slug} value={o.slug} onSelect={() => toggle(o.slug)}>
                    <span className={cn(value.includes(o.slug) && 'font-semibold text-primary')}>{o.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">/{o.slug}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default EntityPicker;
