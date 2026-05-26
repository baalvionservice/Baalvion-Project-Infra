'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Database, 
  RotateCcw, 
  Plus, 
  History, 
  Download, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  FileArchive,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { systemService } from '@/services/data/system-service';
import { Backup } from '@/types/system';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Platform Backups & Restore Hub (Governance).
 * Manages platform data snapshots and critical restoration cycles for the Intelligence Index.
 */
export default function PlatformBackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    async function loadBackups() {
      setLoading(true);
      const response = await systemService.getBackups();
      if (response.data) setBackups(response.data);
      setLoading(false);
    }
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    toast({
      title: "Snapshot Initiated",
      description: "Aggregating 1M+ knowledge nodes into a secure platform state...",
    });

    const response = await systemService.createBackup();
    setCreating(false);

    if (response.data) {
      setBackups(prev => [response.data!, ...prev]);
      toast({
        title: "Backup Sealed",
        description: `Snapshot ${response.data.id} has been cryptographically verified.`,
      });
    }
  };

  const handleRestore = async (id: string) => {
    setRestoring(id);
    toast({
      title: "Restoration Active",
      description: "Reverting platform state. All write operations are currently throttled.",
    });

    const response = await systemService.restoreBackup(id);
    setRestoring(null);

    if (response.status === 200) {
      toast({
        title: "Platform Restored",
        description: "Imperialpedia Index has successfully synchronized with the snapshot.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><CheckCircle2 className="h-2.5 w-2.5" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><AlertCircle className="h-2.5 w-2.5" /> Failed</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2"><Loader2 className="h-2.5 w-2.5 animate-spin" /> Syncing</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href="/admin"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Database className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">State Resilience</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">Backups & Restore</Text>
          </div>
        </div>
        
        <Button 
          onClick={handleCreateBackup} 
          disabled={creating || !!restoring}
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-12 px-8 transition-all scale-105 active:scale-95"
        >
          {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Manual Snapshot
        </Button>
      </header>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-none shadow-xl bg-emerald-500/5 group hover:border-emerald-500/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Protected</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4h ago</div>
            <div className="flex items-center text-[10px] text-emerald-500 font-bold mt-1">
              <ShieldCheck className="h-3 w-3 mr-1" /> Automated Success
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Archive Volume</CardTitle>
            <FileArchive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124.5 GB</div>
            <div className="flex items-center text-[10px] text-muted-foreground font-bold mt-1 uppercase">
              12 Nodes secured
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Retention Cycle</CardTitle>
            <History className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30 Days</div>
            <p className="text-[10px] text-muted-foreground mt-1">Auto-rotation active</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mirror Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Verified</div>
            <p className="text-[10px] text-primary font-bold mt-1">US-EAST-1 (HOT)</p>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot History Table */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-card/30 flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Archive Index</CardTitle>
            <CardDescription>Comprehensive record of platform state captures.</CardDescription>
          </div>
          <Badge variant="outline" className="border-white/10 bg-background/30 text-[10px] font-bold tracking-widest px-3 h-7">IMMUTABLE LOGS</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">Snapshot Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Capture Mode</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Data Size</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Integrity Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Indexing Recovery Nodes...</Text>
                  </TableCell>
                </TableRow>
              ) : backups.map((bak) => (
                <TableRow key={bak.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold flex items-center gap-2">
                        {bak.id}
                        {bak.status === 'completed' && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase mt-1">
                        {format(new Date(bak.timestamp), 'MMM d, yyyy — HH:mm:ss')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                        {bak.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-mono font-bold">{bak.size}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(bak.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors">
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={bak.status !== 'completed' || !!restoring}
                            className="h-9 px-4 text-xs font-bold gap-2 text-muted-foreground hover:text-secondary transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card border-secondary/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold">Critical Platform Restoration?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              You are about to revert the Imperialpedia Index to snapshot **{bak.id}**. This will overwrite all knowledge nodes created after {format(new Date(bak.timestamp), 'MMM d, HH:mm')}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-xl">Cancel Reversion</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRestore(bak.id)}
                              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold rounded-xl"
                            >
                              Confirm Restoration
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Resilience Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">3-2-1 Strategy Enabled</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Every intelligence node is mirrored across **3** storage clusters, using **2** distinct hardware taxonomies, with **1** off-site immutable vault.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ArrowUpRight className="h-16 w-16 text-secondary" />
          </div>
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Disaster Recovery (DRP)</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Full index recovery window is estimated at **under 15 minutes** using the currentUS-EAST-1 HOT mirror node.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 w-fit text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Immutable Snapshots</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Once a snapshot is cryptographically sealed, it cannot be modified. This prevents lateral tampering during system-wide integrity audits.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
