"use client";

import React, { useState } from "react";
import { EditorialSubmission, RevisionDirective } from "@/types/editorial";
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
import { Text } from "@/design-system/typography/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Clock,
  History,
  Info,
  Zap,
  Activity,
  Target,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Scale,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ReviewConsoleProps {
  submission: EditorialSubmission;
}

/**
 * Specialized Editorial Review interface for auditors.
 * Features full content preview, quality matrix, and revision architect.
 */
export function ReviewConsole({ submission }: ReviewConsoleProps) {
  const [activeTab, setActiveTab] = useState<"content" | "audit" | "revision">(
    "content"
  );
  const [processing, setProcessing] = useState(false);

  const handleDecision = async (action: string) => {
    setProcessing(true);
    // Simulate vertical escalation/commit
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);

    toast({
      title: "Decision Committed",
      description: `Action "${action}" has been broadcast to the identity cluster.`,
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href="/editor/queue">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Scale className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Auditor Console
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Review Node: {submission.id}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-white/10 h-11 px-6 bg-card/30"
            asChild
          >
            <Link href={`/editor/review/${submission.id}/history`}>
              <History className="mr-2 h-4 w-4" /> Version History
            </Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-destructive/20 text-destructive h-11 px-6 bg-destructive/5"
            onClick={() => handleDecision("Reject")}
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject Node
          </Button>
          <Button
            variant="outline"
            className="rounded-xl border-white/10 h-11 px-6 bg-card/30"
            onClick={() => setActiveTab("revision")}
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Request Revision
          </Button>
          <Button
            className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-emerald-900/20 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => handleDecision("Approve")}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Index
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* MAIN AUDIT WORKSPACE */}
        <div className="lg:col-span-8 space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="space-y-8"
          >
            <TabsList className="bg-card/30 border border-white/5 p-1 h-14 rounded-2xl w-full md:w-auto justify-start">
              <TabsTrigger
                value="content"
                className="px-8 h-12 gap-2 text-sm font-bold rounded-xl data-[state=active]:bg-primary"
              >
                <FileText className="h-4 w-4" /> Intelligence Preview
              </TabsTrigger>
              <TabsTrigger
                value="audit"
                className="px-8 h-12 gap-2 text-sm font-bold rounded-xl data-[state=active]:bg-primary"
              >
                <ShieldCheck className="h-4 w-4" /> Credentials Audit
              </TabsTrigger>
              <TabsTrigger
                value="revision"
                className="px-8 h-12 gap-2 text-sm font-bold rounded-xl data-[state=active]:bg-primary"
              >
                <Activity className="h-4 w-4" /> Revision Architect
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="content"
              className="mt-0 animate-in fade-in duration-500"
            >
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="p-10 border-b border-white/5 space-y-6">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="secondary"
                      className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase px-3 h-6"
                    >
                      {submission.category} Node
                    </Badge>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> 8m Read Depth
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" />{" "}
                        {submission.word_count} Words
                      </span>
                    </div>
                  </div>
                  <Text
                    variant="h2"
                    className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
                  >
                    {submission.title}
                  </Text>
                  <Text
                    variant="body"
                    className="text-xl text-muted-foreground italic leading-relaxed max-w-3xl"
                  >
                    "This research node examines the structural decoupling of
                    interest rate benchmarks from consumer inflation targets
                    within the G7 cluster..."
                  </Text>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="prose prose-invert max-w-none space-y-6 text-foreground/80 leading-relaxed text-lg">
                    <p>
                      In the current fiscal cycle, we are witnessing a
                      significant deviation in standard central bank behavior.
                      Historically, the 2-10 year spread has served as the
                      primary indicator for subsequent fiscal contraction.
                      However, the current liquidity buffer provided by the
                      algorithmic rebalancing of institutional nodes has created
                      a synthetic floor.
                    </p>
                    <p>
                      Analysis of recent FOMC minutes indicates a 'Higher for
                      Longer' stance that doesn't account for the accelerating
                      velocity of decentralized lending protocols. This research
                      proposes that the standard Phillips Curve logic is
                      outdated in a post-tokenization market structure.
                    </p>
                    <div className="p-8 rounded-3xl bg-background/50 border border-white/5 border-dashed text-center">
                      <Text
                        variant="caption"
                        className="text-muted-foreground italic"
                      >
                        Full article body continues for {submission.word_count}{" "}
                        words...
                      </Text>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="audit"
              className="mt-0 animate-in fade-in duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass-card border-none shadow-xl bg-card/30">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Expert Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-5">
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-background ring-1 ring-white/10 shadow-xl">
                        <AvatarImage
                          src={`https://picsum.photos/seed/${submission.author}/100/100`}
                        />
                        <AvatarFallback>
                          {submission.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Text variant="h4" className="font-bold text-xl">
                          {submission.author}
                        </Text>
                        <Text
                          variant="caption"
                          className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]"
                        >
                          Verified Contributor
                        </Text>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Trust Score</span>
                        <span className="text-emerald-500">
                          {submission.trust_score}%
                        </span>
                      </div>
                      <Progress
                        value={submission.trust_score}
                        className="h-1 bg-white/5"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-xl bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Quality Synthesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="text-center space-y-2">
                      <div className="text-5xl font-bold tracking-tighter text-primary">
                        {submission.quality_score}
                      </div>
                      <Text
                        variant="label"
                        className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                      >
                        Aggregate Score
                      </Text>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5 text-center">
                        <span className="text-xs font-bold block">
                          Excellent
                        </span>
                        <span className="text-[8px] text-muted-foreground uppercase">
                          Grammar
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50 border border-white/5 text-center">
                        <span className="text-xs font-bold block">
                          Verified
                        </span>
                        <span className="text-[8px] text-muted-foreground uppercase">
                          Sources
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              value="revision"
              className="mt-0 animate-in fade-in duration-500"
            >
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 p-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">
                      Revision Directive Architect
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Internal Memo / Revision Payload
                    </Label>
                    <Textarea
                      placeholder="Explain the required tactical shifts for this research node..."
                      className="bg-background/50 border-white/5 min-h-[150px] resize-none leading-relaxed rounded-2xl italic p-6"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Required Improvements
                      </Label>
                      <div className="space-y-2">
                        {[
                          "Link primary sources",
                          "Expand Macro logic",
                          "Update yield benchmarks",
                        ].map((task) => (
                          <div
                            key={task}
                            className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-white/5"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-medium">{task}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-10 border-dashed border-white/10 text-[9px] font-bold uppercase"
                        >
                          Add Task Node
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Temporal Deadline
                      </Label>
                      <Input
                        type="date"
                        defaultValue="2024-03-20"
                        className="h-11 bg-background/50 border-white/5 rounded-xl font-bold"
                      />
                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <Text
                          variant="caption"
                          className="text-muted-foreground leading-relaxed italic block"
                        >
                          "Requests for revision trigger an automated dispatch
                          to the expert's studio hub and lock the node for
                          public discovery."
                        </Text>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-muted/20 border-t border-white/5 flex justify-end">
                  <Button
                    className="h-12 px-10 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 shadow-xl shadow-amber-900/20"
                    onClick={() => handleDecision("Request Revisions")}
                  >
                    Broadcast Revision Directive
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR: AUDITOR CONTEXT */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card border-none shadow-xl bg-card/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Target className="h-4 w-4" /> Impact Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center">
                  <Text
                    variant="label"
                    className="text-[9px] font-bold text-muted-foreground uppercase"
                  >
                    pSEO Discovery Potential
                  </Text>
                  <div className="text-xl font-bold text-primary">
                    {submission.engagement_projection}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[94%] animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-white/5 text-center space-y-1">
                  <div className="text-lg font-bold font-mono">12.4k</div>
                  <Text
                    variant="label"
                    className="text-[8px] opacity-50 uppercase"
                  >
                    Est. 24h Views
                  </Text>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-white/5 text-center space-y-1">
                  <div className="text-lg font-bold font-mono">850</div>
                  <Text
                    variant="label"
                    className="text-[8px] opacity-50 uppercase"
                  >
                    Est. Dialogue
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-8 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="h-16 w-16 text-secondary" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest">
              <Info className="h-4 w-4" /> Editorial SLA
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic block"
            >
              "Auditors must prioritize **Source Authenticity** over
              readability. If the research node lacks primary institutional
              citations, it should be shifted to 'Revision Requested'
              immediately."
            </Text>
          </div>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Revision Archive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { date: "Mar 10", msg: "Draft initial submission received." },
                  { date: "Mar 11", msg: "Auditor Collins assigned to node." },
                ].map((ev, i) => (
                  <div key={i} className="p-4 flex gap-4 items-start group">
                    <span className="text-[9px] font-mono font-bold text-primary mt-0.5">
                      {ev.date}
                    </span>
                    <Text
                      variant="caption"
                      className="text-muted-foreground leading-relaxed italic"
                    >
                      "{ev.msg}"
                    </Text>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
