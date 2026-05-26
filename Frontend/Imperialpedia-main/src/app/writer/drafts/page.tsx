'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  FileEdit, 
  Trash2, 
  Clock, 
  Plus, 
  Search,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export default function WriterDraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      // Mock loading drafts
      await new Promise(r => setTimeout(r, 600));
      setDrafts([
        { id: 'd-1', title: 'Quantitative Easing vs Tightening', category: 'Economics', updatedAt: new Date().toISOString() },
        { id: 'd-2', title: 'Macro Trends in 2026', category: 'Markets', updatedAt: new Date().toISOString() },
      ]);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">My Personal Studio</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Manage your in-progress intelligence drafts and research.
          </Text>
        </div>
        <Button asChild>
          <Link href="/writer/new"><Plus className="mr-2 h-4 w-4" /> Start New Insight</Link>
        </Button>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Filter your workspace..." 
          className="pl-10 bg-card/30" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Draft Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                  Your workspace is clear. Ready to create the next breakthrough?
                </TableCell>
              </TableRow>
            ) : drafts.map((draft) => (
              <TableRow key={draft.id}>
                <TableCell className="font-bold py-4">{draft.title}</TableCell>
                <TableCell>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {draft.category}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(draft.updatedAt), 'MMM d, HH:mm')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/writer/new">
                        Resume <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
