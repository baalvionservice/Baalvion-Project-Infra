"use client";

import { useEffect, useState } from "react";
import { notificationService } from "@/core/services/notification.service";
import { Notification } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Clock, Filter, Archive, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationManagerPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadNotifs = async () => {
    setIsLoading(true);
    const data = await notificationService.getAllNotifications();
    setNotifications(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifs();
    window.addEventListener('notification-updated', loadNotifs);
    return () => window.removeEventListener('notification-updated', loadNotifs);
  }, []);

  const handleSend = async (id: string) => {
    try {
      await notificationService.sendNotification(id);
      toast({ title: "Distribution Initiated", description: "Broadcast sent to all eligible subscribers." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Send Failed", description: e.message });
    }
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Accessing communication logs...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investor Broadcasts</h1>
          <p className="text-muted-foreground">Manage institutional notifications, auto-alerts, and scheduled distributions.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Broadcast
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notification / Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Target Segments</TableHead>
                <TableHead>Delivery Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg mt-1">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.moduleSource} / {notif.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={notif.status === 'Sent' ? 'default' : 'secondary'}>
                      {notif.status === 'Sent' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {notif.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {notif.targetRoles.map(role => (
                        <Badge key={role} variant="outline" className="text-[8px] px-1">{role}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {notif.deliveryStats ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>{notif.deliveryStats.deliveredCount} Delivered</span>
                          <span className="text-muted-foreground">{notif.sentAt ? new Date(notif.sentAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '100%' }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending Send</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {notif.status === 'Draft' && (
                        <Button size="sm" onClick={() => handleSend(notif.id)}>
                          <Send className="h-3 w-3 mr-1" /> Send Now
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Filter className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
