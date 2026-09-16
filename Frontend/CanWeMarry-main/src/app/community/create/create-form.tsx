'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, ErrorState, Field, Input, Select, Textarea, useToast,
} from '@/components/ui';
import { communities } from '@/lib/api';
import { cn } from '@/components/ui/cn';
import '@/lib/auth/session';

const VISIBILITY = [
  { value: 'PUBLIC', label: 'Public — listed, and anyone can read its discussions' },
  { value: 'PRIVATE', label: 'Private — not listed to anyone outside it' },
];

const JOIN_POLICY = [
  { value: 'REQUEST', label: 'By request — a moderator reviews each person' },
  { value: 'OPEN', label: 'Open — anyone signed in may join immediately' },
  { value: 'INVITE', label: 'Invitation only — nobody can ask to join' },
];

const STEPS = ['Details', 'Purpose and rules', 'Access', 'Review'] as const;

/**
 * Creating a community.
 *
 * The rules field is not decoration. A community formed around family opposition can drift
 * into somewhere people are encouraged to confront relatives, and the clearest defence is
 * that its own members know from the start what it is for.
 *
 * Creating one does NOT confer platform standing. The creator becomes an administrator of
 * that community — a scope that governs its membership and nothing else. They do not gain
 * the ability to moderate cases, review reports or touch anyone's account.
 */
