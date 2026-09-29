'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

/**
 * Filters for the marketplace.
 *
 * The options come from live briefs, so every choice here returns something — a
 * dropdown offering "Rust" when no Rust brief exists is a dead end. Selections go into
 * the URL rather than component state, which keeps the server render authoritative and
 * makes a filtered view shareable.
 */
export function MarketplaceFilters({
  categories,
  skills,
  current,
}: {
  categories: string[];
  skills: string[];
  current: { category: string; skill: string; mode: string; q: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'All') params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setSearch = useDebouncedCallback((value: string) => setParam('q', value), 350);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div className="relative md:col-span-4 lg:col-span-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          defaultValue={current.q}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search briefs…"
          className="pl-9"
          aria-label="Search projects"
        />
      </div>

      <Select defaultValue={current.mode} onValueChange={(v) => setParam('mode', v)}>
        <SelectTrigger aria-label="Solo or team"><SelectValue placeholder="Solo or team" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Solo or team</SelectItem>
          <SelectItem value="solo">I&apos;d work alone</SelectItem>
          <SelectItem value="team">I have a team</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={current.category} onValueChange={(v) => setParam('category', v)}>
        <SelectTrigger aria-label="Category"><SelectValue placeholder="Any category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any category</SelectItem>
          {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      {skills.length > 0 && (
        <Select defaultValue={current.skill} onValueChange={(v) => setParam('skill', v)}>
          <SelectTrigger aria-label="Skill"><SelectValue placeholder="Any skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Any skill</SelectItem>
            {skills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
