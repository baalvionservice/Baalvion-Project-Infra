import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/**
 * Label, hint and error wiring for a single control.
 *
 * Every input on this site goes through here so the aria-describedby and aria-invalid
 * relationships are never forgotten — a form that a screen reader cannot report errors on
 * is unusable for the people most likely to be filling it in under stress.
 */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
        {!required && <span className="ml-2 text-xs font-normal text-muted-2">Optional</span>}
      </label>
      {hint && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} role="alert" className={cn('text-sm text-danger')}>
          {error}
        </p>
      )}
    </div>
  );
}
