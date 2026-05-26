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
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  BookOpen,
  ArrowUpRight,
  Loader2,
  ChevronRight,
  Target,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/mock-api/admin";
import { GlossaryTermNode } from "@/types/admin";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function GlossaryManagement() {
  const [terms, setTerms] = useState<GlossaryTermNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const res = await adminService.getGlossary();
      setTerms(res.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleDelete = (id: string) => {
    setTerms((prev) => prev.filter((t) => t.id !== id));
    toast({
      title: "Term Purged",
      description: "Glossary node removed from the index.",
      variant: "destructive",
    });
  };

  if (loading)
    return (
      <div className="py-40 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BookOpen className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Terminology Index
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Financial Glossary
          </Text>
        </div>
        <Button asChild className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Link className="flex" href={'/admin/glossary/new'}>
            <Plus className="mr-2 h-4 w-4" /> Create New Term
          </Link>
        </Button>
      </header>

      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search terms, definitions, or categories..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs"
        >
          <Filter className="h-4 w-4 text-primary" /> Filter Hierarchy
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Glossary Term
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Related Articles
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Search Rank
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms
                .filter((t) =>
                  t.term.toLowerCase().includes(search.toLowerCase())
                )
                .map((term) => (
                  <TableRow
                    key={term.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">
                          {term.term}
                        </span>
                        <span className="text-[9px] text-muted-foreground line-clamp-1 mt-1 max-w-xs">
                          {term.definition}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-primary/5 text-primary border-none text-[10px] font-bold px-3 h-6"
                      >
                        {term.relatedArticles}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-emerald-500">
                      #{term.searchRanking}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-bold uppercase h-5 px-2">
                          Active
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-destructive"
                          onClick={() => handleDelete(term.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
            <Target className="h-24 w-24 text-primary" />
          </div>
          <Text
            variant="bodySmall"
            weight="bold"
            className="text-primary uppercase tracking-widest text-[10px]"
          >
            SEO Mapping
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed italic"
          >
            "Glossary terms are currently driving 42% of first-touch discovery
            traffic. Recommend cross-linking 'Quantitative Easing' to all new
            Macro insights."
          </Text>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 p-8 flex flex-col gap-4">
          <Text
            variant="bodySmall"
            weight="bold"
            className="text-secondary flex items-center gap-2 uppercase tracking-widest text-[10px]"
          >
            <ArrowUpRight className="h-4 w-4" /> Internal Linking Suggestions
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground leading-relaxed"
          >
            Automatic linking is enabled. The pSEO engine suggests 12 new link
            nodes between the Glossary and recent Breaking News articles.
          </Text>
        </Card>
      </div>
    </div>
  );
}
