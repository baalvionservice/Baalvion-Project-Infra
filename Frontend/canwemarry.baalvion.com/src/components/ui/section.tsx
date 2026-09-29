import type { ReactNode } from 'react';
import { cn } from './cn';

export interface SectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
  /** Heading level. Defaults to h2; use h3 inside an existing section. */
  as?: 'h2' | 'h3';
}

/** A titled block. Exists so heading order stays correct without every page rebuilding it. */
export function Section({ title, description, action, children, id, className, as: Heading = 'h2' }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading className={cn('heading', Heading === 'h2' ? 'text-xl' : 'text-lg')}>{title}</Heading>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
