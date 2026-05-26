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
import Link from "next/link";

interface Pages {
  id: string;
  slug: string;
  title: string;
  articlesCount: number;
}

export default function PagesManager() {
  const [pages, setPages] = useState<Pages[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPages(adminKernel.getPages());
    setLoading(false);
  }, []);

  const filtered = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(search.toLowerCase()) ||
      page.slug.toLowerCase().includes(search.toLowerCase())
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
              Content Management System
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Pages Overview
          </Text>
        </div>
        <Button
          className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95"
          asChild
        >
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" /> Create New Content
          </Link>
        </Button>
      </header>

      {/* Toolbar */}
      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search pages by title or slug..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-12 px-6 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs"
        >
          <Filter className="h-4 w-4 text-primary" /> Filter Categories
        </Button>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Page Title
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Slug
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Articles Count
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right pr-8">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((page) => (
                <TableRow
                  key={page.id}
                  className="group hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/admin/content/${page.slug}`)
                  }
                >
                  <TableCell className="py-5 pl-8">
                    <span className="text-lg font-bold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[400px]">
                      {page.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary text-[8px] font-bold uppercase h-5 px-2"
                    >
                      {page.slug}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="text-xs font-bold">
                        {page.articlesCount}
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
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/admin/content/${page.slug}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-3.5 w-3.5" />
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
