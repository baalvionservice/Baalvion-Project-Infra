"use client";

import React, { useEffect, useState, use } from "react";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { getVersionHistory } from "@/services/mock-api/version-control";
import { VersionControlData, ArticleVersion } from "@/types/version-control";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import {
  History,
  RotateCcw,
  GitCompare,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  ArrowLeftRight,
  Info,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  User,
  Clock,
  Save,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { VersionComparator } from "@/modules/content-engine/components/VersionControl/VersionComparator";
import { EditTimeline } from "@/modules/content-engine/components/VersionControl/EditTimeline";
import { VersionMetadata } from "@/modules/content-engine/components/VersionControl/VersionMetadata";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Content Version Control Hub.
 * Specialized terminal for auditing the evolution of financial intelligence research.
 */
export default function VersionHistoryPage({ params }: PageProps) {
  const { id } = use(params);
  const [data, setData] = useState<VersionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(
    null
  );
  const [comparingWith, setComparingWith] = useState<ArticleVersion | null>(
    null
  );
  const [viewMode, setActiveMode] = useState<"list" | "compare">("list");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getVersionHistory(id);
        if (response.data) {
          setData(response.data);
          setSelectedVersion(
            response.data.versions[response.data.versions.length - 1]
          );
          setComparingWith(
            response.data.versions[response.data.versions.length - 2]
          );
        }
      } catch (e) {
        console.error("Handshake failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRestore = (version: string) => {
    toast({
      title: "State Reversion Initiated",
      description: `Reverting intelligence node to version ${version}. All clusters synchronized.`,
    });
  };

  const handleAction = (label: string) => {
    toast({
      title: "Governance Action",
      description: `Targeting node: ${label}`,
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
          Establishing Historical Handshake...
        </Text>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[8px] h-5 px-2">
            Published
          </Badge>
        );
      case "Archived":
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-white/10 text-[8px] font-bold uppercase h-5 px-2"
          >
            Archived
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary border-none text-[8px] font-bold uppercase h-5 px-2"
          >
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href={`/editor/review/${id}`}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <History className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Version Control Console
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Audit Archive: {data.articleTitle}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={cn(
              "rounded-xl border-white/10 bg-card/30 h-11 px-6 font-bold text-xs gap-2 transition-all",
              viewMode === "compare"
                ? "bg-primary text-white border-primary"
                : "text-muted-foreground"
            )}
            onClick={() =>
              setActiveMode(viewMode === "list" ? "compare" : "list")
            }
          >
            <GitCompare className="h-4 w-4" />
            {viewMode === "compare" ? "Exit Comparison" : "Compare Versions"}
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8">
            <Save className="mr-2 h-4 w-4" /> Save as New Baseline
          </Button>
        </div>
      </header>

      {viewMode === "compare" ? (
        <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between bg-card/30 p-6 rounded-[2rem] border border-white/5">
            <div className="flex items-center gap-10">
              <div className="space-y-1">
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                >
                  Base Node
                </Text>
                <Select
                  value={comparingWith?.id}
                  onValueChange={(val) =>
                    setComparingWith(
                      data.versions.find((v) => v.id === val) || null
                    )
                  }
                >
                  <SelectTrigger className="bg-background/50 h-10 border-white/5 rounded-xl font-bold text-xs w-48">
                    <SelectValue placeholder="Select Base" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version} — {v.date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground mt-4" />
              <div className="space-y-1">
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                >
                  Head Node
                </Text>
                <Select
                  value={selectedVersion?.id}
                  onValueChange={(val) =>
                    setSelectedVersion(
                      data.versions.find((v) => v.id === val) || null
                    )
                  }
                >
                  <SelectTrigger className="bg-background/50 h-10 border-white/5 rounded-xl font-bold text-xs w-48">
                    <SelectValue placeholder="Select Head" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        v{v.version} — {v.date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <Text variant="caption" className="text-muted-foreground italic">
                "Audit mode active. Highlighting structural deviations between
                iterations."
              </Text>
            </div>
          </div>

          <VersionComparator
            versionA={comparingWith!}
            versionB={selectedVersion!}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* VERSION LEDGER */}
          <div className="lg:col-span-8 space-y-10">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-8">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Layers className="h-6 w-6 text-primary" /> version Ledger
                </CardTitle>
                <CardDescription>
                  Full iterative history of the intelligence node.
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 border-b border-white/5">
                      <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                        Identity Node
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                        Auditor signature
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                        Handshake Summary
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                        Lifecycle
                      </TableHead>
                      <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.versions.map((v) => (
                      <TableRow
                        key={v.id}
                        className={cn(
                          "group hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer",
                          selectedVersion?.id === v.id
                            ? "bg-primary/5 border-primary/20"
                            : ""
                        )}
                        onClick={() => setSelectedVersion(v)}
                      >
                        <TableCell className="py-5 pl-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground/90">
                              v{v.version}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono mt-1">
                              {v.date}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium">
                              {v.editor}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-xs text-muted-foreground truncate block italic">
                            "{v.summary}"
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {getStatusBadge(v.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-secondary transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(v.version);
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction("Archive");
                              }}
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h3" className="font-bold">
                    Evolution Timeline
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    Instructional Development Pulse
                  </Text>
                </div>
              </div>
              <EditTimeline milestones={data.timeline} />
            </div>
          </div>

          {/* SIDEBAR: METADATA & CONTEXT */}
          <div className="lg:col-span-4 space-y-10">
            {selectedVersion && (
              <div className="animate-in slide-in-from-right-4 duration-500">
                <VersionMetadata
                  metadata={selectedVersion.metadata}
                  version={selectedVersion.version}
                />
              </div>
            )}

            <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Zap className="h-16 w-16 text-secondary rotate-12" />
              </div>
              <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
                <Info className="h-4 w-4" /> Restore Logic
              </div>
              <Text
                variant="caption"
                className="text-muted-foreground leading-relaxed"
              >
                Reverting a node state triggers an immutable **Rollback Entry**
                in the Audit Trail. The previous 'Published' version is archived
                but maintained in the deep-storage cluster for 365 days.
              </Text>
              <Button
                variant="link"
                className="p-0 h-auto text-secondary text-xs font-bold group/link"
                asChild
              >
                <Link href="/admin/control/audit-trail">
                  Review Platform Audits{" "}
                  <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </Button>
            </div>

            <Card className="glass-card border-none bg-primary/5 shadow-xl">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Text
                    variant="h4"
                    className="font-bold uppercase tracking-widest text-xs"
                  >
                    Integrity verified
                  </Text>
                </div>
                <Text
                  variant="caption"
                  className="text-muted-foreground leading-relaxed italic block"
                >
                  "Every version commit is cryptographically signed by the
                  auditor signature. Version 1.1 remains the primary discovery
                  baseline for the public index."
                </Text>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
