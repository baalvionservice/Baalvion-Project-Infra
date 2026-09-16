import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { CONTROL_BASE } from './input';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

/**
 * A native select rather than a custom listbox. It is keyboard-accessible everywhere for
 * free, and on a phone it opens the platform picker — which matters more than matching a
 * design language exactly.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, invalid, className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL_BASE, 'h-11 pr-8', invalid ? 'border-danger' : 'border-line-strong', className)}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
});
