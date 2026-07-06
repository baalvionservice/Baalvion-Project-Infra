'use client';

/**
 * @file support/page.tsx
 * @description Buyer support ticket list — live view of tenant tickets (real
 * trade-service /support_tickets resource). Links to the new-ticket flow.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTickets, SupportTicket } from '@/services/support-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Plus, Loader2, LifeBuoy, Inbox, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColor: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getTickets()
      .then((t) => { if (!cancelled) setTickets(t); })
      .catch(() => { if (!cancelled) setTickets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const open = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const resolved = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <main className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Support</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Support Tickets</h1>
          <p className="text-muted-foreground font-medium italic">Get help with billing, technical, or account issues.</p>
        </div>
        <Link href="/support/new">
          <Button className="h-14 px-8 font-black uppercase tracking-widest text-xs shadow-xl">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Total Tickets', val: tickets.length, icon: Inbox, color: 'text-blue-600' },
          { label: 'Open', val: open, icon: LifeBuoy, color: 'text-amber-600' },
          { label: 'Resolved', val: resolved, icon: CheckCircle2, color: 'text-emerald-600' },
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
          <CardTitle className="text-sm font-black uppercase tracking-widest">Ticket Registry</CardTitle>
          <CardDescription>Your support requests and their status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading tickets…</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
              <LifeBuoy className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">No support tickets yet.</p>
              <Link href="/support/new"><Button variant="outline" className="font-bold"><Plus className="mr-2 h-4 w-4" /> Open your first ticket</Button></Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => router.push(`/support/${t.id}`)}>
                    <TableCell className="font-bold">{t.subject}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase">{t.category || 'general'}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-bold uppercase text-[10px]', statusColor[t.status] ?? '')}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium">
                      {formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}
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
