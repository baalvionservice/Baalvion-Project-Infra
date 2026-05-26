"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/design-system/typography/text";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  BarChart3,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Users,
  ChevronRight,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { getEditorialDashboardData } from "@/services/mock-api/editorial";
import { EditorialDashboardData } from "@/types/editorial";
import { cn } from "@/lib/utils";

/**
 * Editorial Mission Control Dashboard.
 * Specialized hub for monitoring the content lifecycle and auditor performance.
 */
export default function EditorialDashboardPage() {
  const [data, setData] = useState<EditorialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getEditorialDashboardData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Editorial sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text
          variant="bodySmall"
          className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground"
        >
          Establishing Editorial Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Editorial Command
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Mission Control
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-11 px-6 border-white/10 bg-card/30"
            asChild
          >
            <Link href="/editor/activity-log">
              <History className="mr-2 h-4 w-4" /> Audit Trail
            </Link>
          </Button>
          <Button
            className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
            asChild
          >
            <Link href="/editor/queue">Enter Review Queue</Link>
          </Button>
        </div>
      </header>

      {/* Aggregate Workflow Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          {
            label: "Submitted",
            value: data.metrics.submitted,
            icon: FileText,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "In Review",
            value: data.metrics.under_review,
            icon: Activity,
            color: "text-secondary",
            bg: "bg-secondary/5",
          },
          {
            label: "Approved",
            value: data.metrics.approved,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Revisions",
            value: data.metrics.revisions,
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
          {
            label: "Published",
            value: data.metrics.published_recently,
            icon: Send,
            color: "text-primary",
            bg: "bg-primary/5",
          },
        ].map((m) => (
          <Card
            key={m.label}
            className={cn("glass-card border-none shadow-xl", m.bg)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
              <m.icon className={cn("h-5 w-5", m.color)} />
              <div className="text-3xl font-bold tracking-tighter">
                {m.value}
              </div>
              <Text
                variant="label"
                className="text-[8px] opacity-50 uppercase font-bold tracking-widest"
              >
                {m.label}
              </Text>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RECENT SUBMISSIONS PREVIEW */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h3" className="font-bold">
                  Priority Triage
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  High-Impact Nodes Awaiting Audit
                </Text>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-bold text-xs"
              asChild
            >
              <Link href="/editor/queue">
                Full Queue Matrix <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {data.submissions.slice(0, 3).map((sub) => (
              <Card
                key={sub.id}
                className="glass-card border-none shadow-xl hover:border-primary/20 transition-all group overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="text-[8px] font-bold uppercase border-primary/20 bg-primary/5 text-primary"
                        >
                          {sub.category}
                        </Badge>
                        <Text
                          variant="label"
                          className="text-[10px] text-muted-foreground font-mono"
                        >
                          ID: {sub.id}
                        </Text>
                      </div>
                      <Text
                        variant="body"
                        weight="bold"
                        className="block text-lg group-hover:text-primary transition-colors leading-tight"
                      >
                        {sub.title}
                      </Text>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" /> By {sub.author}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-primary" />{" "}
                          {sub.word_count} Words
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <Text
                          variant="label"
                          className="text-[8px] opacity-50 font-bold uppercase"
                        >
                          Lifecycle
                        </Text>
                        <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[8px] h-5 px-2">
                          {sub.status}
                        </Badge>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-xl bg-background/50 hover:bg-primary/10 hover:text-primary transition-all"
                        asChild
                      >
                        <Link href={`/editor/review/${sub.id}`}>
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SIDEBAR: TEAM & STRATEGY */}
        <aside className="lg:col-span-4 space-y-10">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="h-4 w-4" /> Editorial Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.editors.map((ed) => (
                <div key={ed.id} className="space-y-3 group cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg border border-white/5">
                        <AvatarImage src={ed.avatar} />
                        <AvatarFallback>{ed.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Text
                          variant="bodySmall"
                          weight="bold"
                          className="group-hover:text-primary transition-colors"
                        >
                          {ed.name}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-muted-foreground text-[9px] uppercase font-bold tracking-tighter"
                        >
                          {ed.expertise}
                        </Text>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary border-none text-[9px] font-mono font-bold"
                    >
                      {ed.articles_assigned} Nodes
                    </Badge>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-1000"
                      style={{ width: `${ed.review_progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="p-4 bg-muted/10 border-t border-white/5">
              <Button
                variant="ghost"
                className="w-full h-10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none"
                asChild
              >
                <Link href="/editor/assignments">Manage Assignments</Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="h-16 w-16 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <Target className="h-4 w-4" /> Strategy Peak
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic block"
            >
              "The Imperialpedia index is currently prioritizing **Macroeconomic
              Audits**. Submissions in this taxonomy receive 4-hour review
              priority."
            </Text>
          </div>
        </aside>
      </div>
    </div>
  );
}
