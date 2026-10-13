'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Smartphone, MessageSquare, Bell, Webhook } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationPrefsApi, type NotificationChannel } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';

const CHANNELS: { key: NotificationChannel; label: string; hint: string; icon: typeof Mail }[] = [
  { key: 'email', label: 'Email', hint: 'Invitations, access changes and account notices', icon: Mail },
  { key: 'inapp', label: 'In the console', hint: 'The bell in the top bar', icon: Bell },
  { key: 'push', label: 'Push notifications', hint: 'On devices where you have allowed them', icon: Smartphone },
  { key: 'sms', label: 'Text message', hint: 'Urgent security alerts only', icon: MessageSquare },
  { key: 'webhook', label: 'Webhooks', hint: 'Delivery to your own systems', icon: Webhook },
];

export default function NotificationSettingsPage() {
  const qc = useQueryClient();
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  useEffect(() => { setBreadcrumbs([{ label: 'Settings', href: '/settings' }, { label: 'Notifications' }]); }, [setBreadcrumbs]);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['notification-prefs'], queryFn: notificationPrefsApi.get });
  const save = useMutation({
    mutationFn: (u: Partial<Record<NotificationChannel, boolean>>) => notificationPrefsApi.set(u),
    // Flip immediately, roll back if the server says no — a switch must never lie about what is saved.
    onMutate: async (u) => {
      await qc.cancelQueries({ queryKey: ['notification-prefs'] });
      const prev = qc.getQueryData<Record<NotificationChannel, boolean>>(['notification-prefs']);
      if (prev) qc.setQueryData(['notification-prefs'], { ...prev, ...u });
      return { prev };
    },
    onError: (_e, _u, ctx) => { if (ctx?.prev) qc.setQueryData(['notification-prefs'], ctx.prev); toast.error('Could not save that change'); },
    onSuccess: (fresh) => { qc.setQueryData(['notification-prefs'], fresh); toast.success('Saved'); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Choose which channels Baalvion may use to reach you. Security-critical messages such as sign-in codes are always delivered." />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Channels</CardTitle>
          <CardDescription className="text-xs">Changes apply immediately.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : isError || !data ? (
            <div className="p-6 text-sm text-muted-foreground">
              Preferences could not be loaded. <button className="text-primary underline" onClick={() => refetch()}>Try again</button>
            </div>
          ) : CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <c.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.hint}</p>
                </div>
              </div>
              <Switch aria-label={c.label} checked={data[c.key] !== false} disabled={save.isPending} onCheckedChange={(v) => save.mutate({ [c.key]: v })} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
