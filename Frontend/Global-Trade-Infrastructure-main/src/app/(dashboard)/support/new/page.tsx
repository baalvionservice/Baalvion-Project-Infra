'use client';

/**
 * @file support/new/page.tsx
 * @description Create-ticket form for the buyer support workspace.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTicket, TicketPriority } from '@/services/support-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, ArrowLeft, LifeBuoy } from 'lucide-react';

const CATEGORIES = ['billing', 'technical', 'account', 'trade_dispute', 'other'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '', description: '', category: 'general', priority: 'medium' as TicketPriority,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.subject.trim()) {
      toast({ variant: 'destructive', title: 'Subject is required' });
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject: form.subject,
        description: form.description,
        category: form.category,
        priority: form.priority,
      });
      toast({ title: 'Support ticket opened' });
      router.push(`/support/${ticket.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to open ticket', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-1">
          <Link href="/support" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Back to Support
          </Link>
          <div className="flex items-center gap-3 pt-2">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 border-2 flex items-center justify-center shrink-0"><LifeBuoy className="h-6 w-6 text-primary" /></div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">New Support Ticket</h1>
          </div>
        </div>

        <Card className="border-2 rounded-2xl shadow-xl bg-background">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</Label>
              <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Cannot download invoice for Order #1042" className="h-12 border-2 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Describe the issue in detail…" className="border-2 rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger className="h-12 border-2 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                  <SelectTrigger className="h-12 border-2 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={submit} disabled={submitting} className="h-12 px-6 font-black uppercase text-[11px] tracking-widest rounded-2xl">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Submit Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
