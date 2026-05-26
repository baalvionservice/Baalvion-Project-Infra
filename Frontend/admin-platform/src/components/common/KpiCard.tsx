import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatNumber, formatCurrency } from '@/lib/utils/format';

interface KpiCardProps {
  title: string;
  value: number | string;
  change?: number;
  format?: 'number' | 'currency' | 'percent' | 'raw';
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  description?: string;
}

export default function KpiCard({
  title,
  value,
  change,
  format = 'number',
  icon: Icon,
  iconColor = 'text-primary',
  isLoading = false,
  description,
}: KpiCardProps) {
  const formattedValue =
    isLoading
      ? ''
      : typeof value === 'number'
      ? format === 'currency'
        ? formatCurrency(value)
        : format === 'percent'
        ? `${value.toFixed(1)}%`
        : format === 'number'
        ? formatNumber(value)
        : value
      : value;

  const isPositive = change != null && change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1 truncate">{formattedValue}</p>
            )}
            {change != null && !isLoading && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-1 text-xs',
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                )}
              >
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                {description && <span className="text-muted-foreground ml-1">{description}</span>}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10',
            )}
          >
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
