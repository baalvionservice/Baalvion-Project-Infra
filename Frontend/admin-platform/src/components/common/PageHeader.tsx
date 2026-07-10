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
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {titleAdornment}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
