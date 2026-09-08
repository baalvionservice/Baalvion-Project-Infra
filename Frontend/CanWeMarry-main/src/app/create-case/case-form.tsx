'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button, Card, CardBody, ErrorState, Field, Input, Select, Textarea, VisibilityBadge, useToast,
} from '@/components/ui';
import { cases } from '@/lib/api';
import type { Community } from '@/lib/api/types';
import { cn } from '@/components/ui/cn';
import '@/lib/auth/session';

const SUPPORT_NEEDS = [
  { value: 'LISTENING', label: 'Someone to listen' },
  { value: 'MEDIATION', label: 'Help with mediation' },
  { value: 'LEGAL', label: 'Legal information' },
  { value: 'COUNSELLING', label: 'Counselling' },
  { value: 'COMMUNITY', label: 'Community support' },
  { value: 'PRACTICAL', label: 'Practical help' },
  { value: 'OTHER', label: 'Something else' },
] as const;

const VISIBILITY = [
  {
    value: 'PRIVATE' as const,
    title: 'Private',
    who: 'Only you, and anyone you invite who accepts.',
    detail: 'It does not appear in any list, search or count for anyone else. This is where every case starts.',
  },
  {
    value: 'COMMUNITY' as const,
    title: 'Community',
    who: 'Active members of one community you belong to.',
    detail: 'You have to be a member of that community yourself. Members see your summary — the fuller story stays with the people taking part.',
  },
];

const STEPS = ['Your situation', 'Your story', 'What would help', 'Privacy', 'Review'] as const;

/**
 * The confirmations required before a case is opened.
 *
 * These gate OPENING a case, not saving a draft — someone still writing should never be
 * asked to sign anything. Each one names a specific thing people get wrong: not knowing who
 * can see it, including more than they meant to, expecting support to be owed to them, and
 * using a case to build a case against a relative.
 */
const CONFIRMATIONS = [
  { id: 'audience', label: 'I understand who can see this case.' },
  { id: 'content', label: 'I am sharing only information I am comfortable making available.' },
  { id: 'voluntary', label: 'I understand that support here is voluntary.' },
  { id: 'conduct', label: 'I will not use this platform to threaten, harass, or target anyone.' },
] as const;

interface Draft {
  title: string;
  summary: string;
  situation: string;
  countryCode: string;
  region: string;
  supportNeeded: string[];
  visibility: 'PRIVATE' | 'COMMUNITY';
  communityId: string;
  allowSupporterRequests: boolean;
}

const EMPTY: Draft = {
  title: '', summary: '', situation: '', countryCode: '', region: '',
  supportNeeded: [], visibility: 'PRIVATE', communityId: '', allowSupporterRequests: true,
};

/**
 * Opening a case, in five steps.
 *
 * Two behaviours matter more than the layout:
 *
 *  - Nothing is published as a side effect. Both buttons at the end save a DRAFT; opening
 *    the case is a separate, explicitly labelled action taken afterwards from the case
 *    itself. A person part-way through writing about their family should never discover
 *    they have published it.
 *  - Step validation is local and advisory. The service's Zod schemas are the real rules,
 *    and their field errors are surfaced verbatim — so the messages a person sees are the
 *    ones the server actually applied, not a client-side approximation that can drift.
 */
