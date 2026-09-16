'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Select, Textarea, useToast } from '@/components/ui';
import { moderation } from '@/lib/api';
import type { Report } from '@/lib/api/types';
import '@/lib/auth/session';

const STATUSES = [
  { value: 'TRIAGED', label: 'Triaged — looked at, still being worked on' },
  { value: 'ACTIONED', label: 'Actioned — a moderation action was taken' },
  { value: 'DISMISSED', label: 'Dismissed — no action needed' },
];

const SEVERITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const ACTIONS = [
  { value: 'HIDE', label: 'Hide — withhold it from everyone but its author' },
  { value: 'UNHIDE', label: 'Unhide — restore it' },
  { value: 'LOCK', label: 'Lock — no new comments' },
  { value: 'UNLOCK', label: 'Unlock' },
  { value: 'REMOVE', label: 'Remove — withhold it from its author too' },
  { value: 'RESTORE', label: 'Restore a removed item' },
  { value: 'WARN', label: 'Warn the author (sends them a note)' },
];

/**
 * Reviewing one report, and acting on it.
 *
 * The two are separate calls on purpose: closing a report and moderating the content it
 * describes are different decisions, and the service records them in different places —
 * `reports` for the queue, `moderation_actions` for the reviewable decision log.
 *
 * Every action needs a reason of at least ten characters. The server rejects a shorter one,
 * so the constraint is real rather than a placeholder.
 */
export function ReviewPanel({ report }: { report: Report }) {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState('TRIAGED');
  const [severity, setSeverity] = useState(report.severity);
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function review() {
    setBusy(true); setErrors({});
    const result = await moderation.review(report.id, { status, severity, resolutionNote: note.trim() || undefined });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    toast.success('Report updated.');
    router.refresh();
  }

  async function act() {
    setBusy(true); setErrors({});
    const result = await moderation.act({
      targetType: report.targetType,
      targetId: report.targetId,
      action,
      reason: reason.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    toast.success('Action recorded.');
    setAction(''); setReason('');
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-4">
          <h3 className="heading text-base">Close the report</h3>

          <Field label="Outcome" error={errors.status?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={STATUSES} value={status} onChange={(e) => setStatus(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="Severity" error={errors.severity?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={SEVERITIES} value={severity}
                onChange={(e) => setSeverity(e.target.value as Report['severity'])}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="Note" error={errors.resolutionNote?.[0]}
            hint="Not shown to the person who reported it — they see only that it was handled.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Button onClick={() => void review()} loading={busy} disabled={busy}>{busy ? 'Saving…' : 'Save review'}</Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h3 className="heading text-base">Act on the content</h3>
          <p className="text-sm text-muted">
            Applies to the <Badge>{report.targetType.toLowerCase()}</Badge> this report is about.
          </p>

          <Field label="Action" error={errors.action?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={ACTIONS} placeholder="Choose an action" value={action}
                onChange={(e) => setAction(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="Reason" required error={errors.reason?.[0]}
            hint="At least a sentence. This goes on the permanent decision log and is what makes the action reviewable later.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Button onClick={() => void act()} loading={busy} disabled={busy || !action || reason.trim().length < 10}>
            {busy ? 'Recording…' : 'Take this action'}
          </Button>

          <p className="text-xs text-muted-2">
            Hiding is a moderator&rsquo;s decision, never automatic — a report alone never withholds
            anything, so reporting cannot be used to silence someone.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
