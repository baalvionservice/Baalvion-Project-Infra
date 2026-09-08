'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ButtonLink, Card, CardBody, ConfirmDialog, ErrorState, useToast } from '@/components/ui';
import { invitations } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { InvitationPreview } from '@/lib/api/types';

const RELATION_LABEL: Record<string, string> = {
  PARTNER: 'their partner',
  FAMILY_MEMBER: 'a family member',
  MEDIATOR: 'a mediator',
  LEGAL_ADVISOR: 'a legal adviser',
  COUNSELLOR: 'a counsellor',
  OTHER: 'someone involved',
};

/**
 * Answering an invitation code.
 *
 * Accepting is the act of consenting, so it requires a signed-in account — the platform has
 * to know who agreed. Declining is offered on equal footing with accepting rather than
 * tucked away, because an invitation that is awkward to refuse is not really a choice.
 */
export function InviteActions({ token, preview }: { token: string; preview: InvitationPreview }) {
  const router = useRouter();
  const toast = useToast();
  const { identity, loading, refresh } = useIdentity();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  const relation = RELATION_LABEL[preview.relation] ?? 'someone involved';

  if (loading) return <Card><CardBody><p className="text-sm text-muted">Checking your session…</p></CardBody></Card>;

  if (!identity) {
    return (
      <Card>
        <CardBody>
          <h2 className="heading text-base">Sign in to answer this invitation</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Accepting an invitation is how you give consent to take part, so it has to come from
            an account. Your code stays valid — come back to this page after signing in.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`/login?next=/invite/${token}`}>Sign in</ButtonLink>
            <ButtonLink href="/register" variant="secondary">Create an account</ButtonLink>
          </div>
        </CardBody>
      </Card>
    );
  }

  async function accept() {
    setBusy(true); setError(null);
    const result = await invitations.accept(token);
    setBusy(false);
    if (!result.ok) { setError(result.error.message); return; }
    await refresh();
    toast.success('You have joined the case.');
    router.push(`/cases/${result.data.caseId}`);
    router.refresh();
  }

  async function decline() {
    setBusy(true); setError(null);
    const result = await invitations.decline(token);
    setBusy(false);
    if (!result.ok) { setError(result.error.message); return; }
    toast.success('You have declined. Nobody will be told anything beyond that.');
    router.push('/');
  }

  return (
    <div className="space-y-5">
      {error && <ErrorState title="That did not work" message={error} />}

      <Card>
        <CardBody>
          <h2 className="heading text-base">You have been invited as {relation}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            If you accept, you will be able to read the case and take part in its discussion, and
            the person who opened it will be told you joined. You can withdraw later, and
            withdrawing takes effect straight away.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            If you decline, the case owner is told only that the invitation was answered. That
            answer is final — declining cannot be undone, and the same code cannot be reused.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void accept()} loading={busy} disabled={busy}>
              {busy ? 'Working…' : 'Accept and join the case'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDecline(true)} disabled={busy}>
              Decline
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDecline}
        title="Decline this invitation?"
        description="The person who invited you will be told the invitation was answered, and nothing else. You will not be able to accept this code afterwards."
        confirmLabel="Decline"
        destructive
        onCancel={() => setConfirmDecline(false)}
        onConfirm={async () => { setConfirmDecline(false); await decline(); }}
      />
    </div>
  );
}
