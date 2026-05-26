import { Badge } from '@/components/ui/badge';

type StatusType =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending'
  | 'draft'
  | 'published'
  | 'archived'
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'captured'
  | 'failed'
  | 'refunded'
  | string;

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  healthy: { label: 'Healthy', variant: 'success' },
  published: { label: 'Published', variant: 'success' },
  captured: { label: 'Captured', variant: 'success' },
  processed: { label: 'Processed', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'warning' },
  degraded: { label: 'Degraded', variant: 'warning' },
  scheduled: { label: 'Scheduled', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'destructive' },
  down: { label: 'Down', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'outline' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase()] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: 'outline' as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
