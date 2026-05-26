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
  Search, 
  Filter, 
  Loader2, 
  Lock, 
  Globe, 
  Monitor, 
  Clock, 
  XCircle, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { AccessLog } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

/**
 * Access Log Monitoring Dashboard.
 * Displays all authentication attempts and security-related access events.
 */
export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await systemService.getAccessLogs();
        if (response.data) setLogs(response.data);
      } catch (e) {
        console.error('Access log sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.ip.includes(search) ||
    log.device.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Lock className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Security Engine</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">Access Log Monitoring</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Real-time oversight of platform authentication and session entry points.
          </Text>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">MFA Protocol Active</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by identity, IP, or hardware signature..." 
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
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">User Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Access Node (IP)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Hardware Taxonomy</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Syncing Access Layer...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching access records localized.
                  </TableCell>
                </TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {log.ip}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Monitor className="h-3 w-3" />
                      {log.device}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {log.status === 'success' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Authorized
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
                          <XCircle className="h-2.5 w-2.5" /> Denied
                        </Badge>
                      )}
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

      {/* Security Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Anomaly Detection</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              The system automatically flags IP addresses with more than **5 failed attempts** within 60 seconds for administrative review.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Geographic Fencing</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Access attempts from high-risk regions are automatically subjected to secondary biometric verification through the Imperialpedia Auth node.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Session Integrity</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Administrative sessions are limited to **2 hours** of inactivity. All hardware handshakes are cryptographically verified upon every request.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
