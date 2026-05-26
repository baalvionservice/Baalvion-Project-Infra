'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  FileSearch, 
  User, 
  Clock, 
  ArrowRight,
  Loader2,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { getSubmittedArticles } from '@/services/mock-api/articles';
import { SubmittedArticle } from '@/modules/content-engine/types/article';

export default function PendingReviewsPage() {
  const [pending, setPending] = useState<SubmittedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSubmittedArticles();
        setPending(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Review Queue</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Prioritize expert submissions for platform-wide publishing.
          </Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter Queue
          </Button>
        </div>
      </header>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Article Submission</TableHead>
              <TableHead>Expert</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Complexity</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  Review queue is empty. Platform integrity is fully validated.
                </TableCell>
              </TableRow>
            ) : pending.map((article) => (
              <TableRow key={article.id} className="group hover:bg-muted/20">
                <TableCell className="font-bold py-4">
                  <div className="flex flex-col">
                    <span className="text-sm">{article.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {article.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs">{article.authorId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                    <Clock className="h-3.5 w-3.5" /> 4.2h
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/editor/review/${article.id}`}>
                      Open Review <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
