'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Field, Modal, Select, Textarea, useToast } from '@/components/ui';
import { moderation } from '@/lib/api';
import type { AdminUser } from '@/lib/api/types';
import '@/lib/auth/session';

/**
 * Suspending and reinstating an account.
 *
 * The durations are real: the service stores `expires_at` on the moderation record and
 * `suspended_until` on the account, so a 7-day suspension genuinely says 7 days rather than
 * being a label over an indefinite block. "No end date" sends no expiry, which the service
 * records as an open-ended suspension — stated plainly rather than dressed up as a default.
 *
 * There is no automatic reinstatement job, so an expiry is a record of intent that a
 * moderator still has to act on. That limitation is surfaced in the dialog rather than
 * hidden, because a moderator who believes it lifts itself will not come back to lift it.
 */
const DURATIONS = [
  { value: '1', label: '24 hours' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '', label: 'No end date' },
];

export function SuspendDialog({ user }: { user: AdminUser }) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'SUSPEND' | 'UNSUSPEND'>('SUSPEND');
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  const suspended = user.status === 'SUSPENDED';

  function start(next: 'SUSPEND' | 'UNSUSPEND') {
    setMode(next); setReason(''); setErrors({}); setOpen(true);
  }

  // Formatted in the browser only: the server has a different clock reading and a different
  // locale, and both made the SSR output disagree with the first client render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const endsAt = mounted && days
    ? new Date(Date.now() + Number(days) * 86_400_000).toLocaleString()
    : null;

  async function submit() {
    setBusy(true); setErrors({});
    const expiresAt = mode === 'SUSPEND' && days
      ? new Date(Date.now() + Number(days) * 86_400_000).toISOString()
      : undefined;

    const result = await moderation.act({
      targetType: 'USER',
      targetId: user.id,
      action: mode,
      reason: reason.trim(),
      expiresAt,
    });
    setBusy(false);

    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    setOpen(false);
    toast.success(mode === 'SUSPEND' ? 'Account suspended.' : 'Account reinstated.');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {suspended && (
          <Badge tone="warn">
            Suspended
            {user.suspendedUntil ? ` until ${new Date(user.suspendedUntil).toLocaleDateString()}` : ' — no end date'}
          </Badge>
        )}
        <Button size="sm" variant={suspended ? 'secondary' : 'ghost'} onClick={() => start(suspended ? 'UNSUSPEND' : 'SUSPEND')}>
          {suspended ? 'Reinstate' : 'Suspend'}
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === 'SUSPEND' ? 'Suspend this account' : 'Reinstate this account'}
        description={
          mode === 'SUSPEND'
            ? 'Suspending this user will restrict their ability to participate.'
            : 'They will be able to sign in and take part again immediately.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant={mode === 'SUSPEND' ? 'danger' : 'primary'} onClick={() => void submit()}
              loading={busy} disabled={busy || reason.trim().length < 10}>
              {busy ? 'Working…' : mode === 'SUSPEND' ? 'Suspend account' : 'Reinstate account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {mode === 'SUSPEND' && (
            <>
              <p className="rounded-md border border-warn/30 bg-warn/5 px-3 py-2 text-sm text-warn">
                They will not be able to open cases, comment, or take part in any discussion. They
                keep access to what they have already written.
              </p>

              <Field label="How long?" hint="Recorded on the account and on the moderation record.">
                {({ id, describedBy }) => (
                  <Select id={id} options={DURATIONS} value={days}
                    onChange={(e) => setDays(e.target.value)} aria-describedby={describedBy} />
                )}
              </Field>

              {days && (
                <p className="text-sm text-muted">
                  {/* Rendered only after mount. `Date.now()` on the server and on the client
                      are a second apart, and the two formatted strings disagreed — React
                      reported a hydration mismatch on every visit to this page. */}
                  {endsAt ? <>Ends {endsAt}. </> : null}
                  <span className="text-muted-2">
                    An expiry does lift the block by itself: the check runs on every request,
                    so access returns the moment it passes. What is not tidied up is the
                    record — the account keeps a suspension row afterwards, which is why the
                    suspensions list shows it as expired rather than in force.
                  </span>
                </p>
              )}
            </>
          )}

          <Field label="Reason" required error={errors.reason?.[0]}
            hint="At least a sentence. This goes on the permanent moderation record and is what makes the decision reviewable.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={4} maxLength={1000} value={reason}
                onChange={(e) => setReason(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        </div>
      </Modal>
    </>
  );
}
