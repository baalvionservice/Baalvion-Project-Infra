import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
  title: string;
  /** Rendered beside the title (e.g. a status badge) — kept outside the h1 to stay valid HTML. */
  titleAdornment?: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, titleAdornment, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {titleAdornment}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}
