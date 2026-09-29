'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Textarea, useToast } from '@/components/ui';
import { moderation } from '@/lib/api';

/**
 * Accept or refuse one request.
 *
 * A refusal must carry a written reason — the service refuses without one. That is not
 * politeness: a silent no tells the applicant nothing about whether anyone read it, and this
 * is the same person the platform is asking to trust it with a family crisis.
 */
export function RequestDecision({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(approve: boolean) {
    setBusy(true);
    const result = await moderation.decideRoleRequest(id, {
      approve,
      note: note.trim() || undefined,
    });
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success(approve ? `${role.toLowerCase()} granted.` : 'Reply sent.');
    setDeclining(false); setNote('');
    router.refresh();
  }

  if (declining) {
    return (
      <div className="mt-5 rounded-2xl border border-line bg-ground p-5">
        <Field
          label="Why not, in your words"
          hint="They will see this. Say what would change the answer, if anything would."
        >
          {({ id: fieldId, describedBy }) => (
            <Textarea
              id={fieldId}
              aria-describedby={describedBy}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
          )}
        </Field>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" disabled={busy || !note.trim()} onClick={() => void decide(false)}>
            {busy ? 'Sending…' : 'Send refusal'}
          </Button>
          <Button variant="ghost" onClick={() => setDeclining(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button disabled={busy} onClick={() => void decide(true)}>Accept</Button>
      <Button variant="secondary" onClick={() => setDeclining(true)}>Decline…</Button>
    </div>
  );
}
