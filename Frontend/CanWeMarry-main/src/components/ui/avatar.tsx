import { cn } from './cn';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'h-7 w-7 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' } as const;

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase();

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const base = cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2 font-medium text-muted', SIZES[size], className);
  if (src) {
    // A plain <img>, not next/image. The CSP restricts img-src to this origin, so an avatar
    // is always a same-origin asset that needs no remote loader — and running someone's
    // photograph through an optimiser would put a copy of it in a third-party cache.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" aria-hidden="true" className={cn(base, 'object-cover')} />;
  }
  return <span className={base} aria-hidden="true">{name ? initials(name) : '·'}</span>;
}
