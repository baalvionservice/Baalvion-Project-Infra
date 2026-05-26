
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Briefcase, FileText, MessageSquare } from 'lucide-react';
import type { AdminTeamData } from './page';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TeamDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  team: AdminTeamData | null;
}

export function TeamDetailsDialog({ isOpen, onOpenChange, team }: TeamDetailsDialogProps) {
  if (!team) return null;

  // Mock data for activity feed
  const mockActivities = [
    { user: team.members[0]?.name || 'User', action: 'submitted a new version for "Responsive Navbar".', time: new Date(new Date().setHours(new Date().getHours() - 1)) },
    { user: team.lead.name, action: 'left a comment: "Great progress, team!"', time: new Date(new Date().setHours(new Date().getHours() - 3)) },
    { user: team.members[1]?.name || 'User 2', action: 'was assigned to "Database Schema Design".', time: new Date(new Date().setDate(new Date().getDate() - 1)) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-2xl">{team.name}</DialogTitle>
              <DialogDescription>
                Team at {team.company.name} | Lead: {team.lead.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" /> Team Members ({team.members.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {team.members.map(member => (
                        <div key={member.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profile?.avatarUrl} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-4 w-4" /> Recent Activity (Mock)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mockActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm"><span className="font-semibold">{activity.user}</span> {activity.action}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(activity.time, { addSuffix: true })}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
         <div className="mt-4">
            <h4 className="font-medium mb-2">Task Progress (Mock)</h4>
            <div className="rounded-md border p-4 space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <p className="font-medium">Build a Responsive Navbar</p>
                        <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <Progress value={60} className="h-2" />
                </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <p className="font-medium">Design a Database Schema</p>
                         <Badge variant="default">Completed</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
