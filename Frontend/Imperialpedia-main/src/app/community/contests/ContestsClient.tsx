"use client";

import React, { useState } from "react";
import { CommunityData } from "@/types/community";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Target,
  Activity,
  Sparkles,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Users,
  Search,
  Zap,
  Layers,
  Flame,
  Filter,
  History,
  Lock,
  PieChart,
  CalendarDays,
} from "lucide-react";
import { PollCard } from "@/modules/content-engine/components/PollCard";
import { ContestCard } from "@/modules/community/components/ContestCard";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface ContestsClientProps {
  data: CommunityData;
}

/**
 * Enhanced Hub for community forecasts and prediction contests.
 */
export function ContestsClient({ data }: ContestsClientProps) {
  const [activeTab, setActiveTab] = useState("contests");
  const [search, setSearch] = useState("");

  const ongoingContests = data.predictionContests.filter(
    (c) => c.status === "Active"
  );
  const upcomingContests = data.predictionContests.filter(
    (c) => c.status === "Upcoming"
  );
  const closedContests = data.predictionContests.filter(
    (c) => c.status === "Completed"
  );

  const activePolls = data.polls.filter((p) => p.status === "active");

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Target className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Crowdsourced Intelligence Hub
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Polls & Contests
          </Text>
          <Text
            variant="bodySmall"
            className="text-muted-foreground mt-1 text-base max-w-xl leading-relaxed"
          >
            Challenge the markets. Participate in community-led forecasts and
            earn reputation nodes via the precision algorithm.
          </Text>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl h-11 px-6 border-white/10 bg-card/30"
            asChild
          >
            <Link href="/community/profile/predictions">
              <History className="mr-2 h-4 w-4" /> My Predictions
            </Link>
          </Button>
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search challenges..."
              className="pl-10 h-11 w-64 bg-card/30 border-white/10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Strategic Hero - Championship Highlight */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Trophy className="h-64 w-64 text-primary" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Sparkles className="h-10 w-10 animate-pulse" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <Badge className="bg-primary text-white border-none font-bold uppercase text-[9px] h-5 px-3">
                Season 4 Championship
              </Badge>
              <Text
                variant="label"
                className="text-muted-foreground flex items-center gap-1"
              >
                <Users className="h-3 w-3" /> Expert League
              </Text>
            </div>
            <Text
              variant="h2"
              className="text-2xl lg:text-3xl font-bold tracking-tight"
            >
              March Market Madness is LIVE
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl text-base"
            >
              Predict the weekly winners across 12 taxonomies. Top 3
              participants this cycle receive the **"Grand Oracle"** immutable
              badge and 1,000 Reputation Nodes.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 group"
          >
            Enter Arena{" "}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-10"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
          <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
            <TabsTrigger
              value="contests"
              className="px-8 gap-2 rounded-xl font-bold text-sm data-[state=active]:bg-primary"
            >
              <Trophy className="h-4 w-4" /> Prediction Contests
            </TabsTrigger>
            <TabsTrigger
              value="polls"
              className="px-8 gap-2 rounded-xl font-bold text-sm data-[state=active]:bg-primary"
            >
              <Activity className="h-4 w-4" /> Global Polls
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
              {ongoingContests.length + activePolls.length} Active Nodes
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />{" "}
              {upcomingContests.length} Planned
            </div>
          </div>
        </div>

        {/* CONTESTS TAB */}
        <TabsContent
          value="contests"
          className="mt-0 space-y-16 animate-in fade-in duration-500"
        >
          {/* Ongoing Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h4" className="font-bold">
                    Active Forecasts
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    Live Decision Loops
                  </Text>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ongoingContests.map((contest) => (
                <ContestCard key={contest.id} contest={contest as any} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Upcoming Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h4" className="font-bold">
                    Upcoming Matrix
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    Future Forecast Nodes
                  </Text>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {upcomingContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest as any} />
                ))}
              </div>
            </div>

            {/* Closed Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <Text variant="h4" className="font-bold">
                    Settled Contests
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                  >
                    Historical Verdicts
                  </Text>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 opacity-70">
                {closedContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest as any} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* POLLS TAB */}
        <TabsContent
          value="polls"
          className="mt-0 space-y-16 animate-in fade-in duration-500"
        >
          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <Text variant="h4" className="font-bold">
                  Active Sentiment Polls
                </Text>
                <Text
                  variant="caption"
                  className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
                >
                  Real-time Opinion Mining
                </Text>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePolls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
