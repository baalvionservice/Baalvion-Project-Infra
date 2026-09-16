import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-strong border border-transparent',
  secondary: 'bg-surface text-foreground border border-line-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-surface-2',
  // Reserved for irreversible acts — deleting a case, withdrawing consent. Not for emphasis.
  danger: 'bg-transparent text-danger border border-danger/40 hover:bg-danger/10',
};

const SIZES: Record<Size, string> = {
  // 44px on the default size — the tap-target guideline — and 40px even on `sm`, because a
  // secondary action on a phone is still pressed with a thumb. A measured sweep at 390px
  // found the old 36px small button among the things people would miss.
  sm: 'h-10 px-3 text-sm',
  md: 'h-11 px-4 text-ui',
  lg: 'h-12 px-6 text-base',
};

const BASE =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ' +
  'disabled:pointer-events-none disabled:opacity-50';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Shows a spinner and blocks the button while a request is in flight. */
  loading?: boolean;
}

/**
 * The spinner is the one animation in the design system that runs continuously, and it is
 * here because a button that looks idle while a request is in flight gets pressed twice.
 * `prefers-reduced-motion` flattens it to a static ring via globals.css; the disabled state
 * and the aria-busy announcement carry the meaning either way.
 */
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, className, type = 'button', disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Same appearance as Button, but a real anchor — so it is navigable and openable in a new tab. */
export function ButtonLink({ href, variant = 'primary', size = 'md', fullWidth, className, children }: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}>
      {children}
    </Link>
  );
}