export function CaseForm({ communities }: { communities: Community[] }) {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const allConfirmed = CONFIRMATIONS.every((c) => confirmed.includes(c.id));

  const toggleNeed = (value: string) =>
    setDraft((d) => ({
      ...d,
      supportNeeded: d.supportNeeded.includes(value)
        ? d.supportNeeded.filter((v) => v !== value)
        : [...d.supportNeeded, value],
    }));

  // Advisory only — enough to stop someone walking past an empty required field.
  function stepErrors(index: number): Record<string, string[]> {
    const e: Record<string, string[]> = {};
    if (index === 0 && !draft.title.trim()) e.title = ['Give this a short title so you can find it again.'];
    if (index === 1 && !draft.summary.trim()) e.summary = ['A few sentences is enough to start.'];
    if (index === 3 && draft.visibility === 'COMMUNITY' && !draft.communityId) {
      e.communityId = ['Choose the community this case is scoped to.'];
    }
    return e;
  }

  function next() {
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length === 0) { setStep((s) => Math.min(s + 1, STEPS.length - 1)); window.scrollTo(0, 0); }
  }

  function back() { setErrors({}); setStep((s) => Math.max(s - 1, 0)); window.scrollTo(0, 0); }

  async function saveDraft(thenOpen: boolean) {
    setSubmitting(true); setErrors({}); setFormError(null);

    const result = await cases.create({
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      situation: draft.situation.trim() || undefined,
      supportNeeded: draft.supportNeeded,
      visibility: draft.visibility,
      communityId: draft.visibility === 'COMMUNITY' ? draft.communityId : undefined,
      countryCode: draft.countryCode.trim() || undefined,
      region: draft.region.trim() || undefined,
      allowSupporterRequests: draft.allowSupporterRequests,
      status: 'DRAFT',
    });

    if (!result.ok) {
      setSubmitting(false);
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) setFormError(result.error.message);
      // Send the person back to the step that owns the failing field.
      const bad = Object.keys(result.error.details ?? {})[0];
      if (bad === 'title') setStep(0);
      else if (bad === 'summary' || bad === 'situation') setStep(1);
      else if (bad === 'supportNeeded') setStep(2);
      else if (bad === 'visibility' || bad === 'communityId') setStep(3);
      return;
    }

    if (!thenOpen) {
      setSubmitting(false);
      toast.success('Saved as a private draft. Nobody else can see it.');
      router.push(`/cases/${result.data.id}`);
      return;
    }

    // Opening is a second, deliberate call — never a side effect of saving.
    const opened = await cases.update(result.data.id, { status: 'OPEN' });
    setSubmitting(false);
    if (!opened.ok) {
      toast.error(`Saved as a draft, but could not open it: ${opened.error.message}`);
    } else {
      toast.success('Your case is open.');
    }
    router.push(`/cases/${result.data.id}`);
  }

  return (
    <div>
      {/* ── Progress ───────────────────────────────────────────────────── */}
      <nav aria-label="Progress" className="mb-8">
        <p className="text-sm text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        <ol className="mt-3 flex gap-1.5" role="list">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <span
                aria-current={i === step ? 'step' : undefined}
                className={cn('block h-1.5 rounded-full', i <= step ? 'bg-accent' : 'bg-surface-2')}
              />
              <span className="sr-only">{label}{i < step ? ' (completed)' : i === step ? ' (current)' : ''}</span>
            </li>
          ))}
        </ol>
      </nav>

      {formError && <ErrorState title="Could not save this case" message={formError} className="mb-6" />}

      {/* ── Step 1 — situation ─────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <Field label="What would you call this situation?" required error={errors.title?.[0]}
            hint="A short title for your own reference. You can change it later.">
            {({ id, describedBy, invalid }) => (
              <Input id={id} value={draft.title} maxLength={140} onChange={(e) => set('title', e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" error={errors.countryCode?.[0]} hint="Two-letter code, e.g. IN or GB. Helps find local help.">
              {({ id, describedBy, invalid }) => (
                <Input id={id} value={draft.countryCode} maxLength={2} onChange={(e) => set('countryCode', e.target.value.toUpperCase())}
                  aria-describedby={describedBy} invalid={invalid} className="uppercase" />
              )}
            </Field>
            <Field label="Region or city" error={errors.region?.[0]}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} value={draft.region} maxLength={120} onChange={(e) => set('region', e.target.value)}
                  aria-describedby={describedBy} invalid={invalid} />
              )}
            </Field>
          </div>
        </div>
      )}

      {/* ── Step 2 — story ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <Field label="In a few sentences, what is happening?" required error={errors.summary?.[0]}
            hint="Share only what you are comfortable making available to whoever you later decide can see this. Keep it to the shape of the situation.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={4} maxLength={600} value={draft.summary}
                onChange={(e) => set('summary', e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Field label="The fuller story" error={errors.situation?.[0]}
            hint="Only ever shown to people taking part in the case — never to visitors, even if you make the case public.">
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={12} maxLength={8000} value={draft.situation}
                onChange={(e) => set('situation', e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>

          <Card>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">
                Please do not include names, addresses, phone numbers or photographs of people who
                have not agreed to appear here. If you want someone in the case, invite them once it
                is saved — they decide for themselves, and until they accept nobody can tell who they
                are.
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Step 3 — support ───────────────────────────────────────────── */}
      {step === 2 && (
        <fieldset>
          <legend className="heading text-lg">What kind of support would help?</legend>
          <p className="mt-1 text-sm text-muted">Choose as many as apply, or none for now.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUPPORT_NEEDS.map((need) => {
              const on = draft.supportNeeded.includes(need.value);
              return (
                <button key={need.value} type="button" aria-pressed={on} onClick={() => toggleNeed(need.value)}
                  className={cn(
                    'focus-ring inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors',
                    on ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                       : 'border-line-strong bg-surface text-muted hover:text-foreground',
                  )}>
                  {need.label}
                </button>
              );
            })}
          </div>

          <label className="mt-8 flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={draft.allowSupporterRequests}
              onChange={(e) => set('allowSupporterRequests', e.target.checked)}
              className="focus-ring mt-1 h-4 w-4 rounded border-line-strong" />
            <span>
              <span className="block text-sm font-medium">Let members offer to support this case</span>
              <span className="block text-sm text-muted">
                An offer is a request — you decide whether to accept it. You can turn this off at any time.
              </span>
            </span>
          </label>
        </fieldset>
      )}

      {/* ── Step 4 — privacy ───────────────────────────────────────────── */}
      {step === 3 && (
        <fieldset className="space-y-4">
          <legend className="heading text-lg">Who should be able to see this?</legend>
          <p className="mt-1 text-sm text-muted">
            You can change this whenever you want. Making a case visible to the whole site is a
            separate step, available only where the platform has moderation cover.
          </p>

          {VISIBILITY.map((v) => (
            <label key={v.value}
              className={cn(
                'flex cursor-pointer gap-4 rounded-card border p-4 transition-colors',
                draft.visibility === v.value ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface hover:border-line-strong',
              )}>
              <input type="radio" name="visibility" value={v.value} checked={draft.visibility === v.value}
                onChange={() => set('visibility', v.value)} className="focus-ring mt-1 h-4 w-4" />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-medium">{v.title}</span>
                  <VisibilityBadge visibility={v.value} />
                </span>
                <span className="mt-1 block text-sm font-medium text-foreground">{v.who}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{v.detail}</span>
              </span>
            </label>
          ))}

          {draft.visibility === 'COMMUNITY' && (
            <Field label="Which community?" required error={errors.communityId?.[0]}
              hint={communities.length === 0 ? 'You are not an active member of any community yet. Join one first, or keep this case private.' : undefined}>
              {({ id, describedBy, invalid }) => (
                <Select id={id} value={draft.communityId} onChange={(e) => set('communityId', e.target.value)}
                  placeholder="Choose a community" aria-describedby={describedBy} invalid={invalid}
                  disabled={communities.length === 0}
                  options={communities.map((cm) => ({ value: cm.id, label: cm.name }))} />
              )}
            </Field>
          )}
        </fieldset>
      )}

      {/* ── Step 5 — review ────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="heading text-lg">Review</h2>

          <dl className="divide-y divide-line rounded-card border border-line bg-surface">
            <div className="px-4 py-3">
              <dt className="text-sm text-muted">Title</dt>
              <dd className="mt-1 font-medium">{draft.title || <span className="text-muted-2">Not set</span>}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-sm text-muted">Summary</dt>
              <dd className="mt-1 whitespace-pre-line text-ui leading-relaxed">{draft.summary || <span className="text-muted-2">Not set</span>}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-sm text-muted">Fuller story</dt>
              <dd className="mt-1 text-ui text-muted">
                {draft.situation ? `${draft.situation.trim().split(/\s+/).length} words` : 'Not written yet'}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-sm text-muted">Support asked for</dt>
              <dd className="mt-1 text-ui">
                {draft.supportNeeded.length
                  ? SUPPORT_NEEDS.filter((n) => draft.supportNeeded.includes(n.value)).map((n) => n.label).join(', ')
                  : <span className="text-muted-2">None chosen</span>}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-sm text-muted">Who can see it</dt>
              <dd className="mt-1 flex items-center gap-2">
                <VisibilityBadge visibility={draft.visibility} />
                <span className="text-ui">
                  {VISIBILITY.find((v) => v.value === draft.visibility)?.who}
                </span>
              </dd>
            </div>
          </dl>

          <Card>
            <CardBody>
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Saving a draft asks nothing of you.</span>{' '}
                <span className="text-muted">
                  A draft is visible to nobody — not to moderators, not to anyone you have
                  invited. You can come back to it whenever you like.
                </span>
              </p>
            </CardBody>
          </Card>

          <fieldset className="rounded-card border border-line bg-surface p-5">
            <legend className="px-1 font-display text-base font-semibold">Before you publish</legend>
            <p className="mt-1 text-sm text-muted">
              Only needed if you are opening the case now. Saving a draft does not require these.
            </p>
            <ul className="mt-4 space-y-3">
              {CONFIRMATIONS.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={confirmed.includes(c.id)}
                      onChange={(e) =>
                        setConfirmed((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))
                      }
                      className="focus-ring mt-1 h-4 w-4 rounded border-line-strong"
                    />
                    <span className="text-ui leading-relaxed">{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {!allConfirmed && (
              <p className="mt-4 text-sm text-muted-2">
                Tick all four to open the case, or save it as a draft and decide later.
              </p>
            )}
          </fieldset>
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
        {step > 0 && <Button type="button" variant="ghost" onClick={back} disabled={submitting}>Back</Button>}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} className="sm:ml-auto">Continue</Button>
        ) : (
          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => void saveDraft(false)} loading={submitting} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save as a draft'}
            </Button>
            <Button
              type="button"
              onClick={() => void saveDraft(true)}
              loading={submitting} disabled={submitting || !allConfirmed}
              title={allConfirmed ? undefined : 'Tick all four confirmations to open the case'}
            >
              {submitting ? 'Saving…' : 'Open the case'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
