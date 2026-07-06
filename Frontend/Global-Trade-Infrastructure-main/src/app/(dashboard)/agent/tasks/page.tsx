'use client';

/**
 * @file agent/tasks/page.tsx
 * @description Trade Agent task tracking — live view of tenant tasks (real
 * trade-service /tasks resource). Links to the create-task flow.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTasks, Task } from '@/services/task-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Plus, Loader2, ClipboardList, ListTodo, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColor: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const priorityColor: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function AgentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getTasks()
      .then((t) => { if (!cancelled) setTasks(t); })
      .catch(() => { if (!cancelled) setTasks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const open = tasks.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <main className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Trade Agent</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Tasks</h1>
          <p className="text-muted-foreground font-medium italic">Follow-ups, field visits, and opportunity chases.</p>
        </div>
        <Link href="/agent/tasks/new">
          <Button className="h-14 px-8 font-black uppercase tracking-widest text-xs shadow-xl">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Tasks', val: tasks.length, icon: ClipboardList, color: 'text-blue-600' },
          { label: 'Open / In Progress', val: open, icon: ListTodo, color: 'text-amber-600' },
          { label: 'Completed', val: completed, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-black mt-1">{k.val}</div>
              </div>
              <k.icon className={cn('h-5 w-5', k.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">Task Registry</CardTitle>
          <CardDescription>Open, in-progress, and completed tasks for your organization.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading tasks…</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
              <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">No tasks yet.</p>
              <Link href="/agent/tasks/new"><Button variant="outline" className="font-bold"><Plus className="mr-2 h-4 w-4" /> Create your first task</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/agent/tasks/${t.id}`)}>
                    <TableCell className="font-bold">{t.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-bold uppercase text-[10px]', priorityColor[t.priority] ?? '')}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-bold uppercase text-[10px]', statusColor[t.status] ?? '')}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                      {t.dueDate ? (
                        <><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}</>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
