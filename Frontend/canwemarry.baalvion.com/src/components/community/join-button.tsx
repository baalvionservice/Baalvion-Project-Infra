'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog, useToast } from '@/components/ui';
import { communities } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { Community } from '@/lib/api/types';

const POLICY_COPY: Record<Community['joinPolicy'], string> = {
  OPEN: 'You will be admitted straight away.',
  REQUEST: 'A moderator reviews joining requests.',
  INVITE: 'This community is invitation-only.',
};

export function JoinButton({ community }: { community: Community }) {
  const router = useRouter();
  const toast = useToast();
  const { identity } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!identity) {
    return <p className="text-sm text-muted">Sign in to join this community.</p>;
  }

  // A request already sent. Without this the button would read "Request to join" again, and
  // somebody who had asked days ago would reasonably conclude it had never worked.
  if (community.membershipStatus === 'PENDING') {
    return (
      <div className="rounded-card border border-line bg-surface-2 px-4 py-3">
        <p className="text-ui font-medium">Waiting for approval</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          A moderator of this community will look at your request. Until then you see it as
          any visitor does — nothing here has been shared with you yet.
        </p>
      </div>
    );
  }

  if (community.joinPolicy === 'INVITE' && !community.isMember) {
    return <p className="text-sm text-muted">{POLICY_COPY.INVITE}</p>;
  }

  async function join() {
    setBusy(true);
    const result = await communities.join(community.id);
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    // OPEN admits immediately; REQUEST queues — say which happened rather than guessing.
    toast.success(result.data.status === 'ACTIVE' ? 'You have joined.' : 'Your request has been sent to a moderator.');
    router.refresh();
  }

  async function leave() {
    setBusy(true);
    const result = await communities.leave(community.id);
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('You have left this community.');
    router.refresh();
  }

  return (
    <div>
      {community.isMember ? (
        <Button variant="secondary" disabled={busy} onClick={() => setConfirmLeave(true)}>Leave community</Button>
      ) : (
        <>
          <Button loading={busy} disabled={busy} onClick={() => void join()}>
            {busy ? 'Working…' : community.joinPolicy === 'OPEN' ? 'Join community' : 'Request to join'}
          </Button>
          <p className="mt-2 text-xs text-muted-2">{POLICY_COPY[community.joinPolicy]}</p>
          {/* What membership actually buys, before somebody commits to it. Joining does not
              hand over other people's private cases, and saying so prevents both the
              disappointment and the wrong expectation. */}
          <p className="mt-2 text-xs leading-relaxed text-muted-2">
            Members can read and take part in this community’s discussions. Joining does not
            give you access to anyone’s private case.
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this community?"
        description="You will lose access to its posts, and to any case scoped to it that is not otherwise shared with you."
        confirmLabel="Leave"
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={async () => { setConfirmLeave(false); await leave(); }}
      />
    </div>
  );
}
