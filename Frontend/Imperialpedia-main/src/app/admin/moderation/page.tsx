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
  Flag, 
  Trash2, 
  MessageSquare, 
  FileText, 
  UserPlus, 
  Loader2,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { getPendingContent } from '@/services/mock-api/moderation';
import { ModerationItem, ModerationType } from '@/types/moderation';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ContentModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ModerationType | 'all'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getPendingContent();
        setItems(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (id: string, action: 'approve' | 'reject' | 'flag' | 'delete') => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    
    toast({
      title: `Action: ${action.toUpperCase()}`,
      description: `"${item?.title}" has been ${action === 'delete' ? 'purged' : action + 'd'}.`,
      variant: action === 'reject' || action === 'delete' ? 'destructive' : 'default',
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         item.author.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: ModerationType) => {
    switch (type) {
      case 'article': return <FileText className="h-3.5 w-3.5" />;
      case 'comment': return <MessageSquare className="h-3.5 w-3.5" />;
      case 'submission': return <UserPlus className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px] uppercase">Pending</Badge>;
      case 'flagged': return <Badge variant="destructive" className="font-bold text-[10px] uppercase">Flagged</Badge>;
      default: return <Badge variant="outline" className="font-bold text-[10px] uppercase">{status}</Badge>;
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
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">System Integrity</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">Content Moderation</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-500">{items.length} Items Awaiting Review</span>
        </div>
      </header>

      {/* Moderation Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by title or author..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'article', 'comment', 'submission'].map((type) => (
            <Button 
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl font-bold text-[10px] uppercase h-11 px-4 border-white/10"
              onClick={() => setFilterType(type as any)}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Entity Metadata</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse">Scanning Platform Pulse...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    All clear. Platform integrity is currently fully validated.
                  </TableCell>
                </TableRow>
              ) : filteredItems.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate max-w-[250px]">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">By {item.author}</span>
                      {item.content && (
                        <div className="mt-2 p-2 rounded-lg bg-background/50 border border-white/5 text-[10px] italic text-muted-foreground max-w-sm line-clamp-1">
                          "{item.content}"
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 font-bold uppercase text-[9px] h-6">
                        {getTypeIcon(item.type)} {item.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'HH:mm')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary transition-colors"
                        title="Flag for Review"
                        onClick={() => handleAction(item.id, 'flag')}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                        title="Reject/Block"
                        onClick={() => handleAction(item.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                        title="Permanently Delete"
                        onClick={() => handleAction(item.id, 'delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                        onClick={() => handleAction(item.id, 'approve')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Moderation Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Integrity Protocols</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Standard moderation cycle: Items are flagged by AI if sentiment or keyword patterns match known risk profiles. Manual audit is required for final verification.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit">
            <Flag className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Priority Queue</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Items flagged by more than 3 users are automatically escalated to Platform Leads for immediate structural review.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ExternalLink className="h-12 w-12 text-secondary" />
          </div>
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Editorial Standards</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              All expert submissions must contain verified primary source links. If an article is rejected, ensure feedback is synchronized with the Creator Dashboard.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
