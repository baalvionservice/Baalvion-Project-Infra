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
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { getCmsDashboardData } from "@/services/mock-api/admin-cms";
import { CMSContentItem } from "@/types/system";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Content Empire Management Matrix.
 * Orchestrates the full lifecycle of published and draft intelligence nodes.
 */
export default function ContentEmpirePage() {
  const [content, setContent] = useState<CMSContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getCmsDashboardData();
        if (response.data) setContent(response.data.cms_content);
      } catch (e) {
        console.error("Content matrix sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredContent = content.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.author.toLowerCase().includes(search.toLowerCase())
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
              Index Governance
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Content Empire
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 h-11 px-6 bg-card/30"
          >
            <Filter className="mr-2 h-4 w-4" /> Taxonomy Filter
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Provision New Node
          </Button>
        </div>
      </header>

      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-20 z-30 shadow-lg">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search the 1M+ node index by title, slug, or expert..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Intelligence Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Expert Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Lifecycle
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Last Handshake
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text
                      variant="caption"
                      className="mt-4 block animate-pulse font-bold tracking-widest uppercase"
                    >
                      Indexing Content Matrix...
                    </Text>
                  </TableCell>
                </TableRow>
              ) : filteredContent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground italic"
                  >
                    No matching research nodes found in current search buffer.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContent.map((item) => (
                  <TableRow
                    key={item.content_id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-all">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors truncate max-w-[300px] block">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">
                            ID: {item.content_id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
                          {item.author.charAt(0)}
                        </div>
                        <span className="text-xs font-medium">
                          {item.author}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge
                          className={cn(
                            "text-[9px] font-bold uppercase border-none h-5 px-2",
                            item.status === "Published"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : item.status === "Review"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.last_updated}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-primary transition-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:text-destructive transition-all"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Plus className="h-24 w-24 text-primary" />
          </div>
          <div>
            <Text
              variant="bodySmall"
              weight="bold"
              className="text-primary flex items-center gap-2"
            >
              <Zap className="h-4 w-4" /> Node Provisioning
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-2 leading-relaxed italic"
            >
              "Research nodes created via the Admin Console bypass the standard
              author vetting queue and are prioritized for immediate pSEO
              ingestion."
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 p-8 flex flex-col gap-4">
          <div>
            <Text
              variant="bodySmall"
              weight="bold"
              className="text-secondary flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Index Integrity
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground mt-2 leading-relaxed"
            >
              Every node commit is cryptographically signed and logged in the
              **Audit Trail**. Deleting a node initiates a recursive cache-burst
              across global CDN edge nodes.
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto text-secondary text-xs font-bold mt-4 group"
              asChild
            >
              <Link href="/admin/control/audit-trail">
                View Access Logs{" "}
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
