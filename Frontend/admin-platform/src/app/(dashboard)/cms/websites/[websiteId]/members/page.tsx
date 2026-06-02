'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Trash2, Shield, Search, Check } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useWebsite,
  useWebsiteMembers,
  useAddWebsiteMember,
  useUpdateWebsiteMemberRole,
  useRemoveWebsiteMember,
} from '@/lib/queries/cms-websites.queries';
import { websitesApi } from '@/lib/api/cms-websites';
import { useUIStore } from '@/lib/store/uiStore';
import { CMS_ROLE_LABELS, CMS_ROLE_LEVEL } from '@/lib/types/cms-website.types';
import type { CmsRole, UserSearchResult } from '@/lib/types/cms-website.types';

// What each CMS role can do on this website (highest authority first).
const CMS_ROLE_DESCRIPTIONS: Record<CmsRole, string> = {
  cms_admin: 'Full control — invite members, edit settings, publish & delete',
  cms_editor: 'Create, edit & publish all content',
  cms_publisher: 'Publish and unpublish content',
  cms_reviewer: 'Review & approve submitted content (moderator)',
  cms_seo_manager: 'Manage SEO metadata & redirects',
  cms_author: 'Create & edit their own content',
  cms_contributor: 'Draft content for review (cannot publish)',
  cms_viewer: 'Read-only access',
};

const ROLES_BY_AUTHORITY = (Object.keys(CMS_ROLE_LABELS) as CmsRole[]).sort(
  (a, b) => CMS_ROLE_LEVEL[b] - CMS_ROLE_LEVEL[a],
);

export default function WebsiteMembersPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CmsRole>('cms_editor');
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const { data: website } = useWebsite(websiteId);
  const { data: members, isLoading } = useWebsiteMembers(websiteId);
  const { mutate: addMember, isPending: adding } = useAddWebsiteMember(websiteId);
  const { mutate: updateRole } = useUpdateWebsiteMemberRole(websiteId);
  const { mutate: removeMember } = useRemoveWebsiteMember(websiteId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Members' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  // Live user suggestions while typing the invite email.
  useEffect(() => {
    const q = inviteEmail.trim();
    if (!inviteOpen || q.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await websitesApi.members.searchUsers(websiteId, q);
        if (active) setSuggestions(res.data.data ?? []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [inviteEmail, inviteOpen, websiteId]);

  const openInvite = () => {
    setInviteEmail('');
    setInviteRole('cms_editor');
    setSuggestions([]);
    setInviteOpen(true);
  };

  const handleInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    addMember(
      { email, role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail('');
          setSuggestions([]);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Team & Roles"
          description={`Invite people to ${website?.name ?? 'this website'} and choose what they can do`}
          actions={
            <Button size="sm" onClick={openInvite}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite member
            </Button>
          }
        />
      </div>

      {/* Role reference */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Roles on this website
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES_BY_AUTHORITY.map((role) => (
            <div key={role} className="flex items-start gap-2 text-xs">
              <Badge variant="secondary" className="shrink-0">{CMS_ROLE_LABELS[role]}</Badge>
              <span className="text-muted-foreground leading-relaxed">{CMS_ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {(m.user.fullName || m.user.email || '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.user.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={m.cmsRole}
                  onValueChange={(v) => updateRole({ userId: m.userId, role: v as CmsRole })}
                >
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_BY_AUTHORITY.map((role) => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {CMS_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeMember(m.userId)}
                  title="Remove from website"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!members?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members yet. Invite teammates to let them manage this website&apos;s content.
            </p>
          )}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              Invite an existing platform user by email and choose their role on{' '}
              <strong>{website?.name ?? 'this website'}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-sm"
                  placeholder="name@company.com"
                  type="email"
                  value={inviteEmail}
                  autoFocus
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite();
                  }}
                />
              </div>
              {/* Live suggestions */}
              {inviteEmail.trim().length >= 2 && (
                <div className="max-h-44 overflow-y-auto rounded-md border">
                  {searching && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
                  )}
                  {!searching && suggestions.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No matching user. They must have a platform account first
                      (create one under Identity → Users).
                    </p>
                  )}
                  {suggestions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={u.isMember}
                      onClick={() => {
                        setInviteEmail(u.email);
                        setSuggestions([]);
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{u.fullName}</span>
                        <span className="block truncate text-muted-foreground">{u.email}</span>
                      </span>
                      {u.isMember ? (
                        <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
                          <Check className="h-3 w-3" /> Member
                        </Badge>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CmsRole)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_BY_AUTHORITY.map((role) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      <span className="font-medium">{CMS_ROLE_LABELS[role]}</span>
                      <span className="ml-1.5 text-muted-foreground">— {CMS_ROLE_DESCRIPTIONS[role]}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInvite} disabled={adding || !inviteEmail.trim()}>
              {adding ? 'Inviting…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
