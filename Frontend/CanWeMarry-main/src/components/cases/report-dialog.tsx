'use client';

import { useState } from 'react';
import { Button, Field, Modal, Select, Textarea, useToast } from '@/components/ui';
import { reports } from '@/lib/api';
import '@/lib/auth/session';

const REASONS = [
  { value: 'THREAT_OR_VIOLENCE', label: 'A threat, or a risk of violence' },
  { value: 'COERCION', label: 'Someone is being coerced or pressured' },
  { value: 'SELF_HARM_RISK', label: 'Someone may be at risk of harming themselves' },
  { value: 'HARASSMENT', label: 'Harassment or targeting' },
  { value: 'PRIVACY_VIOLATION', label: 'Private information about someone who did not consent' },
  { value: 'IMPERSONATION', label: 'Someone is impersonating another person' },
  { value: 'HATE_SPEECH', label: 'Hate speech' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'OFF_TOPIC', label: 'Off topic' },
  { value: 'OTHER', label: 'Something else' },
];

export interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: 'CASE' | 'POST' | 'COMMENT' | 'PROFILE' | 'COMMUNITY';
  targetId: string;
  targetLabel: string;
}

/**
 * Reporting.
 *
 * The reasons are ordered by how urgently a moderator needs to see them, not alphabetically:
 * the three the service escalates to CRITICAL sit at the top so somebody in difficulty
 * finds the right one first. On success the dialog says only that the report was received —
 * it never confirms what will happen, because that is the moderator's decision.
 */
export function ReportDialog({ open, onClose, targetType, targetId, targetLabel }: ReportDialogProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function close() {
    onClose();
    // Reset after the dialog has closed so the reset is not visible mid-animation.
    setTimeout(() => { setReason(''); setDetails(''); setError(null); setDone(false); }, 200);
  }

  async function submit() {
    if (!reason) { setError('Choose a reason so a moderator knows what to look at.'); return; }
    setSubmitting(true);
    setError(null);

    const result = await reports.create({ targetType, targetId, reason, details: details.trim() || undefined });
    setSubmitting(false);

    if (!result.ok) {
      // A duplicate is not a failure worth alarming someone about.
      if (result.error.status === 409) { setDone(true); return; }
      setError(result.error.message);
      return;
    }
    setDone(true);
    toast.success('Thank you. Our moderation team will review this report.');
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? 'Report received' : `Report this ${targetLabel}`}
      description={done ? undefined : 'If something feels unsafe or inappropriate, report it. A moderator will look, and your name is not shown to the person you are reporting.'}
      footer={
        done ? <Button onClick={close}>Close</Button> : (
          <>
            <Button variant="ghost" onClick={close} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={submitting}>{submitting ? 'Sending…' : 'Submit report'}</Button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-sm leading-relaxed">
          Thank you. Our moderation team will review this report. Reporting something does not hide
          it — withholding content is a moderator&rsquo;s decision, so that a report cannot be used
          to silence someone.
        </p>
      ) : (
        <div className="space-y-4">
          {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}

          <Field label="What is the problem?" required>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id} options={REASONS} placeholder="Choose a reason"
                value={reason} onChange={(e) => setReason(e.target.value)}
                aria-describedby={describedBy} invalid={invalid}
              />
            )}
          </Field>

          <Field label="Anything else a moderator should know?" hint="Optional. A sentence or two is plenty.">
            {({ id, describedBy }) => (
              <Textarea
                id={id} rows={4} maxLength={2000} value={details}
                onChange={(e) => setDetails(e.target.value)} aria-describedby={describedBy}
              />
            )}
          </Field>

          <p className="text-sm text-muted">
            If someone is in immediate danger, contact your local emergency number. This platform
            cannot respond quickly.
          </p>
        </div>
      )}
    </Modal>
  );
}
