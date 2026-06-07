'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Search, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { initials } from '@/lib/utils/format';
import { CMS_ROLE_OPTIONS } from '@/lib/cms/permissions';
import { websitesApi } from '@/lib/api/cms-websites';
import { useAddWebsiteMember } from '@/lib/queries/cms-websites.queries';
import type { CmsRole, UserSearchResult } from '@/lib/types/cms-website.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  websiteId: string;
  canonicalId: string;
}

export default function InviteUserDialog({ open, onOpenChange, websiteId, canonicalId }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CmsRole>('cms_author');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: addMember, isPending } = useAddWebsiteMember(websiteId);

  // Live user search (debounced) against the platform identity directory.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await websitesApi.members.searchUsers(canonicalId, query.trim());
        setResults(res.data.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, canonicalId]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setEmail('');
    setRole('cms_author');
  };

  const handleInvite = () => {
    const payload = selected ? { userId: selected.id, role } : { email: email.trim(), role };
    if (!payload.userId && !payload.email) return;
    addMember(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  const canSubmit = (!!selected || /\S+@\S+\.\S+/.test(email)) && !isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite a user
          </DialogTitle>
          <DialogDescription className="text-xs">
            Search an existing teammate or invite by email, then choose what they can do.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search existing users */}
          <div className="space-y-1.5">
            <Label className="text-xs">Find a teammate</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8 text-sm"
                placeholder="Search by name or email"
                value={selected ? selected.fullName : query}
                onChange={(e) => {
                  setSelected(null);
                  setQuery(e.target.value);
                }}
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {!selected && results.length > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-md border">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={u.isMember}
                    onClick={() => {
                      setSelected(u);
                      setEmail('');
                      setQuery('');
                      setResults([]);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/60',
                      u.isMember && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">{initials(u.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{u.fullName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                    {u.isMember && <Check className="h-3.5 w-3.5 text-green-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Or invite by email */}
          {!selected && (
            <div className="space-y-1.5">
              <Label className="text-xs">Or invite by email</Label>
              <Input
                type="email"
                className="h-9 text-sm"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CmsRole)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CMS_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm">
                    <span className="font-medium">{o.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{o.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleInvite} disabled={!canSubmit}>
            {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
