'use client';

import { Building2, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/authStore';
import { initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export default function OrganizationSwitcher() {
  const { currentOrg, orgs, setCurrentOrg } = useAuthStore();

  if (!currentOrg) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-2 max-w-[180px]"
        >
          <Avatar className="h-5 w-5">
            <AvatarImage src={currentOrg.logoUrl ?? undefined} alt={currentOrg.name} />
            <AvatarFallback className="text-[10px]">{initials(currentOrg.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{currentOrg.name}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className={cn('flex items-center gap-2', org.id === currentOrg.id && 'bg-accent')}
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
              <AvatarFallback className="text-[10px]">{initials(org.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
