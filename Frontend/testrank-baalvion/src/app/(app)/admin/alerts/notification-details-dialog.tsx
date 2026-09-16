
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NotificationWithDetails } from './page';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reply, Forward, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface NotificationDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  notification: NotificationWithDetails | null;
}

export function NotificationDetailsDialog({ isOpen, onOpenChange, notification }: NotificationDetailsDialogProps) {
  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
                <DialogTitle className="text-xl">{notification.title}</DialogTitle>
                <DialogDescription>
                    Received on {format(new Date(notification.timestamp), 'PPPp')}
                </DialogDescription>
            </div>
             <Badge variant={notification.priority === 'High' ? 'destructive' : notification.priority === 'Medium' ? 'warning' : 'outline'}>
                {notification.priority}
            </Badge>
          </div>
        </DialogHeader>
        <div className="mt-4 space-y-6">
            <div>
                <h4 className="font-medium mb-2">Message</h4>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
            </div>
            
            {notification.relatedEntity && (
                <div>
                    <h4 className="font-medium mb-2">Related Entity</h4>
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{notification.relatedEntity.name || notification.relatedEntity.id}</p>
                                <p className="text-xs text-muted-foreground capitalize">{notification.relatedEntity.type}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="#">View Entity <ExternalLink className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
         <DialogFooter className="mt-6">
          <Button variant="outline"><Reply className="mr-2 h-4 w-4" /> Reply (Mock)</Button>
          <Button variant="outline"><Forward className="mr-2 h-4 w-4" /> Forward (Mock)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
