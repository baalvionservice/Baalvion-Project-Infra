'use client';

import { useState } from 'react';
import { Button, Field, Input, Textarea, Select, Card, CardBody, CardTitle, ErrorState } from '@/components/ui';
import { me } from '@/lib/api';
import type { Profile } from '@/lib/api/types';
import '@/lib/auth/session';

const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', label: 'Private' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'PUBLIC', label: 'Public' },
];

export function SettingsForm({ profile }: { profile: Profile | null }) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    setSaved(false);

    const form = new FormData(event.currentTarget);
    const result = await me.saveProfile({
      handle: form.get('handle') || undefined,
      displayName: form.get('displayName') || undefined,
      bio: form.get('bio') || undefined,
      isDiscoverable: form.get('isDiscoverable') === 'on',
      showLocation: form.get('showLocation') === 'on',
      defaultCaseVisibility: form.get('defaultCaseVisibility'),
    });

    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      setFormError(Object.keys(result.error.details ?? {}).length ? null : result.error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {formError && <ErrorState title="Could not save" message={formError} />}
      {saved && (
        <p role="status" className="rounded-card border border-ok/30 bg-ok/5 px-4 py-3 text-sm text-ok">
          Your settings have been saved.
        </p>
      )}

      <section className="space-y-5">
        <h2 className="heading text-xl">Profile</h2>

        <Field label="Handle" required error={errors.handle?.[0]}
          hint="Three to thirty characters. This is the only part of your profile a stranger can look up, and only if you are discoverable.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} name="handle" defaultValue={profile?.handle ?? ''} aria-describedby={describedBy} invalid={invalid} required />
          )}
        </Field>

        <Field label="Display name" error={errors.displayName?.[0]}
          hint="Whatever you want to be called here. It does not have to be your legal name.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} name="displayName" defaultValue={profile?.displayName ?? ''} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>

        <Field label="About you" error={errors.bio?.[0]}>
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} name="bio" defaultValue={profile?.bio ?? ''} rows={5} maxLength={1000} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="heading text-xl">Privacy</h2>
        <p className="text-sm text-muted">
          All three start closed. Nothing changes unless you change it here.
        </p>

        {/* The single most likely misunderstanding on this page, said before the controls
            rather than after them. Someone who makes their profile discoverable and assumes
            their cases came with it would be exposed by their own settings. */}
        <Card>
          <CardBody>
            <p className="text-ui leading-relaxed">
              <span className="font-medium">These settings control your PROFILE, not your cases.</span>{' '}
              <span className="text-muted">
                Making your profile discoverable does not make any case visible. Each case has
                its own visibility, set on the case itself, and changing one never changes the
                other.
              </span>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="isDiscoverable" defaultChecked={profile?.isDiscoverable ?? false}
                className="focus-ring mt-1 h-4 w-4 rounded border-line-strong" />
              <span>
                <span className="block text-sm font-medium">Let other members find my profile</span>
                <span className="block text-sm text-muted">
                  With this off, your handle returns nothing to anyone who looks it up. With it
                  on, they see your handle, display name, bio and avatar — never your cases,
                  your communities, or anyone you have invited.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="showLocation" defaultChecked={profile?.showLocation ?? false}
                className="focus-ring mt-1 h-4 w-4 rounded border-line-strong" />
              <span>
                <span className="block text-sm font-medium">Show my country and region</span>
                <span className="block text-sm text-muted">
                  Useful for finding local mediation or legal help; withheld from your profile otherwise.
                </span>
              </span>
            </label>
          </CardBody>
        </Card>

        <Field label="Default visibility for new cases" error={errors.defaultCaseVisibility?.[0]}
          hint="Applies to cases you open from now on. It never changes a case you have already written.">
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="defaultCaseVisibility" options={VISIBILITY_OPTIONS}
              defaultValue={profile?.defaultCaseVisibility ?? 'PRIVATE'} aria-describedby={describedBy} invalid={invalid} />
          )}
        </Field>
      </section>

      <Card>
        <CardBody>
          <CardTitle className="text-base">Leaving the platform</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Deleting a case removes its discussion, its supporters and its participant records along
            with it. Nothing you wrote is kept behind for other people to read.
          </p>
        </CardBody>
      </Card>

      <Button type="submit" size="lg" loading={submitting} disabled={submitting}>
        {submitting ? 'Saving…' : 'Save settings'}
      </Button>
    </form>
  );
}
