'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bell, FileText, ScrollText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function NotificationsPage() {
  const { setBreadcrumbs } = useUIStore();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => notificationsApi.templates.list().then((r) => r.data.data),
  });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications' }]);
  }, [setBreadcrumbs]);

  const channelColors: Record<string, string> = {
    email: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    push: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    sms: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    in_app: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Manage notification templates and delivery logs"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications/logs">
                <ScrollText className="mr-2 h-4 w-4" />
                Delivery Logs
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
          : templates?.map((tpl) => (
              <Card key={tpl.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium">{tpl.name}</CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${channelColors[tpl.channel] ?? ''}`}
                    >
                      {tpl.channel.replace('_', ' ')}
                    </span>
                  </div>
                  <code className="text-xs text-muted-foreground">{tpl.key}</code>
                </CardHeader>
                <CardContent>
                  {tpl.subject && (
                    <p className="text-xs text-muted-foreground mb-2 truncate">{tpl.subject}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tpl.variables.map((v) => (
                      <code key={v} className="text-[10px] bg-muted px-1 py-0.5 rounded">{`{{${v}}}`}</code>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={tpl.isActive ? 'success' : 'secondary'} className="text-xs">
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
