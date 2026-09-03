'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Two fields and a button: what you do, and where.
 *
 * A single combined box forces the visitor to guess our query syntax. Splitting them
 * is how every job board a candidate has used already works, and it lets the backend
 * treat the location as a filter rather than as another word to match in a title.
 */
export function JobSearchBar({
  defaultKeyword = '',
  defaultLocation = '',
  destination,
}: {
  defaultKeyword?: string;
  defaultLocation?: string;
  /**
   * Where the search should land. Defaults to the current page, which is right on the
   * results page — it keeps the filters already applied. Anywhere without a results
   * list has to say where to go, or the search silently reloads the same page: that is
   * exactly what the box on the homepage was doing.
   */
  destination?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(defaultKeyword);
  const [location, setLocation] = useState(defaultLocation);

  const target = destination ?? pathname;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Existing filters are only worth carrying when we are staying on the same page.
    // Dragging them onto a different route would apply filters the visitor cannot see.
    const params = new URLSearchParams(target === pathname ? searchParams.toString() : '');
    keyword.trim() ? params.set('q', keyword.trim()) : params.delete('q');
    location.trim() ? params.set('where', location.trim()) : params.delete('where');
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${target}?${query}` : target, { scroll: target === pathname });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <Label htmlFor="q" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Keyword
        </Label>
        <Input
          id="q"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Job title, skill or team"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="where" className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Location
        </Label>
        <Input
          id="where"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, town or state"
          className="mt-1.5"
        />
      </div>
      <Button type="submit" className="sm:w-32">Search</Button>
    </form>
  );
}
