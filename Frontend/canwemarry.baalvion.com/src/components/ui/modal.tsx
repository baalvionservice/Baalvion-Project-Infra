'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Built on the native <dialog> element, so focus trapping, the top layer and Escape are
 * the browser's job rather than ours. The one thing that still needs handling is the
 * `cancel` event, which fires on Escape and would otherwise close the dialog without the
 * parent's state ever learning about it.
 */
export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // A generated id, not a fixed one. A page can hold several dialogs at once — all closed
  // but one — and a hardcoded id made every aria-labelledby resolve to the FIRST title in
  // the document, so every dialog announced the wrong name.
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'w-[min(32rem,calc(100vw-2rem))] rounded-card border border-line bg-ground p-0 text-foreground shadow-lift',
        'backdrop:bg-foreground/40',
        className,
      )}
    >
      <div className="border-b border-line px-5 py-4">
        <h2 id={titleId} className="heading text-lg">{title}</h2>
        {description && <p id={descriptionId} className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
    </dialog>
  );
}
