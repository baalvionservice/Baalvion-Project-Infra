'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, CardTitle, ConfirmDialog, Field, Modal, Textarea, useToast } from '@/components/ui';
import { cases } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { CaseDetail, CaseSummary, Supporter } from '@/lib/api/types';

interface SupportPanelProps {
  case: CaseSummary | CaseDetail;
  supporters: Supporter[];
  isOwner: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Waiting for a reply',
  ACCEPTED: 'Standing with this case',
  DECLINED: 'Not taken up',
  WITHDRAWN: 'Stepped back',
  REVOKED: 'Removed',
};

/**
 * Offering and accepting support.
 *
 * The copy here is doing real work. Support is an OFFER that waits for an answer — nobody
 * attaches themselves to a stranger's family situation by clicking. Every label is written
 * to make that obvious rather than to maximise the number of people who press the button.
 */
export function SupportPanel({ case: c, supporters, isOwner }: SupportPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const { identity, can } = useIdentity();

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [confirmOffer, setConfirmOffer] = useState(false);

  const mine = identity ? supporters.find((s) => s.userId === identity.userId) : undefined;
  const pending = supporters.filter((s) => s.status === 'REQUESTED');
  const accepted = supporters.filter((s) => s.status === 'ACCEPTED');

  const canOffer =
    Boolean(identity) &&
    !isOwner &&
    can('case:support') &&
    c.allowSupporterRequests &&
    c.status === 'OPEN' &&
    (!mine || ['DECLINED', 'WITHDRAWN'].includes(mine.status));

  async function run(fn: () => Promise<{ ok: boolean; error?: { message: string } }>, ok: string) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) { toast.error(result.error?.message ?? 'That did not work.'); return; }
    toast.success(ok);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <CardTitle className="text-base">Support</CardTitle>

        <p className="mt-2 text-sm text-muted">
          {accepted.length === 0
            ? 'Nobody is standing with this case yet.'
            : `${accepted.length} ${accepted.length === 1 ? 'person is' : 'people are'} standing with this case.`}
        </p>

        {/* Said once, to the person it is about, and only when it is true. A count is a
            number; what it means to the owner is that somebody read this and stayed. There
            is deliberately no target, no progress and no "only N more" — support is not a
            campaign and must never be counted like one. */}
        {isOwner && accepted.length > 0 && (
          <p className="mt-1 text-sm leading-relaxed text-muted">
            You are not going through this alone.
          </p>
        )}

        {/* ── The owner's queue of offers ────────────────────────────────── */}
        {isOwner && (
          <div className="mt-4">
            {pending.length === 0 ? (
              <p className="text-sm text-muted">No offers waiting for your answer.</p>
            ) : (
              <>
                <h4 className="text-sm font-medium">Offers waiting for you</h4>
                <ul className="mt-2 space-y-3">
                  {pending.map((s) => (
                    <li key={s.id} className="rounded-md border border-line bg-ground p-3">
                      {s.message && <p className="text-sm leading-relaxed">{s.message}</p>}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" disabled={busy}
                          onClick={() => run(() => cases.decideSupport(c.id, s.id, 'ACCEPTED'), 'Offer accepted.')}>
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy}
                          onClick={() => run(() => cases.decideSupport(c.id, s.id, 'DECLINED'), 'Offer declined.')}>
                          Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* ── Where the reader stands ────────────────────────────────────── */}
        {mine && !isOwner && (
          <div className="mt-4 rounded-md border border-line bg-ground p-3">
            <Badge tone={mine.status === 'ACCEPTED' ? 'ok' : 'neutral'}>{STATUS_LABEL[mine.status]}</Badge>
            {mine.status === 'ACCEPTED' && (
              <Button size="sm" variant="ghost" className="mt-3" disabled={busy} onClick={() => setConfirmWithdraw(true)}>
                Step back from this case
              </Button>
            )}
            {mine.status === 'REQUESTED' && (
              <p className="mt-2 text-sm text-muted">
                The person who opened this case decides whether to take up your offer.
              </p>
            )}
          </div>
        )}

        {/* ── Making an offer ────────────────────────────────────────────── */}
        {canOffer && (
          <div className="mt-4">
            <Button fullWidth onClick={() => setConfirmOffer(true)} disabled={busy}>Offer support</Button>
            <p className="mt-2 text-xs text-muted-2">
              This sends a request. You will only take part if they accept.
            </p>
          </div>
        )}

        {!identity && (
          <p className="mt-4 text-sm text-muted">Sign in to offer support on this case.</p>
        )}
        {identity && !isOwner && !can('case:support') && (
          <p className="mt-4 text-sm text-muted">
            Offering support is open to members with supporter standing. A moderator can grant it.
          </p>
        )}
        {identity && !isOwner && can('case:support') && !c.allowSupporterRequests && (
          <p className="mt-4 text-sm text-muted">This case is not accepting offers of support right now.</p>
        )}
      </CardBody>

      {/* Offering support is a step worth pausing on. The dialog says what support IS —
          and, more importantly, what it is not: standing with someone is not a claim on
          their decisions. Getting that wrong is how a support platform turns into pressure. */}
      <Modal
        open={confirmOffer}
        onClose={() => setConfirmOffer(false)}
        title="Offer your support"
        description="Support is voluntary on both sides."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOffer(false)} disabled={busy}>Cancel</Button>
            <Button
              loading={busy} disabled={busy}
              onClick={async () => {
                setConfirmOffer(false);
                await run(() => cases.offerSupport(c.id, message.trim() || undefined), 'Your offer has been sent.');
                setMessage('');
              }}
            >
              {busy ? 'Sending…' : 'Send my offer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-ui leading-relaxed">
            You are offering your support to this person. Support is voluntary and does not give
            you any say over their decisions — they choose whether to accept, what to share, and
            what to do next.
          </p>
          <p className="text-ui leading-relaxed text-muted">
            If they accept, you will be able to read the case and take part in its discussion.
            Either of you can step back at any time.
          </p>

          <Field label="Add a note" hint="Optional. Say what you can offer, not what they should do.">
            {({ id, describedBy }) => (
              <Textarea id={id} rows={3} maxLength={1000} value={message}
                onChange={(e) => setMessage(e.target.value)} aria-describedby={describedBy}
                placeholder="I went through something similar with my own family and would be glad to talk." />
            )}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmWithdraw}
        title="Step back from this case?"
        description="You will lose access to the case and its discussion. You can offer again later."
        confirmLabel="Step back"
        destructive
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={async () => {
          setConfirmWithdraw(false);
          await run(() => cases.withdrawSupport(c.id), 'You have stepped back from this case.');
        }}
      />
    </Card>
  );
}
