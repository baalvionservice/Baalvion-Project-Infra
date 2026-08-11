'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/design-system/typography/text';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';
import { useAppStore } from '@/lib/state/app-store';
import { format } from 'date-fns';

export default function WriterNotificationsPage() {
  const { notifications, markNotificationAsRead } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header>
        <Text variant="h1" as="h1" className="text-3xl font-bold">Updates & Alerts</Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          Stay informed on your publication status and editorial feedback.
        </Text>
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="py-40 text-center border-2 border-dashed rounded-3xl opacity-50">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <Text variant="h3">No updates yet</Text>
            <Text variant="bodySmall" className="text-muted-foreground">We'll notify you here when your work is processed.</Text>
          </div>
        ) : (
          notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`glass-card transition-all ${!notif.read ? 'border-primary/40 bg-primary/5' : 'opacity-80'}`}
              onClick={() => markNotificationAsRead(notif.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${
                    notif.type === 'success' ? 'bg-emerald-500/10' : 
                    notif.type === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Text variant="bodySmall" weight="bold" className="text-foreground">
                        {notif.type === 'success' ? 'Publication Approved' : 
                         notif.type === 'warning' ? 'Editorial Feedback' : 'Platform Alert'}
                      </Text>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
                      {notif.message}
                    </Text>
                    {!notif.read && (
                      <div className="pt-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
