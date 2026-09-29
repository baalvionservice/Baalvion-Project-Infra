'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, Button, Card, CardBody, CardTitle, ConfirmDialog, Field, Input, Modal, Select, useToast,
} from '@/components/ui';
import { cases } from '@/lib/api';
import type { Participant } from '@/lib/api/types';

const RELATION_LABEL: Record<string, string> = {
  SELF: 'Opened this case',
  PARTNER: 'Partner',
  FAMILY_MEMBER: 'Family member',
  MEDIATOR: 'Mediator',
  LEGAL_ADVISOR: 'Legal adviser',
  COUNSELLOR: 'Counsellor',
  OTHER: 'Other',
};

const CONSENT_LABEL: Record<string, string> = {
  SELF: 'Opened this case',
  INVITED: 'Invitation pending',
  GRANTED: 'Taking part',
  DECLINED: 'Chose not to take part',
  WITHDRAWN: 'Stepped back',
};

const CONSENT_TONE: Record<string, 'neutral' | 'accent' | 'ok'> = {
  SELF: 'accent', GRANTED: 'ok', INVITED: 'neutral', DECLINED: 'neutral', WITHDRAWN: 'neutral',
};

const RELATIONS = Object.entries(RELATION_LABEL)
  .filter(([v]) => v !== 'SELF')
  .map(([value, label]) => ({ value, label }));

/**
 * Who is in a case, and the consent that put them there.
 *
 * The privacy architecture from the foundation is visible in what this component CANNOT
 * render: the server returns `userId: null` for anyone who has not consented, so an
 * invitation pending shows a relation label and nothing else. There is no name field in the
 * invite form either — you invite an account that can answer for itself, which is why the
 * form asks for an account reference rather than a person's details.
 *
 * Only the invitee sees Accept and Decline. The case owner never does, because consent
 * somebody else can grant on your behalf is not consent.
 */
export function ParticipantsPanel({
  caseId, participants, isOwner,
}: { caseId: string; participants: Participant[]; isOwner: boolean }) {
  const router = useRouter();
  const toast = useToast();

  const [inviting, setInviting] = useState(false);
  const [userId, setUserId] = useState('');
  const [relation, setRelation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: { message: string } }>, ok: string) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) { toast.error(result.error?.message ?? 'That did not work.'); return false; }
    toast.success(ok);
    router.refresh();
    return true;
  }

  async function invite() {
    setBusy(true);
    setErrors({}); setFormError(null);
    const result = await cases.invite(caseId, { userId: userId.trim(), relation });
    setBusy(false);

    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) setFormError(result.error.message);
      return;
    }
    setInviting(false); setUserId(''); setRelation('');
    toast.success('Invitation sent. They decide whether to take part.');
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">People in this case</CardTitle>
          {isOwner && (
            <Button size="sm" variant="secondary" onClick={() => setInviting(true)}>Invite</Button>
          )}
        </div>

        <ul className="mt-4 space-y-3">
          {participants.map((p) => {
            const canAnswer = p.isSelf && p.consentStatus === 'INVITED';
            const canWithdraw = p.isSelf && p.consentStatus === 'GRANTED';
            return (
              <li key={p.id} className="rounded-md border border-line bg-ground p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{RELATION_LABEL[p.relation] ?? p.relation}</span>
                  {p.isSelf && <Badge tone="accent">You</Badge>}
                  <Badge tone={CONSENT_TONE[p.consentStatus] ?? 'neutral'} className="ml-auto">
                    {CONSENT_LABEL[p.consentStatus] ?? p.consentStatus}
                  </Badge>
                </div>

                {/* An invitation nobody has answered identifies nobody — the server sent no
                    user id, so there is nothing to show even if this component wanted to. */}
                {p.consentStatus === 'INVITED' && !p.isSelf && (
                  <p className="mt-2 text-xs text-muted-2">
                    Who this is stays private until they accept.
                  </p>
                )}

                {canAnswer && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy}
                      onClick={() => void run(() => cases.respondToInvitation(caseId, p.id, 'GRANTED'), 'You have joined this case.')}>
                      Accept
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy}
                      onClick={() => void run(() => cases.respondToInvitation(caseId, p.id, 'DECLINED'), 'You have declined.')}>
                      Decline
                    </Button>
                  </div>
                )}

                {canWithdraw && (
                  <Button size="sm" variant="ghost" className="mt-3" disabled={busy}
                    onClick={() => setConfirmWithdraw(p.id)}>
                    Withdraw from this case
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        {participants.length === 0 && (
          <p className="mt-3 text-sm text-muted">Nobody else has been invited to this case.</p>
        )}
      </CardBody>

      {/* ── Invite ──────────────────────────────────────────────────────── */}
      <Modal
        open={inviting}
        onClose={() => setInviting(false)}
        title="Invite someone into this case"
        description="They decide for themselves whether to take part."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviting(false)} disabled={busy}>Cancel</Button>
            <Button onClick={invite} loading={busy} disabled={busy || !userId.trim() || !relation}>
              {busy ? 'Sending…' : 'Send invitation'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{formError}</p>
          )}

          <Field
            label="Their account reference"
            required
            error={errors.userId?.[0]}
            hint="You can only invite someone who already has an account here. Ask them for their account reference — we deliberately provide no way to add a person by name or email."
          >
            {({ id, describedBy, invalid }) => (
              <Input id={id} value={userId} onChange={(e) => setUserId(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} placeholder="00000000-0000-0000-0000-000000000000"
                className="font-mono text-sm" />
            )}
          </Field>

          <Field label="How are they involved?" required error={errors.relation?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={RELATIONS} placeholder="Choose" value={relation}
                onChange={(e) => setRelation(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <p className="text-sm text-muted">
            Until they accept, nobody — including you — will see anything that identifies them on this
            case. If they decline, that answer is final.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmWithdraw !== null}
        title="Withdraw from this case?"
        description="You will lose access to it immediately, and you cannot re-join this invitation afterwards."
        confirmLabel="Withdraw"
        destructive
        onCancel={() => setConfirmWithdraw(null)}
        onConfirm={async () => {
          const id = confirmWithdraw!;
          setConfirmWithdraw(null);
          await run(() => cases.withdrawConsent(caseId, id), 'You have withdrawn from this case.');
        }}
      />
    </Card>
  );
}
