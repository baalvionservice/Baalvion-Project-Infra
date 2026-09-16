'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ConfirmDialog, Field, Input, Modal, Textarea, useToast } from '@/components/ui';
import { posts } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import { ReportDialog } from '@/components/cases/report-dialog';
import type { Post } from '@/lib/api/types';

/**
 * Editing, deleting and reporting a discussion post.
 *
 * Edit and Delete render only for the author, and the server refuses either from anyone
 * else regardless — the check here decides what to draw, not what is allowed. Deletion is
 * confirmed because it takes the replies with it, which is not obvious from the button.
 */
export function PostActions({ post, communitySlug }: { post: Post; communitySlug: string }) {
  const router = useRouter();
  const toast = useToast();
  const { identity } = useIdentity();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isAuthor = identity?.userId === post.authorId;

  async function save() {
    setBusy(true); setErrors({});
    const result = await posts.update(post.id, { title: title.trim(), body: body.trim() });
    setBusy(false);
    if (!result.ok) {
      setErrors(result.error.details ?? {});
      if (!Object.keys(result.error.details ?? {}).length) toast.error(result.error.message);
      return;
    }
    setEditing(false);
    toast.success('Post updated.');
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const result = await posts.remove(post.id);
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }

    toast.success('Post deleted. Its replies were removed with it.');
    // refresh() BEFORE push(): the router cache still holds the community page with this
    // post in its list, and navigating first would show the reader their own deleted post.
    router.refresh();
    router.push(`/community/${communitySlug}`);
  }

  if (!identity) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3 text-sm">
        {isAuthor && !post.isLocked && (
          <>
            <button type="button" onClick={() => setEditing(true)} className="focus-ring rounded-sm text-muted hover:text-foreground">Edit</button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="focus-ring rounded-sm text-muted hover:text-danger">Delete</button>
          </>
        )}
        {!isAuthor && (
          <button type="button" onClick={() => setReporting(true)} className="focus-ring rounded-sm text-muted hover:text-foreground">Report</button>
        )}
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit your post"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => void save()} loading={busy} disabled={busy || !title.trim() || !body.trim()}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required error={errors.title?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)}
                aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
          <Field label="Post" required error={errors.body?.[0]}>
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} rows={10} maxLength={20000} value={body}
                onChange={(e) => setBody(e.target.value)} aria-describedby={describedBy} invalid={invalid} />
            )}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this post?"
        description="The post and every reply to it will be removed for everyone, and the text cannot be recovered."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { setConfirmDelete(false); await remove(); }}
      />

      <ReportDialog open={reporting} onClose={() => setReporting(false)} targetType="POST" targetId={post.id} targetLabel="post" />
    </>
  );
}
