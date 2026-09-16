'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, ConfirmDialog, EmptyState, LoadingState, RelativeTime, Textarea, useToast } from '@/components/ui';
import { cases as casesApi } from '@/lib/api';
import type { CaseUpdate } from '@/lib/api/types';

/**
 * Progress notes written by the case owner.
 *
 * Separate from comments because they are a different kind of writing: the owner saying
 * how the situation has moved, rather than a conversation. Supporters are notified when one
 * is posted — they chose to stand with this case, so an update is the thing they signed up
 * for. Nobody else is.
 */
export function CaseUpdates({ caseId, isOwner, isLocked }: { caseId: string; isOwner: boolean; isLocked: boolean }) {
  const toast = useToast();
  const [items, setItems] = useState<CaseUpdate[] | null>(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await casesApi.updates(caseId, { pageSize: 50 });
    setItems(result.ok ? result.data : []);
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    const result = await casesApi.postUpdate(caseId, body.trim());
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    setBody('');
    toast.success('Update posted. The people supporting this case have been told.');
    await load();
  }

  async function remove(id: string) {
    const result = await casesApi.deleteUpdate(caseId, id);
    if (!result.ok) { toast.error(result.error.message); return; }
    await load();
  }

  if (items === null) return <LoadingState label="Loading updates" rows={1} />;

  return (
    <div>
      {isOwner && !isLocked && (
        <form className="mb-6 space-y-3" onSubmit={(e) => { e.preventDefault(); void post(); }}>
          <label htmlFor="new-update" className="block text-sm font-medium">Post an update</label>
          <Textarea
            id="new-update" rows={4} maxLength={4000} value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What has changed since you opened this case?"
          />
          <Button type="submit" loading={busy} disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post update'}</Button>
        </form>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="No updates yet"
          description={isOwner ? 'When something changes, an update tells the people supporting you.' : 'The person who opened this case has not posted an update yet.'}
        />
      ) : (
        <ol className="space-y-4">
          {items.map((u) => (
            <li key={u.id} className="rounded-card border border-line bg-surface p-4">
              <p className="text-xs text-muted-2"><RelativeTime value={u.createdAt} /></p>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{u.body}</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(u.id)}
                  className="focus-ring mt-3 rounded-sm text-xs text-muted hover:text-danger"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this update?"
        description="It will be removed from the case for everyone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => { const id = confirmDelete!; setConfirmDelete(null); await remove(id); }}
      />
    </div>
  );
}
