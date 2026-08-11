'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShortcutHint, shortcutLabel } from '@/hooks/use-shortcut-hint';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onFocus?: () => void;
  /** Called on Enter / form submit — lets standalone pages (e.g. /search, 404)
   * navigate on submit instead of only reacting to live `onChange` like the
   * command-palette modal does. Omit to keep the modal's live-search behavior. */
  onSubmit?: (val: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Standardized Search Input node — the one search bar style used everywhere
 * on the site (command palette, /search page, 404 page) so search never
 * looks or behaves differently depending on where a visitor opens it.
 */
export const SearchBar = ({
  value,
  onChange,
  onFocus,
  onSubmit,
  className,
  placeholder = "Search countries, companies, industries, technologies...",
  autoFocus
}: SearchBarProps) => {
  // Mac shows ⌘K, Windows/Linux shows Ctrl+K, touch devices show no shortcut
  // hint at all — there's no key combo to press, just the icon/input itself.
  const hint = shortcutLabel(useShortcutHint());

  const input = (
    <div className={cn("relative w-full group", className)}>
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="pl-12 h-12 rounded-2xl bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-base"
      />
      {hint && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center px-2 py-1 rounded-lg bg-background border border-white/10 text-[9px] font-bold text-muted-foreground pointer-events-none group-focus-within:hidden">
          {hint}
        </div>
      )}
    </div>
  );

  if (!onSubmit) return input;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      {input}
    </form>
  );
};
