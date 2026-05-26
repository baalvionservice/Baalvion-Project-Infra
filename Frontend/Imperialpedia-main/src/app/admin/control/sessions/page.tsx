'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldCheck, 
  LogOut, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  Globe, 
  Monitor, 
  User, 
  CheckCircle2, 
  XCircle,
  ShieldAlert,
  ArrowLeft,
  Activity,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { AdminSession } from '@/types/system';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

/**
 * Admin Session Control Matrix.
 * Specialized module for auditing active platform connections and enforcing session integrity.
 */
export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await systemService.getActiveSessions();
        if (response.data) setSessions(response.data);
      } catch (e) {
        console.error('Session sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const handleTerminate = async (id: string, user: string) => {
    setTerminating(id);
    try {
      const response = await systemService.terminateSession(id);
      if (response.status === 200) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'Inactive' } : s));
        toast({
          title: "Session Invalidated",
          description: `Access node for ${user} has been terminated.`,
          variant: "destructive"
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Termination Error",
        description: "Failed to broadcast session kill-switch."
      });
    } finally {
      setTerminating(null);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.user.toLowerCase().includes(search.toLowerCase()) ||
    s.ip.includes(search) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: AdminSession['status']) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <Activity className="h-2.5 w-2.5 animate-pulse" /> Active
        </Badge>;
      case 'Inactive':
        return <Badge variant="outline" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2 opacity-50">
          <XCircle className="h-2.5 w-2.5" /> Terminated
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Identity Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Session Control Matrix</Text>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Zero-Trust Monitoring Active</span>
        </div>
      </header>

      {/* Session Vital Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Nodes</CardTitle>
            <Activity className="h-4 w-4 text-primary group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'Active').length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Live administrative sessions</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Concurrent Peak</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Nodes</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">SLA Compliant</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Terminated (24h)</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.filter(s => s.status === 'Inactive').length}</div>
            <p className="text-[10px] text-destructive font-bold mt-1">Security resets</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Session Depth</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42m</div>
            <p className="text-[10px] text-muted-foreground mt-1">Average connection time</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm sticky top-20 z-30">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by user identity, role, or network node (IP)..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
          <Filter className="h-3.5 w-3.5" /> Matrix Filters
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">User Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Platform Persona</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Access Node (IP)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Handshake Time</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Governance Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Streaming Session Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    No active sessions localized within the current discovery buffer.
                  </TableCell>
                </TableRow>
              ) : filteredSessions.map((session) => (
                <TableRow key={session.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold">{session.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3 h-6">
                      {session.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {session.ip}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(session.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(session.loginTime), 'MMM d, HH:mm')}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Login verified</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {session.status === 'Active' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={terminating === session.id}
                        className="h-9 px-4 text-xs font-bold gap-2 text-muted-foreground hover:text-destructive transition-colors group/btn"
                        onClick={() => handleTerminate(session.id, session.user)}
                      >
                        {terminating === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5 group-hover/btn:scale-110" />}
                        Terminate Node
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic pr-4">Node Offline</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Insight Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Inactivity Throttling</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Administrative sessions are limited to **120 minutes** of idle time. The kernel automatically rotates security tokens every 15 minutes during active sessions to mitigate lateral traversal.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ArrowUpRight className="h-16 w-16 text-secondary" />
          </div>
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Monitor className="h-8 w-8" />
          </div>
          <div>
            <Text variant="h3" className="mb-2 text-xl font-bold">Geographic Fencing</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
              Access nodes detected outside of the **authorized IP registry** are automatically subjected to mandatory biometric MFA challenge before the session is established.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
