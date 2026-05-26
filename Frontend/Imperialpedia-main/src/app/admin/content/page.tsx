"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
  Eye,
  Loader2,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminKernel } from "@/lib/services/admin-service";
import { NewsArticle } from "@/lib/data.news";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ContentEmpireManager() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setArticles(adminKernel.getArticles());
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    adminKernel.deleteArticle(id);
    setArticles(adminKernel.getArticles());
    toast({
      title: "Node Purged",
      description: "Article removed from the index.",
      variant: "destructive",
    });
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="py-40 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Layers className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Intelligence Orchestration
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Content Empire
          </Text>
        </div>
        <Button
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
          asChild
        >
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" /> Provision New Node
          </Link>
        </Button>
      </header>

      {/* Toolbar */}
      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search the index by title, slug, or expert..."
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
                  Pages
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Taxonomy Hub
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Lifecycle
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-8">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((article) => (
                <TableRow
                  key={article.id}
                  className="group hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <TableCell className="py-5 pl-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[400px]">
                        {article.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">
                        ID: {article.id} • /{article.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary text-[8px] font-bold uppercase h-5 px-2"
                    >
                      {article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge
                        className={cn(
                          "text-[8px] font-bold uppercase border-none px-2 h-5",
                          article.featured
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {article.featured ? "featured" : "standard"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:text-primary"
                        asChild
                      >
                        <Link href={`/admin/content/${article.slug}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:text-destructive"
                        onClick={() => handleDelete(article.id)}
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
    </div>
  );
}
