'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
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
} from '@/components/ui/command';
import { cn } from '@/lib/utils/cn';
import { useWebsiteAuthors } from '@/lib/queries/cms-authors.queries';

interface Props {
  websiteId: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Editorial-review picker — names a `cms_authors` contributor as the reviewer of this
 * piece and when they reviewed it. Stored in `customFields.reviewerSlug` /
 * `customFields.reviewedAt`, the same extension point the primary byline (`authorSlug`)
 * already uses, so it needs no new backend field or migration. Powers the "Reviewed by"
 * E-E-A-T trust strip on the public article.
 *
 * Jurisdiction and bar/license are stored per-article (`customFields.reviewerJurisdiction`
 * / `reviewerBarLicense`), not on the contributor's general profile — the same reviewer
 * can be relevantly barred differently depending on which article they reviewed, and
 * cms_authors deliberately excludes bar/credential claims from the shared profile (see
 * the public site's authors data file). Leave both blank unless publicly verifiable —
 * they render on the live article, so an unverifiable value should stay empty.
 */
export default function ReviewerPanel({ websiteId, value, onChange }: Props) {
  const { data: authors } = useWebsiteAuthors(websiteId);
  const [open, setOpen] = useState(false);

  const reviewerSlug = asString(value.reviewerSlug);
  const reviewedAt = asString(value.reviewedAt);
  const reviewerJurisdiction = asString(value.reviewerJurisdiction);
  const reviewerBarLicense = asString(value.reviewerBarLicense);
  const selected = (authors ?? []).find((a) => a.slug === reviewerSlug);

  const setReviewer = (slug: string) => {
    const existingReviewedAt = typeof value.reviewedAt === 'string' && value.reviewedAt ? value.reviewedAt : todayIso();
    onChange({ ...value, reviewerSlug: slug, reviewedAt: existingReviewedAt });
  };

  const clearReviewer = () => {
    const { reviewerSlug: _s, reviewedAt: _d, reviewerJurisdiction: _j, reviewerBarLicense: _b, ...rest } = value;
    onChange(rest);
  };

  return (
    <div className="space-y-3 p-4 border-t">
      <div>
        <Label className="text-sm font-medium">Editorial review</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          For finance/legal/health content, name a qualified reviewer (E-E-A-T).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Reviewed by</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between font-normal text-xs">
              <span className="truncate">{selected ? selected.name : 'No reviewer set'}</span>
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
                        setReviewer(a.slug);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-3.5 w-3.5', reviewerSlug === a.slug ? 'opacity-100' : 'opacity-0')} />
                      <div className="min-w-0">
                        <p className="truncate">{a.name}</p>
                        {a.credentials && <p className="truncate text-[10px] text-muted-foreground">{a.credentials}</p>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {reviewerSlug && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Last reviewed</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={reviewedAt}
              onChange={(e) => onChange({ ...value, reviewedAt: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Jurisdiction</Label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. California, or United States (federal)"
              value={reviewerJurisdiction}
              onChange={(e) => onChange({ ...value, reviewerJurisdiction: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bar / license</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Only if publicly verifiable"
              value={reviewerBarLicense}
              onChange={(e) => onChange({ ...value, reviewerBarLicense: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">Leave blank unless this can be independently verified — it renders on the live article.</p>
          </div>

          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={clearReviewer}>
            <X className="h-3.5 w-3.5" /> Remove reviewer
          </Button>
        </>
      )}
    </div>
  );
}
