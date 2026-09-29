'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge, Button, Card, CardBody, CardTitle, ConfirmDialog, Field, Input,
  Modal, RelativeTime, Select, useToast,
} from '@/components/ui';
import { cases } from '@/lib/api';
import type { Invitation, MintedInvitation } from '@/lib/api/types';

const RELATIONS = [
  { value: 'PARTNER', label: 'Partner' },
  { value: 'FAMILY_MEMBER', label: 'Family member' },
  { value: 'MEDIATOR', label: 'Mediator' },
  { value: 'LEGAL_ADVISOR', label: 'Legal adviser' },
  { value: 'COUNSELLOR', label: 'Counsellor' },
  { value: 'OTHER', label: 'Someone else' },
];

const EXPIRY = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
];

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'ok' | 'warn'> = {
  PENDING: 'accent', ACCEPTED: 'ok', DECLINED: 'neutral', REVOKED: 'neutral', EXPIRED: 'warn',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting to be used',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  REVOKED: 'Withdrawn',
  EXPIRED: 'Expired',
};

/**
 * Creating and managing invitation codes.
 *
 * The form asks for a RELATION and an expiry — never a name, an email or a phone number.
 * That is not an omission to be filled in later: the platform learns nothing about who a
 * code is for, which is what makes it safe to hand over through whatever channel the owner
 * already trusts.
 *
 * The code is shown once, immediately after creation, and cannot be retrieved again. A lost
 * code is withdrawn and replaced rather than recovered — the same handling as an API key,
 * for the same reason.
 */
export function InvitePanel({ caseId, invitations }: { caseId: string; invitations: Invitation[] }) {
  const router = useRouter();
  const toast = useToast();

  const [creating, setCreating] = useState(false);
  const [relation, setRelation] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('14');
  const [minted, setMinted] = useState<MintedInvitation | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = minted ? `${window.location.origin}/invite/${minted.token}` : '';

  async function create() {
    setBusy(true); setErrors({});
    const result = await cases.createInvitation(caseId, { relation, expiresInDays: Number(expiresInDays) });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    setMinted(result.data);
    setCreating(false);
    setRelation('');
    router.refresh();
  }

  async function revoke(id: string) {
    const result = await cases.revokeInvitation(caseId, id);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Invitation withdrawn. That code no longer works.');
    router.refresh();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be refused; the link is on screen to copy by hand either way.
      toast.info('Copy the link from the box above.');
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">Invitations</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>Create a code</Button>
        </div>

        {invitations.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No invitations yet. A code lets you invite someone without giving us their details.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="rounded-md border border-line bg-ground p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {RELATIONS.find((r) => r.value === inv.relation)?.label ?? inv.relation}
                  </span>
                  <Badge tone={STATUS_TONE[inv.status] ?? 'neutral'} className="ml-auto">
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-2">
                  Created <RelativeTime value={inv.createdAt} />
                  {inv.status === 'PENDING' && <> · expires <RelativeTime value={inv.expiresAt} /></>}
                </p>
                {inv.status === 'PENDING' && (
                  <button type="button" onClick={() => setConfirmRevoke(inv.id)}
                    className="focus-ring mt-2 rounded-sm text-xs text-muted hover:text-danger">
                    Withdraw this invitation
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      {/* ── Create ─────────────────────────────────────────────────────────── */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create an invitation code"
        description="Share the code with the person yourself, however you normally reach them."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void create()} loading={busy} disabled={busy || !relation}>
              {busy ? 'Creating…' : 'Create code'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="How are they involved?" required error={errors.relation?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={RELATIONS} placeholder="Choose" value={relation}
                onChange={(e) => setRelation(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="How long should the code work for?" error={errors.expiresInDays?.[0]}
            hint="After this it stops working, so an old code cannot be used by whoever finds it.">
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={EXPIRY} value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <p className="text-sm leading-relaxed text-muted">
            We do not ask for their name, email or phone number, and we do not send the
            invitation for you. The code names only the relationship you chose — nothing that
            identifies anyone.
          </p>
        </div>
      </Modal>

      {/* ── The code, shown once ───────────────────────────────────────────── */}
      <Modal
        open={minted !== null}
        onClose={() => { setMinted(null); setCopied(false); }}
        title="Your invitation code"
        description="This is the only time it is shown. If you lose it, withdraw the invitation and create another."
        footer={<Button onClick={() => { setMinted(null); setCopied(false); }}>Done</Button>}
      >
        {minted && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Code</p>
              <p className="mt-1 select-all break-all rounded-md border border-line bg-surface px-3 py-2 font-mono text-lg tracking-wider">
                {minted.token}
              </p>
            </div>
            <div>
              <label htmlFor="invite-link" className="text-sm font-medium">Or send this link</label>
              <div className="mt-1 flex gap-2">
                <Input id="invite-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                <Button variant="secondary" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</Button>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Anyone holding this code can accept, so send it only to the person you mean. They
              will see the relationship you chose and nothing about the case until they accept.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="Withdraw this invitation?"
        description="The code stops working immediately. If you have already shared it, tell the person it is no longer valid."
        confirmLabel="Withdraw"
        destructive
        onCancel={() => setConfirmRevoke(null)}
        onConfirm={async () => { const id = confirmRevoke!; setConfirmRevoke(null); await revoke(id); }}
      />
    </Card>
  );
}
