import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { CONTROL_BASE } from './input';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 6, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, 'py-2.5 leading-relaxed', invalid ? 'border-danger' : 'border-line-strong', className)}
      {...props}
    />
  );
});
