'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { dashboardApi } from '@/lib/api-client';
import { useDashboardRefs } from '@/hooks/use-dashboard-refs';

interface Task { id: string; title: string; status: string; assignee_id?: string; business_id?: string }

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
];
// Normalise backend status variants onto the column keys above.
const norm = (s: string): string =>
  (({ completed: 'done', 'in-progress': 'in_progress', pending: 'todo' } as Record<string, string>)[s] ?? s);

export default function KanbanBoard() {
  const { businesses, employees } = useDashboardRefs();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardApi.tasks();
        const list = (((res as { data?: unknown[] })?.data ?? res ?? []) as Record<string, unknown>[]);
        if (!cancelled) setTasks(list.map((t) => ({
          id: String(t.id), title: String(t.title ?? ''), status: norm(String(t.status ?? 'todo')),
          assignee_id: t.assignee_id != null ? String(t.assignee_id) : undefined,
          business_id: t.business_id != null ? String(t.business_id) : undefined,
        })));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const bizName = (id?: string) => businesses.find((b) => b.id === id)?.name ?? '';
  const assignee = (id?: string) => employees.find((e) => e.id === id);

  // Show the workflow columns that actually have tasks; fall back to the middle three when empty.
  const active = COLUMNS.filter((c) => tasks.some((t) => t.status === c.key));
  const cols = active.length ? active : COLUMNS.slice(1, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
        <CardDescription>Overview of project tasks across shared businesses.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cols.map((col) => {
            const taskList = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-4 font-bold">{col.label} <Badge variant="secondary" className="ml-2">{taskList.length}</Badge></h3>
                <div className="space-y-4">
                  {taskList.map((task) => {
                    const a = assignee(task.assignee_id);
                    return (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <p className="mb-2 font-medium">{task.title}</p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <Badge variant="outline">{bizName(task.business_id)}</Badge>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{a?.name?.charAt(0) ?? '?'}</AvatarFallback>
                            </Avatar>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
