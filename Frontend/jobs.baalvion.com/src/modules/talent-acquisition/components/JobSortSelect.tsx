'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Sort order, in the URL like every other filter — so a sorted, filtered view is a
 * link, and the server render is still the authority on what comes back.
 */
export function JobSortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'date') params.delete('sort');
    else params.set('sort', next);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sort</span>
      <Select value={value} onValueChange={change}>
        <SelectTrigger className="h-9 w-[170px]" aria-label="Sort results"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Most recent</SelectItem>
          <SelectItem value="title">Job title</SelectItem>
          <SelectItem value="location">Location</SelectItem>
          <SelectItem value="salary">Salary</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
