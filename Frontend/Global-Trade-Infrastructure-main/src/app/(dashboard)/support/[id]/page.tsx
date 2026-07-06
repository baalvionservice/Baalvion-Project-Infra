'use client';

/**
 * @file support/[id]/page.tsx
 * @description Support ticket detail — threaded replies + status controls.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTicketById, addTicketMessage, updateTicketStatus, SupportTicket } from '@/services/support-service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Send, LifeBuoy, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = () => getTicketById(id).then(setTicket);

  useEffect(() => {
    let cancelled = false;
    getTicketById(id)
      .then((t) => { if (!cancelled) setTicket(t); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await addTicketMessage(id, reply);
      setReply('');
      await load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to send reply', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSending(false);
    }
  };

  const resolve = async () => {
    setResolving(true);
    try {
      const updated = await updateTicketStatus(id, 'resolved');
      setTicket(updated);
      toast({ title: 'Ticket marked resolved' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to update ticket', description: err instanceof Error ? err.message : undefined });
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex h-64 flex-col items-center justify-center gap-4 text-center px-6">
        <LifeBuoy className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-sm font-bold text-muted-foreground">Ticket not found.</p>
        <Link href="/support"><Button variant="outline" className="font-bold">Back to Support</Button></Link>
      </main>
    );
  }

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <main className="flex-1 p-4 md:p-6 bg-muted/20 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/support" className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Back to Support
        </Link>

        <Card className="border-2 rounded-2xl shadow-xl bg-background">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-tighter">{ticket.subject}</h1>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{ticket.category || 'general'}</Badge>
                  <Badge variant="outline" className="text-[10px] font-black uppercase">{ticket.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              {!isClosed && (
                <Button onClick={resolve} disabled={resolving} variant="outline" className="font-black uppercase text-[11px] tracking-widest rounded-2xl">
                  {resolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Mark Resolved
                </Button>
              )}
            </div>

            {ticket.description && <p className="text-sm text-muted-foreground font-medium">{ticket.description}</p>}

            <div className="space-y-4 pt-4 border-t">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Thread</p>
              {ticket.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No replies yet.</p>
              ) : (
                ticket.messages.map((m) => (
                  <div key={m.id} className="rounded-xl border-2 p-4 space-y-1">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>{m.authorRole || 'user'}</span>
                      <span>{format(new Date(m.createdAt), 'PPP p')}</span>
                    </div>
                    <p className="text-sm font-medium">{m.body}</p>
                  </div>
                ))
              )}
            </div>

            {!isClosed && (
              <div className="space-y-3 pt-4 border-t">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Write a reply…" className="border-2 rounded-xl" />
                <div className="flex justify-end">
                  <Button onClick={sendReply} disabled={sending || !reply.trim()} className="font-black uppercase text-[11px] tracking-widest rounded-2xl">
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send Reply
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
