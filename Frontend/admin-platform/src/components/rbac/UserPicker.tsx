'use client';

import { useEffect, useState } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUsers } from '@/lib/queries/users.queries';
import type { AdminUser } from '@/lib/types/user.types';
import { cn } from '@/lib/utils/cn';

interface UserPickerProps {
  selected: AdminUser | null;
  onSelect: (user: AdminUser | null) => void;
}

/** Debounced user search against the admin directory (read-only metadata). */
export default function UserPicker({ selected, onSelect }: UserPickerProps) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const { data, isFetching } = useUsers({ search: debounced || undefined, limit: 8 });
  const results = data?.data ?? [];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        <Input
          autoFocus
          placeholder="Search a user by email or name…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
        {results.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No users match “{debounced}”.</p>
        ) : (
          results.map((user) => {
            const isActive = selected?.id === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelect(isActive ? null : user)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50',
                  isActive && 'bg-muted/60',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{user.fullName || user.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
