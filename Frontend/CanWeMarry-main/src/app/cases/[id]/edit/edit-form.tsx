'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, CardTitle, ConfirmDialog, ErrorState, Field,
  Input, Select, Textarea, VisibilityBadge, useToast,
} from '@/components/ui';
import { cases } from '@/lib/api';
import type { CaseDetail, Community } from '@/lib/api/types';
import '@/lib/auth/session';

const STATUSES = [
  { value: 'DRAFT', label: 'Draft — visible to nobody but you' },
  { value: 'OPEN', label: 'Open — accepting support and discussion' },
  { value: 'ON_HOLD', label: 'On hold — paused for now' },
  { value: 'RESOLVED', label: 'Resolved — the situation has moved on' },
  { value: 'CLOSED', label: 'Closed — no longer active' },
];

const VISIBILITIES = [
  { value: 'PRIVATE', label: 'Private — you and the people taking part' },
  { value: 'COMMUNITY', label: 'Community — members of one community you belong to' },
];

/**
 * Editing an existing case.
 *
 * Status and visibility are the consequential fields, so they are separated from the text
 * and each carries its own explanation. Changing visibility runs through the server's own
 * checks — a COMMUNITY case must name a community the author belongs to — and the failure
 * comes back as a field error rather than a silent no-op.
 */
export function EditCaseForm({ case: c, communities }: { case: CaseDetail; communities: Community[] }) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(c.title);
  const [summary, setSummary] = useState(c.summary);
  const [situation, setSituation] = useState(c.situation ?? '');
  const [status, setStatus] = useState(c.status);
  const [visibility, setVisibility] = useState(c.visibility);
  const [communityId, setCommunityId] = useState(c.communityId ?? '');
  const [allowSupport, setAllowSupport] = useState(c.allowSupporterRequests);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setBusy(true); setErrors({}); setFormError(null);
    const result = await cases.update(c.id, {
      title: title.trim(),
      summary: summary.trim(),
      situation: situation.trim() || undefined,
      status,
      visibility,
      communityId: visibility === 'COMMUNITY' ? communityId || undefined : undefined,
      allowSupporterRequests: allowSupport,
    });
    setBusy(false);

    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) setFormError(result.error.message);
      return;
    }
    toast.success('Your changes have been saved.');
    router.push(`/cases/${c.id}`);
    router.refresh();
  }

  async function remove() {
    const result = await cases.remove(c.id);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Case deleted.');
    router.push('/my-cases');
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      {formError && <ErrorState title="Could not save" message={formError} />}

      <section className="space-y-5">
        <h2 className="heading text-lg">Your account of the situation</h2>

        <Field label="Title" required error={errors.title?.[0]}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)}
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="Summary" required error={errors.summary?.[0]}
          hint="Shown to anyone who can see the case at all.">
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} rows={4} maxLength={600} value={summary}
              onChange={(e) => setSummary(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="The fuller story" error={errors.situation?.[0]}
          hint="Shown only to people taking part in the case.">
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} rows={12} maxLength={8000} value={situation}
              onChange={(e) => setSituation(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="heading text-lg">Status and privacy</h2>

        <Field label="Status" error={errors.status?.[0]}
          hint="A draft is visible to nobody but you. Opening the case is what makes it reachable by the people you have chosen.">
          {({ id, describedBy, invalid }) => (
            <Select id={id} options={STATUSES} value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="Who can see it" error={errors.visibility?.[0]}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} options={VISIBILITIES} value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <p className="flex items-center gap-2 text-sm text-muted">
          Currently: <VisibilityBadge visibility={visibility} />
        </p>

        {visibility === 'COMMUNITY' && (
          <Field label="Which community?" required error={errors.communityId?.[0]}
            hint={communities.length === 0 ? 'You are not an active member of any community. Join one, or keep this case private.' : undefined}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} value={communityId} onChange={(e) => setCommunityId(e.target.value)}
                placeholder="Choose a community" disabled={communities.length === 0}
                options={communities.map((cm) => ({ value: cm.id, label: cm.name }))}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        )}

        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={allowSupport} onChange={(e) => setAllowSupport(e.target.checked)}
            className="focus-ring mt-1 h-4 w-4 rounded border-line-strong" />
          <span>
            <span className="block text-sm font-medium">Let members offer to support this case</span>
            <span className="block text-sm text-muted">Offers still wait for your answer.</span>
          </span>
        </label>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <Button type="submit" loading={busy} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/cases/${c.id}`)}>Cancel</Button>
        <Button type="button" variant="danger" className="sm:ml-auto" onClick={() => setConfirmDelete(true)}>
          Delete this case
        </Button>
      </div>

      <Card>
        <CardBody>
          <CardTitle className="text-base">Deleting a case</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Deleting removes the discussion, the supporters and the participant records along with
            it. Nothing you wrote is left behind for anyone to read.
          </p>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this case?"
        description="The case, its discussion, its supporters and its participant records will all be removed."
        confirmLabel="Delete permanently"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { setConfirmDelete(false); await remove(); }}
      />
    </form>
  );
}
