'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils/cn';
import { useWebsiteAuthors } from '@/lib/queries/cms-authors.queries';

interface Props {
  websiteId: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  /** ContentEditor stacks this under other settings panels (needs the top border);
   *  standalone Card usage (Add News) supplies its own border via CardHeader. */
  bordered?: boolean;
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Byline picker — names a real `cms_authors` staff record as the article's
 * author instead of whatever account happens to be logged in when it's
 * created. Stored the same way the content-engine guide pathway already
 * does (`customFields.authorSlug`), plus `customFields.author.name` since
 * that's the flat shape imperialpedia-main's `cmsContentToNews` reads for
 * the News byline today — so this fixes the byline with no site-side change.
 */
export default function AuthorPanel({ websiteId, value, onChange, bordered = true }: Props) {
  const { data: authors } = useWebsiteAuthors(websiteId);
  const [open, setOpen] = useState(false);

  const authorSlug = asString(value.authorSlug);
  const selected = (authors ?? []).find((a) => a.slug === authorSlug);

  const setAuthor = (slug: string, name: string) => {
    onChange({ ...value, authorSlug: slug, author: { name } });
  };

  const clearAuthor = () => {
    const { authorSlug: _s, author: _a, ...rest } = value;
    onChange(rest);
  };

  return (
    <div className={cn('space-y-3 p-4', bordered && 'border-t')}>
      <div>
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <UserCircle2 className="h-3.5 w-3.5 text-primary" />
          Author
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Who this article is credited to on the public byline (&quot;By …&quot;). Defaults to
          &quot;Imperialpedia Newsroom&quot; when nobody is picked.
        </p>
      </div>

      <div className="space-y-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between font-normal text-xs">
              <span className="truncate">{selected ? selected.name : 'Imperialpedia Newsroom (default)'}</span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search authors..." />
              <CommandList>
                <CommandEmpty>No authors match. Add one from the Authors screen first.</CommandEmpty>
                <CommandGroup>
                  {(authors ?? []).map((a) => (
                    <CommandItem
                      key={a.id}
                      value={`${a.name} ${a.slug}`}
                      onSelect={() => {
                        setAuthor(a.slug, a.name);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-3.5 w-3.5', authorSlug === a.slug ? 'opacity-100' : 'opacity-0')} />
                      <div className="min-w-0">
                        <p className="truncate">{a.name}</p>
                        {a.title && <p className="truncate text-[10px] text-muted-foreground">{a.title}</p>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {authorSlug && (
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={clearAuthor}>
          Reset to default byline
        </Button>
      )}
    </div>
  );
}
