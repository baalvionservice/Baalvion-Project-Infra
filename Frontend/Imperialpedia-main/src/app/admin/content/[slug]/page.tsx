"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ArrowLeft,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Layers,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminKernel } from "@/lib/services/admin-service";
import { NewsArticle } from "@/lib/data.news";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PageContentManager() {
  const params = useParams();
  const router = useRouter();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageInfo, setPageInfo] = useState<{
    title: string;
    slug: string;
    articlesCount: number;
  } | null>(null);

  useEffect(() => {
    const slug = params.slug as string;
    console.log("Slug from params:", slug);

    // Get page info
    const page = adminKernel.getPageBySlug(slug);
    console.log("Found page:", page);

    if (!page) {
      toast({
        title: "Page Not Found",
        description: "The requested page could not be found.",
        variant: "destructive",
      });
      router.push("/admin/pages");
      return;
    }

    setPageInfo(page);

    // Get articles for this page
    const pageArticles = adminKernel.getArticlesByPageSlug(slug);
    console.log("Found articles:", pageArticles);
    setArticles(pageArticles);
    setLoading(false);
  }, [params.slug, router]);

  const handleDelete = (id: string) => {
    adminKernel.deleteArticle(id);
    // Refresh articles for this page
    const slug = params.slug as string;
    const pageArticles = adminKernel.getArticlesByPageSlug(slug);
    setArticles(pageArticles);
    toast({
      title: "Article Deleted",
      description: "Article removed successfully.",
      variant: "destructive",
    });
  };

  const filtered = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.category.toLowerCase().includes(search.toLowerCase()) ||
      article.author.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Layers className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Content Management
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              {pageInfo?.title} Articles
            </Text>
            <Text variant="body" className="text-muted-foreground">
              Slug: /{pageInfo?.slug} • {articles.length} articles found
            </Text>
          </div>
        </div>
        <Button
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
          asChild
        >
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" /> Create New Article
          </Link>
        </Button>
      </header>

      {/* Toolbar */}
      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search articles by title, category, or author..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs"
        >
          <Filter className="h-4 w-4 text-primary" /> Filter Articles
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Article
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Category
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Author
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-8">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Text variant="body" className="text-muted-foreground">
                        No articles found for this page
                      </Text>
                      <Button variant="outline" asChild>
                        <Link href="/admin/content/new">
                          Create First Article
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((article) => (
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
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {article.author.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.author.title}
                        </span>
                      </div>
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
                          <Link href={`/admin/content/${article.slug}/edit`}>
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary"
                          asChild
                        >
                          <Link href={`/${article.slug}`} target="_blank">
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
