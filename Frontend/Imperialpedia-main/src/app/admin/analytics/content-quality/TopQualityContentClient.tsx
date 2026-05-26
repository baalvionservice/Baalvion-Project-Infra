/**
 * @fileOverview Ranking table for top-quality content nodes.
 */

'use client';

import React, { useState } from 'react';
import { QualityScoredArticle } from '@/types/content-quality';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Trophy, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  Activity, 
  TrendingUp,
  FileText,
  User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { QualityScoreGauge } from '@/modules/content-engine/components/QualityScoring/QualityScoreGauge';
import Link from 'next/link';

interface TopQualityContentClientProps {
  articles: QualityScoredArticle[];
}

export function TopQualityContentClient({ articles }: TopQualityContentClientProps) {
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden">
      <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Intelligence Leaderboard
          </CardTitle>
          <CardDescription>Top 100 intelligence nodes by quality and engagement reach.</CardDescription>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search quality index..." 
            className="pl-10 h-10 bg-background/50 border-white/10 rounded-xl text-xs" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20 border-b border-white/5">
              <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Intelligence Node</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Quality Score</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest">Trust Badges</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Engagement</TableHead>
              <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                <TableCell className="py-5 pl-8">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[300px]">{item.title}</span>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                      <User className="h-2.5 w-2.5" /> {item.author} • {item.category}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <QualityScoreGauge score={item.quality_score} size="sm" showLabel={false} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {item.badges.map(badge => (
                      <Badge key={badge} variant="outline" className="text-[8px] font-bold border-primary/20 bg-primary/5 text-primary uppercase h-5 px-1.5">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center font-mono text-xs font-bold text-foreground/80">
                  {item.engagement.toLocaleString()}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all" asChild>
                    <Link href={`/articles/${item.slug}`}>
                      Audit Node <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
