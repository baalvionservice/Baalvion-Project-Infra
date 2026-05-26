
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { navItems } from '@/lib/nav-config';

interface QuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const router = useRouter();

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a page name to navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {navItems.map(page => (
            <CommandItem key={page.href} onSelect={() => handleSelect(page.href)}>
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
