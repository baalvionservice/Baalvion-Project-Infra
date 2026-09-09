import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export const CONTROL_BASE =
  'focus-ring w-full rounded-md border bg-ground px-3 text-foreground placeholder:text-muted-2 ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, 'h-11', invalid ? 'border-danger' : 'border-line-strong', className)}
      {...props}
    />
  );
});
