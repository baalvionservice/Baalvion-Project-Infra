'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, CardTitle, ConfirmDialog, EmptyState,
  Field, RelativeTime, Textarea, Input, useToast,
} from '@/components/ui';
import { communities } from '@/lib/api';
import type { Community, CommunityMember } from '@/lib/api/types';

/**
 * Running a community, for the people responsible for one.
 *
 * The hard part of this screen is not what it does but what it must NOT do. A community
 * administrator looks, from inside the product, a lot like a moderator: both remove things,
 * both work through a queue. They are different jobs. This panel therefore offers exactly
 * three powers — describe the room, admit people, remove people — and the copy says out loud
 * where they stop, because a role whose limits are invisible is a role people overestimate.
 *
 * Everything here is re-checked on the server. Rendering a button is a statement about what
 * we believe the viewer may do, not a grant of permission.
 */
export function ManagePanel({
  community, pending,
}: {
  community: Community;
  pending: CommunityMember[];
}) {
  const router = useRouter();
  const toast = useToast();

  const isAdmin = community.myRole === 'ADMIN';
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);

  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [purpose, setPurpose] = useState(community.purpose ?? '');
  const [rules, setRules] = useState(community.rules ?? '');
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = await communities.update(community.id, { name, description, purpose, rules });
    setSaving(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Saved.');
    router.refresh();
  }

  async function act(userId: string, action: 'approve' | 'decline') {
    setBusy(userId);
    const result = action === 'approve'
      ? await communities.approveMember(community.id, userId)
      : await communities.declineMember(community.id, userId);
    setBusy(null);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success(action === 'approve' ? 'They have been admitted.' : 'Request declined.');
    router.refresh();
  }

  async function remove(member: CommunityMember) {
    setBusy(member.userId);
    const result = await communities.removeMember(community.id, member.userId);
    setBusy(null);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('They are no longer a member.');
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* ── Requests to join ──────────────────────────────────────────── */}
        <Card>
          <CardBody>
            <CardTitle className="text-base">Requests to join</CardTitle>
            <p className="mt-1 text-sm text-muted">
              People are listed by when they asked, not by name — who applies to a community
              like this one is as sensitive as who is in it.
            </p>

            {pending.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="Nothing waiting" description="New requests will appear here." />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {pending.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="text-sm">
                      Asked <RelativeTime value={m.joinedAt ?? community.createdAt} />
                    </span>
                    <span className="ml-auto flex gap-2">
                      <Button size="sm" loading={busy === m.userId} disabled={Boolean(busy)}
                        onClick={() => void act(m.userId, 'approve')}>
                        Admit
                      </Button>
                      <Button size="sm" variant="secondary" disabled={Boolean(busy)}
                        onClick={() => void act(m.userId, 'decline')}>
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-2">
              Declining removes the request. They are free to ask again another time — it is
              not a ban, and nothing is recorded against them.
            </p>
          </CardBody>
        </Card>

        {/* ── Description, purpose, rules ───────────────────────────────── */}
        {isAdmin && (
          <Card>
            <CardBody>
              <CardTitle className="text-base">How this community describes itself</CardTitle>
              <form onSubmit={save} className="mt-4 space-y-5">
                <Field label="Name" required>
                  {({ id, describedBy }) => (
                    <Input id={id} value={name} maxLength={120} aria-describedby={describedBy}
                      onChange={(e) => setName(e.target.value)} />
                  )}
                </Field>
                <Field label="Short description" hint="One or two lines, shown wherever this community is listed.">
                  {({ id, describedBy }) => (
                    <Textarea id={id} rows={2} maxLength={2000} value={description}
                      aria-describedby={describedBy} onChange={(e) => setDescription(e.target.value)} />
                  )}
                </Field>
                <Field label="What it is for" hint="Who this community is meant to help, and how.">
                  {({ id, describedBy }) => (
                    <Textarea id={id} rows={4} maxLength={2000} value={purpose}
                      aria-describedby={describedBy} onChange={(e) => setPurpose(e.target.value)} />
                  )}
                </Field>
                <Field label="Rules" hint="What is expected here. Platform rules apply whatever you write; yours can add to them, not relax them.">
                  {({ id, describedBy }) => (
                    <Textarea id={id} rows={6} maxLength={4000} value={rules}
                      aria-describedby={describedBy} onChange={(e) => setRules(e.target.value)} />
                  )}
                </Field>
                <Button type="submit" loading={saving} disabled={saving}>Save changes</Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <Card>
          <CardBody>
            <CardTitle className="text-base">What you can do here</CardTitle>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>Admit or decline people who ask to join.</li>
              {isAdmin && <li>Change how this community describes itself and its rules.</li>}
              {isAdmin && <li>Remove someone from this community.</li>}
              <li>Report anything that breaks the platform rules, like anyone else.</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="text-base">What you cannot</CardTitle>
            {/* Said plainly, because a role whose limits are invisible is a role people
                overestimate — and then act on. */}
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>See anyone’s private case, including cases scoped to this community.</li>
              <li>See members’ names, addresses or any personal details.</li>
              <li>Grant anyone a role on the platform.</li>
              <li>Read the platform’s moderation queue or audit log.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Running a community is not the same job as moderating CanWeMarry. Content that
              breaks the platform rules goes to the moderators through a report, where the
              decision is recorded.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="text-base">Changing visibility</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Whether this community is public or private, and how people join, cannot be
              changed here. Making a private community public would expose everyone who joined
              believing it was not.
            </p>
          </CardBody>
        </Card>
      </aside>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this person from the community?"
        description="They lose access to its discussions. It is not a ban — they can ask to join again."
        confirmLabel="Remove"
        destructive
        onCancel={() => setRemoving(null)}
        onConfirm={async () => { const m = removing; setRemoving(null); if (m) await remove(m); }}
      />
    </div>
  );
}
