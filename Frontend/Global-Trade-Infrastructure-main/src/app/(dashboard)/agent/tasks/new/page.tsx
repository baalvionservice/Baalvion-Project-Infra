'use client';

/**
 * @file agent/tasks/new/page.tsx
 * @description Create-task form for the Trade Agent workspace.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, TaskPriority } from '@/services/task-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function NewTaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium' as TaskPriority, dueDate: '',
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    setSubmitting(true);
    try {
      await createTask({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      });
      toast({ title: 'Task created' });
      router.push('/agent/tasks');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to create task', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link href="/agent/tasks" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Back to Tasks
          </Link>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 border-2 flex items-center justify-center shrink-0"><ClipboardList className="h-6 w-6 text-primary" /></div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">New Task</h1>
          </div>
        </div>

        <Card className="border-2 rounded-2xl shadow-xl bg-background">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Follow up with buyer on RFQ-1042" className="h-12 border-2 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Context and next steps…" className="border-2 rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="follow_up" className="h-12 border-2 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger className="h-12 border-2 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="h-12 border-2 rounded-xl" />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={submit} disabled={submitting} className="h-12 px-6 font-black uppercase text-[11px] tracking-widest rounded-2xl">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
