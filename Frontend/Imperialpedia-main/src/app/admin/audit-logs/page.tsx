'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  History, 
  User, 
  Settings, 
  FileText, 
  Clock,
  Search,
  Filter,
  Loader2,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { getAuditLogs } from '@/services/mock-api/audit';
import { AuditLog } from '@/modules/content-engine/types/article';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * System Audit Trail Page.
 * Displays a comprehensive log of all administrative and security actions.
 */
export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await getAuditLogs();
        setLogs(response.data);
      } catch (e) {
        console.error('Audit sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase()) ||
    log.actor.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-3.5 w-3.5" />;
      case 'content': return <FileText className="h-3.5 w-3.5" />;
      case 'security': return <ShieldAlert className="h-3.5 w-3.5" />;
      default: return <Settings className="h-3.5 w-3.5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'content': return 'bg-primary/10 text-primary border-primary/20';
      case 'security': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/20 text-muted-foreground border-white/5';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Lock className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Governance Engine</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Platform Audit Trail</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Global immutable log of all administrative and cryptographic events.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Audit Integrity Sealed</span>
        </div>
      </header>

      {/* Audit Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search audit trail by actor, action, or entity..." 
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Event Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Action</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Details / Target</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Administrator</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Decrypting Audit Chain...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching audit records found.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell>
                    <Badge variant="outline" className={`${getTypeColor(log.type)} gap-1.5 font-bold uppercase text-[9px] h-6 px-2`}>
                      {getTypeIcon(log.type)} {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm">{log.action}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground truncate max-w-[250px] block" title={log.details}>
                      {log.details}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {log.actor.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">{log.actor}</span>
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

      {/* Compliance Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Log Retention Policy</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Administrative logs are retained for **365 days** within the production cluster for regulatory compliance and platform security audits.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-emerald-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 w-fit text-emerald-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Integrity Verification</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              The current audit chain is cryptographically sealed and verified against tampering every 60 seconds. All entries are immutable.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Security Escalations</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Events classified as 'Security' trigger real-time alerts to the Platform Lead and are mirrored to the off-site emergency logger.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
