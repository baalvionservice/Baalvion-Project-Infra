'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slugify } from '@/lib/utils/format';

interface Props {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asNumberString = (v: unknown): string => (typeof v === 'number' ? String(v) : typeof v === 'string' ? v : '');

/**
 * Names this content as part of a multi-article series (e.g. "Startup Legal
 * Checklist") and its position in it -- powers the "Part of the Series" panel
 * on the public article, matching the reference this was modeled on. Stored
 * in `customFields.seriesTitle` / `seriesSlug` / `seriesOrder`, same extension
 * point as reviewerSlug/factCheckerSlug.
 *
 * `seriesSlug` is auto-derived from the title (not hand-typed) so every
 * article meant to share a series actually groups together -- a hand-typed
 * slug invites drift ("startup-guide" vs "startup-legal-checklist") that
 * would silently split one series into two on the public site. Two articles
 * belong to the same series exactly when their title slugifies the same way;
 * retype the same title on each sibling article to link them.
 */
export default function SeriesPanel({ value, onChange }: Props) {
  const seriesTitle = asString(value.seriesTitle);
  const seriesOrder = asNumberString(value.seriesOrder);
  const seriesSectionTitle = asString(value.seriesSectionTitle);

  const setTitle = (title: string) => {
    if (!title.trim()) {
      const { seriesTitle: _t, seriesSlug: _s, seriesOrder: _o, seriesSectionTitle: _st, ...rest } = value;
      onChange(rest);
      return;
    }
    onChange({ ...value, seriesTitle: title, seriesSlug: slugify(title) });
  };

  const setOrder = (order: string) => {
    const n = order === '' ? undefined : Number(order);
    onChange({ ...value, seriesOrder: Number.isFinite(n) ? n : undefined });
  };

  const setSectionTitle = (title: string) => {
    onChange({ ...value, seriesSectionTitle: title || undefined });
  };

  return (
    <div className="space-y-3 p-4 border-t">
      <div>
        <Label className="text-sm font-medium">Series</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Groups this guide with others into a "Part of the Series" panel on the article. Leave blank for a standalone guide.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Series title</Label>
        <Input
          className="h-8 text-xs"
          placeholder='e.g. "Startup Legal Checklist"'
          value={seriesTitle}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">
          Type the exact same title on every article in this series to link them together.
        </p>
      </div>

      {seriesTitle && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Position in series</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs w-24"
              placeholder="1"
              value={seriesOrder}
              onChange={(e) => setOrder(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Global position across the whole series (used to sort chapters and pick "Next up").
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Chapter (optional)</Label>
            <Input
              className="h-8 text-xs"
              placeholder='e.g. "Saving for College" -- leave blank for a top-level entry'
              value={seriesSectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Groups this article under a collapsible chapter heading in the series panel. Type the same chapter name on its sibling articles.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