export function CreateCommunityForm() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [rules, setRules] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [joinPolicy, setJoinPolicy] = useState('REQUEST');

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Derived until the person edits it themselves, then left alone.
  const onName = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64));
    }
  };

  function stepErrors(index: number): Record<string, string[]> {
    const e: Record<string, string[]> = {};
    if (index === 0) {
      if (!name.trim()) e.name = ['Give the community a name.'];
      if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug)) e.slug = ['Use 3–64 lowercase letters, numbers or hyphens.'];
    }
    if (index === 1 && !purpose.trim()) e.purpose = ['Say what this community is for. Members should know before they join.'];
    return e;
  }

  function next() {
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length === 0) { setStep((s) => Math.min(s + 1, STEPS.length - 1)); window.scrollTo(0, 0); }
  }

  async function submit() {
    setBusy(true); setErrors({}); setFormError(null);
    const result = await communities.create({
      slug, name: name.trim(), description: description.trim() || undefined,
      purpose: purpose.trim() || undefined, rules: rules.trim() || undefined,
      visibility, joinPolicy,
    });
    setBusy(false);

    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) setFormError(result.error.message);
      const bad = Object.keys(result.error.details ?? {})[0];
      if (bad === 'name' || bad === 'slug') setStep(0);
      else if (bad === 'purpose' || bad === 'rules') setStep(1);
      return;
    }
    toast.success('Community created. You are its first member.');
    router.push(`/community/${result.data.slug}`);
    router.refresh();
  }

  return (
    <div>
      <nav aria-label="Progress" className="mb-8">
        <p className="text-sm text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        <ol className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span aria-current={i === step ? 'step' : undefined}
                className={cn('block h-1.5 rounded-full', i <= step ? 'bg-accent' : 'bg-surface-2')} />
              <span className="sr-only">{label}{i < step ? ' (completed)' : i === step ? ' (current)' : ''}</span>
            </li>
          ))}
        </ol>
      </nav>

      {formError && <ErrorState title="Could not create this community" message={formError} className="mb-6" />}

      {step === 0 && (
        <div className="space-y-6">
          <Field label="Name" required error={errors.name?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} value={name} maxLength={120} onChange={(e) => onName(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="Web address" required error={errors.slug?.[0]}
            hint="This appears in the link people will use. Lowercase letters, numbers and hyphens.">
            {({ id, describedBy, invalid }) => (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-2">/community/</span>
                <Input id={id} value={slug} maxLength={64}
                  onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }}
                  aria-describedby={describedBy} invalid={invalid} className="font-mono text-sm" />
              </div>
            )}
          </Field>

          <Field label="Short description" error={errors.description?.[0]}
            hint="One or two sentences, shown on the community list.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={3} maxLength={2000} value={description}
                onChange={(e) => setDescription(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Field label="What is this community for?" required error={errors.purpose?.[0]}
            hint="Who it is for and what people can expect. Someone deciding whether to join reads this first.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={5} maxLength={2000} value={purpose}
                onChange={(e) => setPurpose(e.target.value)} aria-describedby={describedBy} invalid={invalid}
                placeholder="A space for people whose families object on religious grounds, to compare what has and has not helped." />
            )}
          </Field>

          <Field label="Rules" error={errors.rules?.[0]}
            hint="What is expected here, beyond the platform-wide rules. Being specific now saves difficult conversations later.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={7} maxLength={4000} value={rules}
                onChange={(e) => setRules(e.target.value)} aria-describedby={describedBy} invalid={invalid}
                placeholder={'No advice about confronting anyone.\nDo not name people who are not here.\nDisagree with the choice, not the person.'} />
            )}
          </Field>

          <Card>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">
                The platform rules apply here whatever you write: no threats, no harassment, and
                no information about people who have not agreed to appear. Your rules add to
                those; they cannot relax them.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Field label="Who can see this community?" error={errors.visibility?.[0]}
            hint="A private community is not listed to people outside it — its existence is part of what membership protects.">
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={VISIBILITY} value={visibility}
                onChange={(e) => setVisibility(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="How do people join?" error={errors.joinPolicy?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} options={JOIN_POLICY} value={joinPolicy}
                onChange={(e) => setJoinPolicy(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Card>
            <CardBody>
              <h2 className="heading text-base">What creating this does not give you</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You become an administrator of this community, which governs its membership and
                nothing else. It does not let you moderate cases, review reports, suspend anyone,
                or see anything about accounts outside this group. Those powers belong to platform
                moderators and administrators.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="heading text-lg">Review</h2>
          <dl className="divide-y divide-line rounded-card border border-line bg-surface">
            {[
              ['Name', name || '—'],
              ['Address', `/community/${slug || '—'}`],
              ['Purpose', purpose || 'Not written yet'],
              ['Rules', rules ? `${rules.trim().split('\n').filter(Boolean).length} line(s)` : 'None set'],
              ['Visibility', VISIBILITY.find((v) => v.value === visibility)?.label ?? visibility],
              ['Joining', JOIN_POLICY.find((v) => v.value === joinPolicy)?.label ?? joinPolicy],
            ].map(([label, value]) => (
              <div key={label} className="px-4 py-3">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 whitespace-pre-line text-ui">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Not a formality. Somebody is about to become responsible for a space where
              people describe their families, and the moment to understand that is before it
              exists rather than the first time something goes wrong in it. */}
          <Card>
            <CardBody>
              <h3 className="heading text-base">What you are taking on</h3>
              <p className="mt-2 text-ui leading-relaxed text-muted">
                Creating a community means helping keep it a respectful and safe space. You
                will decide who joins, and you will be the person people look to when a
                conversation goes wrong.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                <li>· People here may be describing their families. Treat that as told in confidence.</li>
                <li>· Disagreement is fine. Harassment, threats and targeting anyone are not.</li>
                <li>· Report anything that breaks the platform rules — moderators, not you, decide those.</li>
              </ul>

              <label className="focus-within:ring-accent mt-5 flex cursor-pointer items-start gap-3 rounded-card border border-line-strong px-4 py-3">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="focus-ring mt-0.5 h-5 w-5 shrink-0 rounded-sm border-line-strong accent-[hsl(var(--accent))]"
                />
                <span className="text-ui leading-relaxed">
                  I understand that I am responsible for keeping this community respectful and
                  safe.
                </span>
              </label>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
        {step > 0 && <Button type="button" variant="ghost" onClick={() => { setErrors({}); setStep((s) => s - 1); }} disabled={busy}>Back</Button>}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} className="sm:ml-auto">Continue</Button>
        ) : (
          <Button type="button" onClick={() => void submit()} loading={busy} disabled={busy || !accepted} className="sm:ml-auto">
            {busy ? 'Creating…' : 'Create community'}
          </Button>
        )}
      </div>
    </div>
  );
}
