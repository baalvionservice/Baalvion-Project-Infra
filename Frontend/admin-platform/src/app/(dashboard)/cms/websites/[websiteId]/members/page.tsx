'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWebsite, useWebsiteMembers, useAddWebsiteMember, useRemoveWebsiteMember } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { CMS_ROLE_LABELS } from '@/lib/types/cms-website.types';
import type { CmsRole } from '@/lib/types/cms-website.types';

export default function WebsiteMembersPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<CmsRole>('cms_author');

  const { data: website } = useWebsite(websiteId);
  const { data: members, isLoading } = useWebsiteMembers(websiteId);
  const { mutate: addMember, isPending: adding } = useAddWebsiteMember(websiteId);
  const { mutate: removeMember } = useRemoveWebsiteMember(websiteId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Members' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const handleAdd = () => {
    if (!inviteUserId) return;
    addMember(
      { userId: Number(inviteUserId), cmsRole: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteUserId('');
        },
      }
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
          title="CMS Members"
          description="Manage who can edit content for this website"
          actions={
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          }
        />
      </div>

      {/* Role reference */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          CMS Role Reference
        </p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {(Object.entries(CMS_ROLE_LABELS) as [CmsRole, string][]).map(([role, label]) => (
            <span key={role} className="text-xs text-muted-foreground">
              <strong className="text-foreground">{label}</strong>
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {m.user.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">
                  {CMS_ROLE_LABELS[m.cmsRole]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeMember(m.userId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!members?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No members yet. Add team members to allow content editing.
            </p>
          )}
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={(o) => !o && setInviteOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add CMS Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">User ID</Label>
              <Input
                className="h-8 text-xs"
                placeholder="Enter user ID"
                type="number"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CMS Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as CmsRole)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CMS_ROLE_LABELS) as [CmsRole, string][]).map(([role, label]) => (
                    <SelectItem key={role} value={role} className="text-xs">
                      {label}
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
            <Button size="sm" onClick={handleAdd} disabled={adding || !inviteUserId}>
              {adding ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
