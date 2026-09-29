import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
