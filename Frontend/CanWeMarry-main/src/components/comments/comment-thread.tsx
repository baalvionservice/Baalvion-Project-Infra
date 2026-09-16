'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar, Button, ConfirmDialog, EmptyState, ErrorState, LoadingState,
  RelativeTime, Textarea, useToast,
} from '@/components/ui';
import { comments as commentsApi } from '@/lib/api';
import { useIdentity } from '@/lib/auth/identity-context';
import type { Comment } from '@/lib/api/types';
import { ReportDialog } from '@/components/cases/report-dialog';

interface CommentThreadProps {
  targetType: 'CASE' | 'POST';
  targetId: string;
  /** False when the server says this reader may read but not write here. */
  canComment: boolean;
  /** Explains why, when they cannot. */
  cannotCommentReason?: string;
}

/**
 * The discussion on a case or a post.
 *
 * Bodies are rendered as TEXT, never as HTML — `{c.body}` in JSX escapes by construction,
 * and the service also entity-escapes on the way in. Neither layer is relied on alone.
 *
 * Replies are one level deep on purpose. Deeper nesting is unreadable on a 320px screen,
 * and a support conversation does not benefit from branching the way a debate does.
 */
export function CommentThread({ targetType, targetId, canComment, cannotCommentReason }: CommentThreadProps) {
  const { identity } = useIdentity();
  const router = useRouter();
  const toast = useToast();

  const [items, setItems] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await commentsApi.list({ targetType, targetId, pageSize: 100 });
    if (!result.ok) { setError(result.error.message); setItems([]); return; }
    setError(null);
    setItems(result.data);
  }, [targetType, targetId]);

  useEffect(() => { void load(); }, [load]);

  async function post(text: string, parentId?: string) {
    if (!text.trim()) return;
    setBusy(true);
    const result = await commentsApi.create({ targetType, targetId, parentId, body: text.trim() });
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    setBody(''); setReplyBody(''); setReplyTo(null);
    await load();
    // The comment COUNT lives on the server-rendered header above this component, so the
    // thread reloading on its own would leave the two disagreeing.
    router.refresh();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const result = await commentsApi.update(id, editBody.trim());
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    setBusy(true);
    const result = await commentsApi.remove(id);
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    toast.success('Comment deleted.');
    await load();
    router.refresh();
  }

  if (items === null) return <LoadingState label="Loading the discussion" rows={2} />;
  if (error) return <ErrorState message={error} action={<Button variant="secondary" onClick={() => void load()}>Try again</Button>} />;

  const roots = items.filter((c) => !c.parentId);
  const repliesOf = (id: string) => items.filter((c) => c.parentId === id);

  const renderComment = (c: Comment, isReply: boolean) => {
    const isAuthor = identity?.userId === c.authorId;
    return (
      <li key={c.id} className={isReply ? 'ml-4 border-l-2 border-line pl-4 sm:ml-6 sm:pl-5' : ''}>
        <article className="py-3">
          <div className="flex items-start gap-3">
            <Avatar name={isAuthor ? 'You' : null} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{isAuthor ? 'You' : 'A member'}</span>
                <span className="text-muted-2"> · <RelativeTime value={c.createdAt} /></span>
                {c.updatedAt !== c.createdAt && <span className="text-muted-2"> · edited</span>}
              </p>

              {editing === c.id ? (
                <div className="mt-2 space-y-2">
                  <label htmlFor={`edit-${c.id}`} className="sr-only">Edit your comment</label>
                  <Textarea id={`edit-${c.id}`} rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} maxLength={5000} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveEdit(c.id)} disabled={busy}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-line text-ui leading-relaxed">{c.body}</p>
              )}

              {editing !== c.id && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {canComment && !isReply && (
                    <button type="button" onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(''); }}
                      className="focus-ring rounded-sm text-muted hover:text-foreground">
                      Reply
                    </button>
                  )}
                  {isAuthor && (
                    <>
                      <button type="button" onClick={() => { setEditing(c.id); setEditBody(c.body); }}
                        className="focus-ring rounded-sm text-muted hover:text-foreground">Edit</button>
                      <button type="button" onClick={() => setConfirmDelete(c.id)}
                        className="focus-ring rounded-sm text-muted hover:text-danger">Delete</button>
                    </>
                  )}
                  {identity && !isAuthor && (
                    <button type="button" onClick={() => setReporting(c.id)}
                      className="focus-ring rounded-sm text-muted hover:text-foreground">Report</button>
                  )}
                </div>
              )}

              {replyTo === c.id && (
                <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); void post(replyBody, c.id); }}>
                  <label htmlFor={`reply-${c.id}`} className="sr-only">Write a reply</label>
                  <Textarea id={`reply-${c.id}`} rows={3} value={replyBody} maxLength={5000}
                    onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply" />
                  <div className="flex gap-2">
                    <Button size="sm" type="submit" disabled={busy || !replyBody.trim()}>Post reply</Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => setReplyTo(null)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </article>
      </li>
    );
  };

  return (
    <div>
      {canComment ? (
        <form className="mb-6 space-y-3" onSubmit={(e) => { e.preventDefault(); void post(body); }}>
          <label htmlFor="new-comment" className="block text-sm font-medium">Add to the discussion</label>
          <Textarea
            id="new-comment" rows={4} maxLength={5000} value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share what you know, or what helped you. Advice lands better than instructions."
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-muted-2">
              Please don&rsquo;t share anyone&rsquo;s contact details or threaten anyone. Don&rsquo;t
              name people who have not agreed to appear here.
            </p>
            <Button type="submit" loading={busy} disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post'}</Button>
          </div>
        </form>
      ) : (
        <p className="mb-6 rounded-md border border-dashed border-line-strong px-4 py-3 text-sm text-muted">
          {cannotCommentReason ?? 'Only people taking part in this case can comment on it.'}
        </p>
      )}

      {roots.length === 0 ? (
        <EmptyState title="No comments yet" description={canComment ? 'Be the first to say something useful.' : undefined} />
      ) : (
        <ul className="divide-y divide-line">
          {roots.map((c) => (
            <li key={c.id}>
              <ul className="list-none">
                {renderComment(c, false)}
                {repliesOf(c.id).map((r) => renderComment(r, true))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this comment?"
        description="It will be removed from the discussion for everyone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { const id = confirmDelete!; setConfirmDelete(null); await remove(id); }}
      />

      {reporting && (
        <ReportDialog
          open
          onClose={() => setReporting(null)}
          targetType="COMMENT"
          targetId={reporting}
          targetLabel="comment"
        />
      )}
    </div>
  );
}
