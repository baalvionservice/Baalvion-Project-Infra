'use client';

import { useMemo, useState } from 'react';
import { KeyRound, Globe, Loader2, Check } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { CMS_ROLE_OPTIONS } from '@/lib/cms/permissions';
import { useGrantSiteAccess } from '@/lib/queries/cms-websites.queries';
import type { CmsRole, Website } from '@/lib/types/cms-website.types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  websites: Website[];
}

/**
 * Grant one person access to several websites in a single step.
 *
 * Access is per-website by design: a writer hired for two publications should reach exactly
 * those two and nothing else. Granting them one at a time meant walking three separate member
 * screens, which is how people end up over-granting to save time.
 */
export default function GrantSiteAccessDialog({ open, onOpenChange, websites }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CmsRole>('cms_author');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('');
  // '' = a standing grant (the default). Anything else time-boxes the access.
  const [expiresInDays, setExpiresInDays] = useState('');

  const { mutate: grant, isPending } = useGrantSiteAccess();

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return websites;
    return websites.filter(
      (w) => w.name.toLowerCase().includes(q) || w.domain.toLowerCase().includes(q),
    );
  }, [websites, filter]);

  const roleOption = CMS_ROLE_OPTIONS.find((o) => o.value === role);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && selectedIds.length > 0 && !isPending;

  const toggle = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const reset = () => {
    setEmail('');
    setRole('cms_author');
    setSelectedIds([]);
    setNote('');
    setFilter('');
    setExpiresInDays('');
  };

  const submit = () => {
    if (!canSubmit) return;
    grant(
      {
        email: email.trim(),
        role,
        websiteIds: selectedIds,
        personalNote: note.trim() || undefined,
        // Sent as an absolute instant, not a duration — the server must not have to guess
        // which clock or timezone "30 days" was measured from.
        expiresAt: expiresInDays
          ? new Date(Date.now() + Number(expiresInDays) * 86_400_000).toISOString()
          : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Grant site access
          </DialogTitle>
          <DialogDescription>
            Give one person the same role across several websites. They&apos;ll reach only the
            sites you pick here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grant-email">Person&apos;s email</Label>
            <Input
              id="grant-email"
              type="email"
              placeholder="writer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Already has an account? Access is granted immediately. Otherwise they&apos;re
              emailed an invitation for each site.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Role on these sites</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CmsRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CMS_ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleOption && (
              <p className="text-xs text-muted-foreground">{roleOption.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label>Websites</Label>
              <span className="text-xs text-muted-foreground">
                {selectedIds.length} selected
              </span>
            </div>
            <Input
              className="h-8 text-sm"
              placeholder="Filter websites…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <ScrollArea className="h-52 rounded-md border">
              <div className="p-1">
                {visible.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No websites match that filter.
                  </p>
                )}
                {visible.map((w) => {
                  const checked = selectedIds.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggle(w.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        checked ? 'bg-accent' : 'hover:bg-accent/50',
                      )}
                    >
                      <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" />
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">
                        <span className="font-medium">{w.name}</span>{' '}
                        <span className="text-muted-foreground">{w.domain}</span>
                      </span>
                      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-1.5">
            <Label>Access expires</Label>
            <Select value={expiresInDays || 'never'} onValueChange={(v) => setExpiresInDays(v === 'never' ? '' : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never — standing access</SelectItem>
                <SelectItem value="7">In 7 days</SelectItem>
                <SelectItem value="30">In 30 days</SelectItem>
                <SelectItem value="90">In 90 days</SelectItem>
                <SelectItem value="180">In 6 months</SelectItem>
                <SelectItem value="365">In 1 year</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {expiresInDays
                ? 'Access stops on its own — nobody has to remember to remove it.'
                : 'Access continues until someone removes it. Set an end date for contractors.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-note">Note for the invitation email (optional)</Label>
            <Textarea
              id="grant-note"
              rows={2}
              maxLength={600}
              placeholder="Welcome aboard — you'll be covering markets and shipping."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Grant access to {selectedIds.length || 0} site{selectedIds.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
