"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  CheckCircle2,
  ExternalLink,
  User,
  Calendar,
  Search,
  Loader2,
} from "lucide-react";
import { getArticles } from "@/modules/content-engine/services";
import { Article } from "@/modules/content-engine/types";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { format } from "date-fns";

export default function ApprovedArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getArticles(1, 100);
        // Only show published/approved articles
        setArticles(response.data.filter((a) => a.status === "published"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header>
        <Text variant="h1" className="text-3xl font-bold">
          Approved Intelligence Index
        </Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          A historical record of all expert analysis published to the
          Imperialpedia platform.
        </Text>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter published insights..."
          className="pl-10 bg-card/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Article Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead>Expert</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground italic"
                >
                  No published articles found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((article) => (
                <TableRow key={article.id} className="group">
                  <TableCell className="font-bold py-4">
                    <div className="flex flex-col">
                      <span className="text-sm">{article.title}</span>
                      <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Published &
                        Indexed
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold"
                    >
                      {article.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {article.publishedAt
                      ? format(new Date(article.publishedAt), "MMM d, yyyy")
                      : "Not published"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {article.authorId.charAt(0)}
                      </div>
                      <span className="text-xs">{article.authorId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="text-primary hover:underline text-xs inline-flex items-center"
                    >
                      View Live <ExternalLink className="ml-1.5 h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
