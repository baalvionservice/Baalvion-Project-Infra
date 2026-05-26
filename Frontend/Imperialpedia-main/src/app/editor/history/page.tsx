'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  FileSearch, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Clock,
  Loader2,
  ArrowRight,
  Search
} from 'lucide-react';
import { getReviewHistory } from '@/services/mock-api/audit';
import { ReviewAction } from '@/modules/content-engine/types/article';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import Link from 'next/link';

export default function EditorHistoryPage() {
  const [history, setHistory] = useState<ReviewAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await getReviewHistory();
        setHistory(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.articleTitle.toLowerCase().includes(search.toLowerCase()) ||
    item.userName.toLowerCase().includes(search.toLowerCase()) ||
    (item.comment || '').toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase">Approved</Badge>;
      case 'changes_requested': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold uppercase">Revision</Badge>;
      case 'submitted': return <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">Submitted</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold uppercase">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Review History</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Tracking every editorial milestone in the publishing engine.
          </Text>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">Platform Velocity: 4.2h Avg.</span>
        </div>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Filter history by article or editor..." 
          className="pl-10 bg-card/30" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Article</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Feedback / Comment</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredHistory.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/20">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate max-w-[200px]">{item.articleTitle}</span>
                    <Link href={`/editor/review/${item.articleId}`} className="text-[10px] text-primary hover:underline flex items-center mt-1">
                      View article state <ArrowRight className="ml-1 h-2 w-2" />
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(item.action)}</TableCell>
                <TableCell>
                  {item.comment ? (
                    <div className="flex items-start gap-2 max-w-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground italic line-clamp-2">{item.comment}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">No feedback provided</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-[10px] font-bold">
                      {item.userName.charAt(0)}
                    </div>
                    <span className="text-xs">{item.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold">{format(new Date(item.timestamp), 'MMM d')}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(item.timestamp), 'HH:mm')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quality Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="caption" className="text-muted-foreground">98% of articles approved in the last 30 days met the Intelligence Index factual standards without revision.</Text>
          </CardContent>
        </Card>
        
        <Card className="glass-card bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Sourcing Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="caption" className="text-muted-foreground">Most revision requests (65%) are due to missing primary source links for central bank interest rate projections.</Text>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
