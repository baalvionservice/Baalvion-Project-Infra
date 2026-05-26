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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/design-system/typography/text";
import {
  Globe,
  Search,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
  Eye,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Database,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Twitter,
  Linkedin,
  Monitor,
} from 'lucide-react';
import { systemService } from '@/services/data/system-service';
import { SeoManagementData, SeoManagementPage, SitemapEntry, SeoAlertSuggestion } from '@/types/system';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * SEO & Sitemap Management Hub Client.
 * Specialized control suite for orchestrating global discovery and metadata integrity.
 */
export function SeoManagementClient() {
  const [data, setData] = useState<SeoManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("registry");

  // Preview Modal States
  const [previewItem, setPreviewItem] = useState<SeoManagementPage | null>(
    null
  );

  useEffect(() => {
    async function loadData() {
      try {
        const response = await systemService.getSeoManagementData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("SEO state sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    toast({
      title: "Sitemap Cycle Initiated",
      description: "Crawling 1M+ nodes for hierarchical consistency...",
    });

    await new Promise((r) => setTimeout(r, 2000));
    setRegenerating(false);

    toast({
      title: "Handshake Complete",
      description: "XML Sitemap has been synchronized with the master index.",
    });
  };

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Organic Handshake...
        </Text>
      </div>
    );
  }

  const filteredPages = data.seo_pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.page_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10 w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Search className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Organic Kernel</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">SEO & Sitemap Management</Text>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRegenerate}
              disabled={regenerating}
              className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-6 transition-all scale-105 active:scale-95"
            >
              {regenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate XML Sitemap
            </Button>
          </div>
        </header>

        <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl w-full md:w-auto justify-start">
          <TabsTrigger
            value="registry"
            className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
          >
            <Layers className="h-4 w-4" /> SEO Registry
          </TabsTrigger>
          <TabsTrigger
            value="sitemap"
            className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
          >
            <Database className="h-4 w-4" /> Sitemap Matrix
          </TabsTrigger>
          <TabsTrigger
            value="audits"
            className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
          >
            <ShieldAlert className="h-4 w-4" /> Integrity Audits
          </TabsTrigger>
        </TabsList>

        {/* SEO REGISTRY TAB */}
        <TabsContent value="registry" className="mt-0 space-y-6 animate-in fade-in duration-500 outline-none">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-lg">Metadata Intelligence</CardTitle>
                <CardDescription>
                  Auditing individual node-level SEO performance and CTR
                  mapping.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search index slugs..."
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
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Intelligence Path
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Score
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Focus Keywords
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow
                      key={page.page_url}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground/90 leading-tight">
                            {page.title}
                          </span>
                          <span className="text-[9px] font-mono text-primary uppercase mt-1 font-bold">
                            {page.page_url}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={cn(
                              "text-xs font-bold font-mono",
                              Number(page.seo_score) > 85
                                ? "text-emerald-500"
                                : "text-amber-500"
                            )}
                          >
                            {page.seo_score}%
                          </span>
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000",
                                Number(page.seo_score) > 85
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              )}
                              style={{ width: `${page.seo_score}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {page.focus_keywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="outline"
                              className="text-[8px] font-bold border-white/10 bg-background/50 h-5 px-1.5"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all"
                            onClick={() => setPreviewItem(page)}
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:text-secondary transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* SITEMAP TAB */}
        <TabsContent value="sitemap" className="mt-0 space-y-6 animate-in fade-in duration-500 outline-none">
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">XML Sitemap Matrix</CardTitle>
                <CardDescription>
                  Visualizing the hierarchical discovery tree for search engine
                  crawlers.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-[10px] font-bold tracking-widest px-3 h-7"
              >
                99.8% Index Coverage
              </Badge>
            </CardHeader>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-b border-white/5">
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                      Node Path
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Parent Branch
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Crawler Status
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Last Indexing
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sitemap.map((entry) => (
                    <TableRow
                      key={entry.page_url}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/50 border border-white/5 text-muted-foreground group-hover:text-primary transition-all">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-mono font-medium text-foreground/80">
                            {entry.page_url}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-primary/5 text-primary border-none text-[9px] font-bold h-5 px-2"
                        >
                          {entry.parent}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {entry.status === "mock_active" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 font-bold uppercase text-[8px] h-5 px-2">
                              <CheckCircle2 className="h-2 w-2" /> Indexable
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="gap-1 font-bold uppercase text-[8px] h-5 px-2"
                            >
                              <XCircle className="h-2 w-2" /> Blocked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-foreground/70">
                            {entry.last_updated.split(" ")[0]}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {entry.last_updated.split(" ")[1]} UTC
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* AUDITS TAB */}
        <TabsContent value="audits" className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500 outline-none">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Anomaly Triage
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  SEO Conflict Monitoring
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              {data.alerts_suggestions
                .filter((a) => a.alert_type)
                .map((alert, i) => (
                  <Card
                    key={i}
                    className="glass-card border-none bg-destructive/5 hover:bg-destructive/10 transition-all group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-destructive opacity-50" />
                    <CardContent className="p-6 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive shrink-0 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <Text
                            variant="bodySmall"
                            weight="bold"
                            className="text-destructive uppercase tracking-tight"
                          >
                            {alert.alert_type}
                          </Text>
                          <Text
                            variant="caption"
                            className="text-muted-foreground font-mono text-[10px] block"
                          >
                            Target: {alert.page}
                          </Text>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"
                      >
                        Resolve Node
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  AI Optimization
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Ranking Authority Suggestions
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              {data.alerts_suggestions
                .filter((s) => s.suggestion)
                .map((sug, i) => (
                  <Card
                    key={i}
                    className="glass-card border-none bg-primary/5 hover:bg-primary/10 transition-all group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50" />
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        <Text
                          variant="bodySmall"
                          weight="bold"
                          className="text-foreground/90"
                        >
                          {sug.suggestion}
                        </Text>
                      </div>
                      <div className="pl-11">
                        <Text
                          variant="caption"
                          className="text-muted-foreground font-mono text-[9px] flex items-center gap-1.5"
                        >
                          <Globe className="h-2.5 w-2.5" /> {sug.page}
                        </Text>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className="p-8 rounded-[2.5rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group mt-10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Globe className="h-16 w-16 text-secondary" />
              </div>
              <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4" /> Authority Strategy
              </div>
              <Text
                variant="caption"
                className="text-muted-foreground leading-relaxed italic"
              >
                "The Imperialpedia pSEO engine is currently optimizing for
                **Semantic Depth**. Ensure focus keywords are mirrored in the
                H1-H3 hierarchy of intelligence nodes."
              </Text>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* NODE PREVIEW MODAL */}
      <Dialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
      >
        <DialogContent className="max-w-3xl bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 h-6"
              >
                Node Preview Hub
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase">
                  Organic Signal Audit
                </span>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">
              Discovery Simulation: {previewItem?.title.split("|")[0]}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Visualizing how this intelligence node appears across discovery
              clusters.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-10">
            {/* Google Search Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                <Search className="h-3.5 w-3.5" /> SERP Snippet Preview
              </div>
              <div className="p-6 rounded-2xl bg-[#f8f9fa] dark:bg-[#202124] border border-black/5 dark:border-white/5 shadow-inner">
                <div className="text-[14px] text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium mb-1 truncate">
                  {previewItem?.title}
                </div>
                <div className="text-[12px] text-[#006621] dark:text-[#bdc1c6] mb-1">
                  https://imperialpedia.com{previewItem?.page_url}
                </div>
                <div className="text-[13px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
                  {previewItem?.meta_description}
                </div>
              </div>
            </div>

            {/* Social Share Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Twitter/X Card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                  <Twitter className="h-3.5 w-3.5" /> Twitter / X Matrix
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden bg-background/50">
                  <div className="aspect-[1.91/1] bg-muted/30 flex items-center justify-center border-b border-white/5 relative">
                    <FileText className="h-12 w-12 text-white/5" />
                    <div className="absolute bottom-2 left-2 text-[8px] bg-black/60 px-1.5 py-0.5 rounded text-white font-bold uppercase">
                      imperialpedia.com
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="text-xs font-bold text-foreground/90 line-clamp-1">
                      {previewItem?.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {previewItem?.meta_description}
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn Card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0a66c2] font-bold text-[10px] uppercase tracking-widest">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn Node
                </div>
                <div className="rounded-xl border border-white/10 overflow-hidden bg-background/50">
                  <div className="aspect-[1.91/1] bg-muted/20 flex items-center justify-center border-b border-white/5" />
                  <div className="p-4 space-y-1">
                    <div className="text-xs font-bold text-foreground/90 line-clamp-1">
                      {previewItem?.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      IMPERIALPEDIA.COM
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/20 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={() => setPreviewItem(null)}
              className="h-12 px-8 rounded-xl font-bold"
            >
              Close Handshake
            </Button>
            <Button className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
              Update Meta Nodes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
