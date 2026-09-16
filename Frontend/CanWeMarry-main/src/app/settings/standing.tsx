'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Textarea, useToast } from '@/components/ui';
import { me } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { RoleRequest } from '@/lib/api/types';

/**
 * Asking to be able to offer support.
 *
 * A new account can open a case, post, comment and report — but not offer to stand with
 * somebody else, because that is a standing a moderator confers rather than a box a stranger
 * ticks on their first afternoon. This is the form that asks for it.
 *
 * The floor of forty characters is not there to be tidy. A moderator has to decide something
 * about a person from this paragraph and nothing else, and "please" gives them nothing to
 * decide on.
 */
const ROLES = [
  {
    value: 'SUPPORTER' as const,
    label: 'Supporter',
    blurb: 'Offer to stand with someone whose case you have read. They still decide whether to accept.',
  },
  {
    value: 'VOLUNTEER' as const,
    label: 'Volunteer',
    blurb: 'For mediators, counsellors and legal advisers. Also curates the resource directory and can start communities.',
  },
];

const MIN = 40;

const TONE = {
  PENDING: 'neutral',
  APPROVED: 'ok',
  DECLINED: 'warn',
  WITHDRAWN: 'neutral',
} as const;

const WORDING: Record<RoleRequest['status'], string> = {
  PENDING: 'Waiting for a moderator',
  APPROVED: 'Accepted',
  DECLINED: 'Not accepted',
  WITHDRAWN: 'Withdrawn',
};

export function Standing({ requests }: { requests: RoleRequest[] }) {
  const router = useRouter();
  const toast = useToast();
  const { hasRole } = useIdentity();

  const [role, setRole] = useState<'SUPPORTER' | 'VOLUNTEER' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const pending = requests.find((r) => r.status === 'PENDING');
  const short = reason.trim().length < MIN;

  async function submit() {
    if (!role) return;
    setBusy(true);
    const result = await me.requestRole({ role, reason: reason.trim() });
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Sent. A moderator will read it.');
    setRole(null); setReason('');
    router.refresh();
  }

  async function withdraw(id: string) {
    const result = await me.withdrawRoleRequest(id);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Withdrawn.');
    router.refresh();
  }

  return (
    <section aria-labelledby="standing" className="mt-12 border-t border-line pt-10">
      <h2 id="standing" className="heading text-xl">What you can do here</h2>
      <p className="mt-2 leading-relaxed text-muted">
        Everyone can open a case, join a community, post and report. Offering support to
        somebody else is different — a moderator grants it, because a person in the middle of a
        family crisis should not be approached by an account that was created five minutes ago.
      </p>

      {/* Prior answers, including refusals. A decline that vanished would leave somebody
          wondering whether the request was ever read. */}
      {requests.length > 0 && (
        <ul className="mt-6 space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{r.role === 'SUPPORTER' ? 'Supporter' : 'Volunteer'}</span>
                <Badge tone={TONE[r.status]}>{WORDING[r.status]}</Badge>
                {r.status === 'PENDING' && (
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void withdraw(r.id)}>
                    Withdraw
                  </Button>
                )}
              </div>
              {r.decisionNote && (
                <p className="mt-3 border-l-2 border-line-strong pl-4 leading-relaxed text-muted">
                  {r.decisionNote}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasRole('SUPPORTER') || hasRole('VOLUNTEER') ? (
        <p className="mt-6 text-muted">You already hold this standing.</p>
      ) : pending ? (
        <p className="mt-6 text-muted">
          Your request is with a moderator. You will get a notification when it has been read.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Card key={r.value} className="rounded-2xl">
              <CardBody className="flex h-full flex-col p-6">
                <h3 className="heading text-base">{r.label}</h3>
                <p className="mt-2 flex-1 text-ui leading-relaxed text-muted">{r.blurb}</p>
                <Button
                  variant={role === r.value ? 'primary' : 'secondary'}
                  className="mt-5 self-start rounded-full"
                  onClick={() => setRole(role === r.value ? null : r.value)}
                >
                  {role === r.value ? 'Selected' : `Ask to be a ${r.label.toLowerCase()}`}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {role && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <Field
            label="Why you would be good at this"
            hint="Your own experience is what matters here, not your qualifications. A moderator reads this and nothing else about you."
          >
            {({ id, describedBy }) => (
              <Textarea
                id={id}
                aria-describedby={describedBy}
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
              />
            )}
          </Field>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => void submit()} disabled={busy || short}>
              {busy ? 'Sending…' : 'Send request'}
            </Button>
            <Button variant="ghost" onClick={() => { setRole(null); setReason(''); }}>
              Cancel
            </Button>
            <span className="text-sm text-muted-2" aria-live="polite">
              {short ? `${MIN - reason.trim().length} more characters` : 'Ready to send'}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
