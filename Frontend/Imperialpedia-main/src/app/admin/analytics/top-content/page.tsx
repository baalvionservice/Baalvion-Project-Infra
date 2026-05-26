"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";
import {
  Trophy,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Download,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { analyticsService } from "@/services/data/analytics-service";
import { TopContent } from "@/types/analytics";
import { Input } from "@/components/ui/input";

/**
 * Top Performing Content Dashboard.
 * Rankings of the platform's high-reach intelligence nodes by views and interaction.
 */
export default function TopPerformingContentPage() {
  const [data, setData] = useState<TopContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await analyticsService.getTopContent();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Failed to sync content leaderboard", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = data.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase"
        >
          Synthesizing Intelligence Leaderboard...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/admin/analytics">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Trophy className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Platform Excellence
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">
              Top Performing Content
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-card/30"
          >
            <Calendar className="mr-2 h-4 w-4" /> 30 Day Window
          </Button>
          <Button
            size="sm"
            className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary"
          >
            <Download className="mr-2 h-4 w-4" /> Export Leaderboard
          </Button>
        </div>
      </header>

      {/* Podium Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.slice(0, 3).map((item, idx) => (
          <Card
            key={item.id}
            className={cn(
              "glass-card border-none relative overflow-hidden group hover:translate-y-[-4px] transition-all",
              idx === 0 ? "md:scale-105 z-10 ring-2 ring-primary/20" : ""
            )}
          >
            {idx === 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-4">
                <Badge
                  className={cn(
                    "border-none text-[10px] font-bold uppercase px-3",
                    idx === 0
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  Rank #{idx + 1}
                </Badge>
                <div className="p-2 rounded-lg bg-background/50 border border-white/5">
                  <TrendingUp
                    className={cn(
                      "h-4 w-4",
                      idx === 0 ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">
                {item.title}
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {item.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <Text variant="label" className="text-[8px] opacity-50">
                    Global Reach
                  </Text>
                  <div className="text-2xl font-bold">
                    {formatCompact(item.views)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                    <ArrowUpRight className="h-3 w-3" /> Viral
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search leaderboard by title or taxonomy..."
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge
          variant="outline"
          className="h-11 px-4 gap-2 border-white/10 bg-background/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
        >
          <Filter className="h-3.5 w-3.5" /> Filter Matrix
        </Badge>
      </div>

      {/* Full Ranking Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="w-16 text-center font-bold text-[10px] uppercase tracking-widest">
                  Rank
                </TableHead>
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">
                  Intelligence Title
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Taxonomy
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Unique Views
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Likes
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">
                  Comments
                </TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">
                  Shares
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow
                  key={item.id}
                  className="group hover:bg-muted/10 transition-colors border-b border-white/5"
                >
                  <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-5 pl-6">
                    <span className="text-sm font-bold truncate max-w-xs block">
                      {item.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 text-[8px] font-bold uppercase py-0 px-1.5 h-4"
                    >
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                    {item.views.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatCompact(item.likes)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatCompact(item.comments)}
                  </TableCell>
                  <TableCell className="text-right pr-6 font-mono text-xs text-primary font-bold">
                    {formatCompact(item.shares)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
