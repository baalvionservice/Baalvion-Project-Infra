"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Search,
  Edit3,
  Plus,
  ChevronRight,
  RefreshCcw,
  BarChart3,
  Target,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * SEO Authority Terminal: Global Metadata & Discoverability Management.
 * Manages the Multi-Market SEO Matrix, Hreflang logic, and search authority scores.
 */
export default function SEOAdminHub() {
  const { seoRegistry, upsertSEOMetadata } = useAppStore();
  const [selectedPath, setSelectedPath] = useState(seoRegistry[0]?.path);

  const currentMeta = seoRegistry.find((m) => m.path === selectedPath);

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Target className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Layer 4
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            SEO Authority
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Orchestrating global discoverability and multi-market search
            indexing.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="h-14 px-10 rounded-none bg-blue-600 text-white hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/20">
            <Plus className="w-4 h-4 mr-3" /> REGISTER NEW PATH
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatsTile
          label="Indexed Paths"
          value={seoRegistry.length}
          trend="Active"
          icon={<Globe />}
        />
        <StatsTile
          label="Mean Ranking"
          value="#1.4"
          trend="Optimal"
          icon={<BarChart3 />}
        />
        <StatsTile
          label="Authority Score"
          value="98%"
          trend="Institutional"
          icon={<ShieldCheck />}
        />
        <StatsTile
          label="Crawl Frequency"
          value="12m"
          trend="High Velocity"
          icon={<Clock />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Sitemap Registry Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-[#111113] border-white/5 shadow-2xl rounded-none overflow-hidden h-[70vh] flex flex-col">
            <CardHeader className="border-b border-white/5 bg-white/5 p-6">
              <CardTitle className="text-white font-headline text-xl italic uppercase">
                Discovery Matrix
              </CardTitle>
              <CardDescription className="text-[9px] uppercase tracking-widest text-white/20">
                Registered high-authority market paths
              </CardDescription>
            </CardHeader>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {seoRegistry.map((meta) => (
                <button
                  key={meta.id}
                  onClick={() => setSelectedPath(meta.path)}
                  className={cn(
                    "w-full text-left px-6 py-4 transition-all rounded-none border group",
                    selectedPath === meta.path
                      ? "bg-white/5 text-white border-blue-500/40 shadow-xl"
                      : "text-white/30 border-transparent hover:bg-white/[0.02] hover:text-white"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                      {meta.path}
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-3 h-3 transition-transform",
                        selectedPath === meta.path
                          ? "text-blue-400 rotate-90"
                          : "text-white/10 group-hover:text-white/30"
                      )}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[7px] font-mono uppercase text-white/10">
                      {meta.country.toUpperCase()} HUB
                    </span>
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-black text-white p-8 space-y-6 shadow-2xl relative overflow-hidden border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Zap className="w-32 h-32 text-blue-500" />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400">
              Hreflang Logic
            </h4>
            <p className="text-xs font-light italic leading-relaxed opacity-60">
              "Automated mapping of cross-market nodes is active. Search engines
              are directed to jurisdictional versions of all registry entries."
            </p>
            <div className="pt-4 border-t border-white/10">
              <Button
                variant="outline"
                className="w-full h-10 border-white/10 text-white/40 hover:bg-white hover:text-black rounded-none text-[9px] font-bold uppercase tracking-widest"
              >
                REFRESH HREFLANG MAP
              </Button>
            </div>
          </Card>
        </aside>

        {/* Path Metadata Editor */}
        <main className="lg:col-span-8 space-y-8">
          {currentMeta ? (
            <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-blue-400 text-[10px] font-bold tracking-[0.5em] uppercase">
                      Metadata Authority
                    </span>
                    <CardTitle className="text-white font-headline text-4xl italic tracking-tighter uppercase leading-none">
                      Edit Path: {currentMeta.path}
                    </CardTitle>
                  </div>
                  <Link href={currentMeta.path} target="_blank">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/20 hover:text-white"
                    >
                      <ExternalLink size={18} />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">
                      Primary Title (SERP)
                    </Label>
                    <Input
                      value={currentMeta.title}
                      onChange={(e) =>
                        upsertSEOMetadata({
                          ...currentMeta,
                          title: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 h-14 text-white text-sm font-bold rounded-none focus:border-blue-500"
                    />
                    <p className="text-[7px] text-white/20 uppercase font-bold text-right">
                      {currentMeta.title.length}/60 chars
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">
                      Target Keyword
                    </Label>
                    <Input
                      value={currentMeta.keywords}
                      onChange={(e) =>
                        upsertSEOMetadata({
                          ...currentMeta,
                          keywords: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 h-14 text-white text-sm font-mono rounded-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[9px] uppercase font-bold tracking-widest text-white/40">
                    Institutional Meta Description
                  </Label>
                  <Textarea
                    value={currentMeta.description}
                    onChange={(e) =>
                      upsertSEOMetadata({
                        ...currentMeta,
                        description: e.target.value,
                      })
                    }
                    className="bg-white/5 border-white/10 min-h-[120px] text-white text-sm italic font-light rounded-none focus:border-blue-500 p-6 leading-relaxed"
                  />
                  <p className="text-[7px] text-white/20 uppercase font-bold text-right">
                    {currentMeta.description.length}/160 chars
                  </p>
                </div>

                <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-[9px] font-bold uppercase tracking-widest text-white/20">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Index Authority: High</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Canonical Sync: OK</span>
                    </div>
                  </div>
                  <Button className="h-14 px-12 bg-white text-black hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest shadow-2xl rounded-none">
                    SAVE AUTHORITY CONFIG
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-[500px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-20 space-y-6 rounded-none">
              <Search className="w-16 h-16 text-white" />
              <p className="text-xl font-headline font-bold italic text-white">
                Select an Indexed Path
              </p>
            </div>
          )}

          {/* SEO Performance Signals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none shadow-xl">
              <div className="flex items-center space-x-3 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">
                  Index Resilience
                </h4>
              </div>
              <p className="text-xs text-white/40 italic leading-relaxed">
                "Institutional paths are re-indexed every 24 hours. No
                significant ranking volatility detected in the last 30-day
                window."
              </p>
            </Card>
            <Card className="bg-red-500/5 border border-red-500/20 p-8 space-y-6 rounded-none shadow-xl">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">
                  Authority Gaps
                </h4>
              </div>
              <p className="text-xs text-white/40 italic leading-relaxed">
                "Missing Hindi translations detected for 42 regional product
                nodes in the India hub. Potential ranking risk."
              </p>
              <Button
                variant="outline"
                className="w-full h-10 border-red-900/40 text-red-400 text-[8px] font-bold uppercase hover:bg-red-600 hover:text-white rounded-none"
              >
                TRIGGER AI TRANSLATION SYNC
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatsTile({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: any;
  trend: string;
  icon: any;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-6 space-y-4 hover:border-blue-500/40 transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">
          {label}
        </span>
        <div className="text-white/20">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
        </div>
      </div>
      <div className="text-3xl font-headline font-bold italic text-white tabular">
        {value}
      </div>
      <div className="flex items-center text-[8px] font-bold text-blue-400 uppercase tracking-widest">
        <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
      </div>
    </Card>
  );
}
