'use client';

/**
 * @file agent/tasks/[id]/page.tsx
 * @description Task detail — view + complete a single task.
 */
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTaskById, completeTask, Task } from '@/services/task-service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, CheckCircle2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTaskById(id)
      .then((t) => { if (!cancelled) setTask(t); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await completeTask(id);
      setTask(updated);
      toast({ title: 'Task marked complete' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to complete task', description: err instanceof Error ? err.message : undefined });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
      </main>
    );
  }

  if (!task) {
    return (
      <main className="flex h-64 flex-col items-center justify-center gap-4 text-center px-6">
        <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-sm font-bold text-muted-foreground">Task not found.</p>
        <Link href="/agent/tasks"><Button variant="outline" className="font-bold">Back to Tasks</Button></Link>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/agent/tasks" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Back to Tasks
        </Link>

        <Card className="border-2 rounded-2xl shadow-xl bg-background">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter">{task.title}</h1>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{task.priority}</Badge>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{task.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <Button onClick={handleComplete} disabled={completing} className="font-black uppercase text-[11px] tracking-widest rounded-2xl">
                  {completing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Mark Complete
                </Button>
              )}
            </div>

            {task.description && <p className="text-sm text-muted-foreground font-medium">{task.description}</p>}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Category</p>
                <p className="font-bold">{task.category || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Due Date</p>
                <p className="font-bold">{task.dueDate ? format(new Date(task.dueDate), 'PPP') : '—'}</p>
              </div>
              {task.completedAt && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Completed</p>
                  <p className="font-bold">{format(new Date(task.completedAt), 'PPP p')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
