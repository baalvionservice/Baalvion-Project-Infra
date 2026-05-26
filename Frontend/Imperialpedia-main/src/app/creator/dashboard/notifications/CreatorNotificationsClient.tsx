'use client';

import React, { useState } from 'react';
import { Notification, NotificationType } from '@/modules/content-engine/types/article';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  UserPlus, 
  MessageSquare, 
  Megaphone, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  ArrowRight,
  MoreVertical,
  Check,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface CreatorNotificationsClientProps {
  initialNotifications: Notification[];
}

/**
 * Interactive notification hub for creators.
 * Handles social engagement alerts, platform news, and editorial status.
 */
export function CreatorNotificationsClient({ initialNotifications }: CreatorNotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'follower': return <UserPlus className="h-5 w-5 text-secondary" />;
      case 'engagement': return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'announcement': return <Megaphone className="h-5 w-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRelatedLink = (notif: Notification) => {
    if (!notif.relatedId) return '#';
    if (notif.type === 'follower') return `/creator/${notif.relatedId}`;
    if (notif.type === 'engagement') return `/articles/${notif.relatedId}`; // Assumes relatedId is article slug
    return '#';
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Bell className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Expert Updates</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Activity Feed</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Stay synchronized with your audience and the Intelligence Index.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-10 rounded-xl text-muted-foreground hover:text-destructive" onClick={clearAll}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All
          </Button>
        </div>
      </header>

      {notifications.length > 0 ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {notifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={cn(
                "glass-card transition-all duration-300 relative group overflow-hidden border-white/5",
                !notif.read ? "border-primary/30 bg-primary/5 shadow-lg shadow-primary/5" : "opacity-70 hover:opacity-100"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "p-3 rounded-2xl shrink-0",
                    notif.type === 'follower' ? "bg-secondary/10" :
                    notif.type === 'engagement' ? "bg-primary/10" :
                    notif.type === 'announcement' ? "bg-amber-500/10" : "bg-emerald-500/10"
                  )}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-white/10 bg-black/20">
                          {notif.type}
                        </Badge>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" />
                          {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notif.read && (
                              <DropdownMenuItem onClick={() => markAsRead(notif.id)}>
                                <Check className="mr-2 h-4 w-4" /> Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteNotification(notif.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Text variant="bodySmall" className={cn(
                      "leading-relaxed",
                      !notif.read ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {notif.message}
                    </Text>

                    {notif.relatedId && (
                      <div className="pt-2">
                        <Button variant="link" className="p-0 h-auto text-primary text-xs font-bold group/link" asChild>
                          <Link href={getRelatedLink(notif)}>
                            View related intelligence <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-card/10 rounded-[3rem] border-2 border-dashed border-white/5 max-w-4xl mx-auto">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <Text variant="h3" className="mb-2">Your feed is clear</Text>
          <Text variant="bodySmall" className="text-muted-foreground">
            We'll notify you here when your intelligence generates impact.
          </Text>
        </div>
      )}

      {/* Info Card */}
      <Card className="max-w-4xl mx-auto glass-card bg-secondary/5 border-secondary/20 p-8">
        <div className="flex items-start gap-6">
          <div className="p-4 rounded-3xl bg-secondary/10">
            <Megaphone className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <Text variant="h3" className="mb-2">Announcement Engine</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Imperialpedia uses this activity feed to keep experts informed about platform-wide updates, new pSEO taxonomies, and strategic intelligence priorities. Keep your notifications active to never miss a growth opportunity.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
