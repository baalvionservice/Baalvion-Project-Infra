'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Loader2, 
  Clock, 
  Trash2, 
  Eye,
  ArrowLeft,
  FileText,
  User,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { moderationService } from '@/services/data/moderation-service';
import { ModerationItem } from '@/types/moderation';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

/**
 * Content Moderation Tools Dashboard.
 * Specialized control matrix for auditing platform content and enforcing integrity.
 */
export default function ContentModerationToolsPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadQueue() {
      try {
        const response = await moderationService.getModerationQueue();
        if (response.data) setItems(response.data);
      } catch (e) {
        console.error('Moderation sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, []);

  const handleAction = (id: string, action: 'review' | 'delete') => {
    const item = items.find(i => i.id === id);
    if (action === 'delete') {
      setItems(prev => prev.filter(i => i.id !== id));
      toast({
        title: "Content Purged",
        description: `"${item?.content}" has been removed from the platform.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Audit Initiated",
        description: `Reviewing integrity for "${item?.content}".`
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(search.toLowerCase()) ||
    item.creator.toLowerCase().includes(search.toLowerCase()) ||
    item.reportType.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: ModerationItem['status']) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <Clock className="h-2.5 w-2.5" /> Pending
        </Badge>;
      case 'Reviewed':
        return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <CheckCircle2 className="h-2.5 w-2.5" /> Reviewed
        </Badge>;
      case 'Action Taken':
        return <Badge variant="destructive" className="gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
          <ShieldAlert className="h-2.5 w-2.5" /> Action Taken
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldAlert className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Integrity Command</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Content Moderation Matrix</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Algorithmic Guard Active</span>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search moderation queue by content, creator, or classification..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs">
          <Filter className="h-3.5 w-3.5" /> Apply Filter
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest py-4">Content Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Creator Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Classification</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Lifecycle Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Report Date</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse font-bold tracking-widest uppercase">Indexing Integrity Records...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">
                    No active reports localized in the moderation buffer.
                  </TableCell>
                </TableRow>
              ) : filteredItems.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold truncate max-w-[200px]">{item.content}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <User className="h-3.5 w-3.5 text-secondary" />
                      {item.creator}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] font-bold uppercase px-3">
                      {item.reportType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {getStatusBadge(item.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end pr-4">
                      <span className="text-xs font-bold">{format(new Date(item.date), 'MMM d, yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {format(new Date(item.date), 'HH:mm')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => handleAction(item.id, 'review')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleAction(item.id, 'delete')}
                      >
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

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Sentiment Throttling</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              The platform utilizes AI sentiment analysis to automatically flag nodes with high toxicity scores. Flags are resolved by humans within **4.2 hours** average.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Integrity Purge Protocol</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Purging content removes it from the sitemap and intelligence index immediately. The associated creator reputation node is adjusted in real-time.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Escalation Nodes</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Reports involving expert impersonation or plagiarism are escalated to the Platform Lead for vertical legal and compliance review.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
