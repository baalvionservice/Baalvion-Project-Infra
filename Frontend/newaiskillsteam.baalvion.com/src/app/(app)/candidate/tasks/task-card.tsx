
'use client'

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TaskWithCompany } from './task-list';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Calendar, Clock, AlertTriangle, UserCheck, Lock } from 'lucide-react';
import type { TaskPriority } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';

export function TaskCard({ task }: { task: TaskWithCompany }) {
  const { user } = useAuth();
  
  const getPriorityVariant = (priority?: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'warning';
      default:
        return 'outline';
    }
  };

  const getPriorityIcon = (priority?: TaskPriority) => {
    switch (priority) {
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-destructive-foreground" />;
      case 'Medium':
        return <AlertTriangle className="h-4 w-4 text-warning-foreground" />;
      default:
        return null;
    }
  };

  const isAssignedToUser = user && task.assignedTo?.includes(user.id);

  return (
    <Card className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-headline mb-1 leading-tight">{task.title}</CardTitle>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isAssignedToUser ? (
                <Badge variant="purple"><UserCheck className="mr-1.5 h-3 w-3" /> Assigned to You</Badge>
            ) : task.isPrivate ? (
                <Badge variant="outline"><Lock className="mr-1.5 h-3 w-3" /> Private Task</Badge>
            ) : (
                <Badge variant="outline">{task.difficulty}</Badge>
            )}
            {task.priority && task.priority !== 'Low' && (
              <Badge variant={getPriorityVariant(task.priority)} className="shrink-0">
                {getPriorityIcon(task.priority)}
                <span className="ml-1">{task.priority} Priority</span>
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.companyLogo} alt={task.companyName} />
            <AvatarFallback>{task.companyName.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardDescription>{task.companyName}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{task.roleCategory}</Badge>
          {task.taskTypes?.map(type => (
            <Badge key={type} variant="secondary">{type}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex w-full justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Due {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</span>
          </div>
          {task.timeLimitMinutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{task.timeLimitMinutes} min</span>
            </div>
          )}
        </div>
        <Button asChild className="w-full">
          <Link href={`/candidate/tasks/${task.id}`}>
            View Details <ArrowRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
