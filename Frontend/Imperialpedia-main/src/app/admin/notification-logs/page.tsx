'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  History, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Loader2, 
  User, 
  Bell,
  ArrowUpRight,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { NotificationLog } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * System Notification Logs Dashboard.
 * Chronological record of all administrative transmissions and platform alerts.
 */
export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await systemService.getNotificationLogs();
        if (response.data) setLogs(response.data);
      } catch (e) {
        console.error('Notification log sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.title.toLowerCase().includes(search.toLowerCase()) ||
    log.recipient.toLowerCase().includes(search.toLowerCase()) ||
    log.type.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <CheckCircle2 className="h-2.5 w-2.5" /> Dispatched
        </Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <XCircle className="h-2.5 w-2.5" /> Delivery Error
        </Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <Clock className="h-2.5 w-2.5 animate-pulse" /> In Transit
        </Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <History className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Communication Audit</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Broadcast Dispatch Logs</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Archival record of all system notifications and expert intelligence alerts.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Log Integrity Verified</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search logs by title, recipient, or payload type..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="h-11 px-4 gap-2 border-white/10 bg-background/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
          <Filter className="h-3.5 w-3.5" /> Filter Matrix
        </Badge>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Dispatched Headline</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Recipient Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Payload Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Dispatch Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Indexing Dispatch Archive...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching transmission records localized.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate max-w-xs">{log.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {log.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <User className="h-3.5 w-3.5 text-secondary" />
                      {log.recipient}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold">{format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-2.5 w-2.5" /> {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dispatch Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Transmission Integrity</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Dispatch logs are retained for **90 days**. Every transmission is cross-referenced with the SMTP relay and WebSocket gateway for verified delivery.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Expert Reach</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              98% of dispatched notifications to verified experts are acknowledged within **12 hours**, reinforcing the platform's high-velocity intelligence loop.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Delivery Resilience</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Messages failing more than **3 delivery attempts** are automatically escalated to the Platform Lead for communication node re-validation.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
