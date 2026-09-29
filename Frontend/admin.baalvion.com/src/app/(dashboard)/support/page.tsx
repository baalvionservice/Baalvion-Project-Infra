'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Headphones, MessageSquare, Clock, AlertTriangle, CheckCircle2,
  User, Building2, ArrowUpRight, Send, Tag, Activity, Search,
  ChevronDown, Filter,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUIStore } from '@/lib/store/uiStore';
import { supportApi } from '@/lib/api/support';
import { formatRelative, formatDateTime } from '@/lib/utils/format';
import type {
  SupportTicket, TicketMessage, TicketStatus, TicketPriority,
} from '@/lib/types/support.types';
import { cn } from '@/lib/utils/cn';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<TicketStatus, string> = {
  open:       'text-blue-400 border-blue-500/50',
  pending:    'text-yellow-400 border-yellow-500/50',
  resolved:   'text-green-400 border-green-500/50',
  closed:     'text-muted-foreground',
  escalated:  'text-red-400 border-red-500/50',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low:    'text-muted-foreground',
  medium: 'text-blue-400',
  high:   'text-orange-400',
  urgent: 'text-red-400',
};

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 capitalize', STATUS_COLORS[status])}>
      {status}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', PRIORITY_COLORS[priority])}>
      {priority}
    </span>
  );
}

// ── Ticket row ────────────────────────────────────────────────────────────────

function TicketRow({ ticket, selected, onClick }: { ticket: SupportTicket; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 py-3 px-3 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/40',
        selected && 'bg-muted/60'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
          <TicketStatusBadge status={ticket.status} />
          {ticket.slaBreached && <Badge variant="destructive" className="text-[10px] h-4 px-1">SLA!</Badge>}
        </div>
        <p className="text-sm font-medium mt-0.5 leading-tight truncate">{ticket.subject}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.userName}</span>
          {ticket.orgName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{ticket.orgName}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <PriorityBadge priority={ticket.priority} />
        <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(ticket.updatedAt)}</p>
        <p className="text-[10px] text-muted-foreground">{ticket.messageCount} msgs</p>
      </div>
    </div>
  );
}

// ── Ticket detail ─────────────────────────────────────────────────────────────

function TicketDetail({ ticket }: { ticket: SupportTicket }) {
  const [reply, setReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const qc = useQueryClient();

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['ticket-messages', ticket.id],
    queryFn: () => supportApi.listMessages(ticket.id).then((r) => r.data.data),
  });

  const sendMsg = useMutation({
    mutationFn: () => supportApi.sendMessage(ticket.id, { body: reply, isInternal }),
    onSuccess: () => { setReply(''); qc.invalidateQueries({ queryKey: ['ticket-messages', ticket.id] }); },
  });

  const messages: TicketMessage[] = messagesData ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h2 className="text-sm font-semibold leading-tight">{ticket.subject}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{ticket.userEmail}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 420 }}>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={cn(
            'rounded-lg p-3 text-xs',
            msg.authorRole === 'user' ? 'bg-muted ml-4' : msg.isInternal ? 'bg-yellow-500/5 border border-yellow-500/20' : 'bg-blue-500/5 border border-blue-500/20 mr-4'
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{msg.authorName}</span>
              {msg.isInternal && <Badge variant="outline" className="text-[10px] h-4 px-1 text-yellow-500 border-yellow-500/50">Internal</Badge>}
              <span className="text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}
      </div>

      {/* Reply */}
      <div className="border-t px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Button
            variant={isInternal ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setIsInternal(false)}
          >
            Reply
          </Button>
          <Button
            variant={isInternal ? 'ghost' : 'secondary'}
            size="sm"
            className="text-xs h-6 px-2"
            onClick={() => setIsInternal(true)}
          >
            Internal Note
          </Button>
        </div>
        <Textarea
          placeholder={isInternal ? 'Add internal note…' : 'Write reply…'}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="min-h-[80px] text-xs"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => sendMsg.mutate()}
            disabled={!reply.trim() || sendMsg.isPending}
          >
            <Send className="h-3.5 w-3.5" />
            {isInternal ? 'Add Note' : 'Send Reply'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function SupportStatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{className?: string}>; color: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('tickets');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => { setBreadcrumbs([{ label: 'Support Center' }]); }, [setBreadcrumbs]);

  const { data: stats }  = useQuery({ queryKey: ['support-stats'], queryFn: () => supportApi.getStats().then((r) => r.data.data), refetchInterval: 30_000 });
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets', { status: statusFilter, priority: priorityFilter === 'all' ? undefined : priorityFilter, search }],
    queryFn: () => supportApi.listTickets({
      page: 1, limit: 50,
      status: statusFilter as TicketStatus,
      priority: priorityFilter === 'all' ? undefined : priorityFilter as TicketPriority,
      search: search || undefined,
    }).then((r) => r.data.data),
  });

  const ticketList: SupportTicket[] = tickets?.data ?? [];
  const urgentCount = ticketList.filter((t) => t.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Center"
        description="Tickets, customer timelines, SLA tracking, and internal operations"
        actions={
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3 text-green-500" />
            Live
          </Badge>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SupportStatCard label="Open Tickets"      value={stats?.openTickets ?? '—'}       icon={MessageSquare} color="text-blue-500"   />
        <SupportStatCard label="Pending"           value={stats?.pendingTickets ?? '—'}    icon={Clock}         color="text-yellow-500" />
        <SupportStatCard label="Resolved Today"   value={stats?.resolvedToday ?? '—'}     icon={CheckCircle2}  color="text-green-500"  />
        <SupportStatCard
          label="SLA Breaches"
          value={stats?.slaBreached ?? '—'}
          icon={AlertTriangle}
          color={stats && stats.slaBreached > 0 ? 'text-red-500' : 'text-muted-foreground'}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tickets">
            Tickets
            {urgentCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{urgentCount} urgent</Badge>}
          </TabsTrigger>
          <TabsTrigger value="macros">Macros</TabsTrigger>
        </TabsList>

        {/* Tickets */}
        <TabsContent value="tickets">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Ticket list */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-7 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {['all', 'open', 'pending', 'resolved', 'closed', 'escalated'].map((s) => (
                          <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
                          <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
                    {isLoading ? (
                      <div className="p-4 space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                      </div>
                    ) : ticketList.length === 0 ? (
                      <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                        <Headphones className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No tickets found</p>
                      </div>
                    ) : (
                      ticketList.map((t) => (
                        <TicketRow
                          key={t.id}
                          ticket={t}
                          selected={selectedTicket?.id === t.id}
                          onClick={() => setSelectedTicket(t)}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket detail */}
            <div className="lg:col-span-3">
              {selectedTicket ? (
                <Card className="h-full">
                  <TicketDetail ticket={selectedTicket} />
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground py-20">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a ticket to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Macros */}
        <TabsContent value="macros">
          <MacrosPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Macros panel ──────────────────────────────────────────────────────────────

function MacrosPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['support-macros'],
    queryFn: () => supportApi.listMacros().then((r) => r.data.data),
  });
  const macros = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" /> Canned Replies & Macros
          </CardTitle>
          <Button size="sm" variant="outline" className="text-xs gap-1.5">New Macro</Button>
        </div>
        <CardDescription>Reusable reply templates for common support scenarios</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : macros.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
            <Tag className="h-8 w-8 opacity-30" />
            <p className="text-sm">No macros created yet</p>
          </div>
        ) : (
          <div>
            {macros.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.body.substring(0, 80)}{m.body.length > 80 ? '…' : ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">{m.category}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">{m.usageCount} uses</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
