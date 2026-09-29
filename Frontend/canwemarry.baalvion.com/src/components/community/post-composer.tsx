'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Textarea, useToast } from '@/components/ui';
import { posts } from '@/lib/api';
import '@/lib/auth/session';

/** Starting a discussion in a community. Members only — the server enforces it. */
export function PostComposer({ communityId }: { communityId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true); setErrors({});
    const result = await posts.create({ communityId, title: title.trim(), body: body.trim() });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    setTitle(''); setBody(''); setOpen(false);
    toast.success('Posted.');
    router.refresh();
  }

  if (!open) {
    return <Button variant="secondary" onClick={() => setOpen(true)}>Start a discussion</Button>;
  }

  return (
    <form className="space-y-4 rounded-card border border-line bg-surface p-5"
      onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <p className="rounded-md border border-line bg-ground px-3 py-2 text-sm leading-relaxed text-muted">
        Ask a question, share an experience, or offer constructive support. What helps most here
        is what actually happened when you tried something — not what someone else ought to do.
      </p>

      <Field label="Title" required error={errors.title?.[0]}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)}
            aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>
      <Field label="What would you like to discuss?" required error={errors.body?.[0]}>
        {({ id, describedBy, invalid }) => (
          <Textarea id={id} rows={6} maxLength={20000} value={body}
            onChange={(e) => setBody(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={busy} disabled={busy || !title.trim() || !body.trim()}>{busy ? 'Posting…' : 'Post'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <p className="w-full text-xs leading-relaxed text-muted-2 sm:w-auto sm:flex-1">
          Posts are visible to this community&rsquo;s members. Please leave out addresses, phone
          numbers and anything that identifies someone who has not agreed to appear here.
        </p>
      </div>
    </form>
  );
}
