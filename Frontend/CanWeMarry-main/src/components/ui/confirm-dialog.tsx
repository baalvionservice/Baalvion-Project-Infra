'use client';

import { useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Used for anything a person cannot take back — deleting a case, withdrawing consent,
 * removing a supporter. The description says what will actually happen rather than asking
 * "are you sure?", because the second question is unanswerable without the first.
 */
export function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={confirm} loading={busy} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">This cannot be undone.</p>
    </Modal>
  );
}
