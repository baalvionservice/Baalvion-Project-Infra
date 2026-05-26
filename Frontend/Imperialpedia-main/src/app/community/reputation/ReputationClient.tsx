"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ReputationSystemData, ReputationUser } from "@/types/community";
import { communityService } from "@/services/data/community-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Text } from "@/design-system/typography/text";
import {
  Trophy,
  Award,
  Zap,
  Star,
  ShieldCheck,
  TrendingUp,
  Users,
  MessageSquare,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  Heart,
  Target,
  Activity,
  History,
  Layout,
  BarChart3,
  FileText,
  Search,
  Filter,
  Layers,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

/**
 * Community Reputation Engine Interactive Client.
 * Specialized suite for visualizing user authority, contribution metrics, and network meritocracy.
 */
export function ReputationClient() {
  const [data, setData] = useState<ReputationSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await communityService.getReputationData();
        if (response.data) setData(response.data);
      } catch (e) {
        console.error("Reputation sync failure", e);
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
          Establishing Identity Handshake...
        </Text>
      </div>
    );
  }

  const { currentUser, leaderboard, history, available_badges } = data;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Community Authority":
        return "text-primary";
      case "Expert Contributor":
        return "text-secondary";
      case "Trusted Member":
        return "text-emerald-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "Top Author":
        return <Award className="h-4 w-4" />;
      case "Market Expert":
        return <Zap className="h-4 w-4" />;
      case "Community Helper":
        return <Heart className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Trophy className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Network Authority Index
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Reputation Engine
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl"
          >
            <TabsList className="bg-transparent border-none">
              <TabsTrigger
                value="overview"
                className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
              >
                <Activity className="h-4 w-4" /> My Node
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
              >
                <Trophy className="h-4 w-4" /> Leaderboard
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* REPUTATION OVERVIEW TAB */}
      <TabsContent
        value="overview"
        className="mt-0 space-y-10 animate-in fade-in duration-500 outline-none"
      >
        {/* User Hero Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <Card className="glass-card border-none bg-primary/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                <Zap className="h-48 w-48 text-primary" />
              </div>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 rounded-[2rem] border-4 border-background shadow-2xl ring-1 ring-white/10">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Text variant="h3" className="text-2xl font-bold">
                        {currentUser.name}
                      </Text>
                      <ShieldCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <Text
                      variant="bodySmall"
                      className={cn(
                        "font-bold uppercase tracking-widest text-[10px]",
                        getLevelColor(currentUser.level)
                      )}
                    >
                      {currentUser.level}
                    </Text>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <Text
                        variant="label"
                        className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                      >
                        Authority Node Strength
                      </Text>
                      <div className="text-5xl font-bold tracking-tighter text-primary">
                        {currentUser.reputation_score}
                        <span className="text-lg opacity-30">/100</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-none font-bold text-[10px] h-6 px-3"
                    >
                      Rank #124
                    </Badge>
                  </div>
                  <Progress
                    value={currentUser.reputation_score}
                    className="h-2 bg-white/5"
                  />
                  <Text
                    variant="caption"
                    className="text-muted-foreground block text-center italic"
                  >
                    "Maintain an engagement rate above 90% to reach the next
                    tier."
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-white/10 bg-background/30 font-bold text-xs uppercase group/btn"
                  >
                    Badges Archive{" "}
                    <ChevronRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                  <Button className="h-11 rounded-xl font-bold text-xs uppercase bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    Share Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CONTRIBUTION METRICS PANEL */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <Text
                    variant="h4"
                    className="font-bold uppercase tracking-widest text-xs"
                  >
                    Contribution matrix
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground uppercase tracking-widest font-bold text-[8px]"
                  >
                    Structural Integrity Nodes
                  </Text>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Published Insights",
                    value: currentUser.articles,
                    icon: FileText,
                    color: "text-primary",
                  },
                  {
                    label: "Dialogue Nodes",
                    value: currentUser.comments,
                    icon: MessageSquare,
                    color: "text-secondary",
                  },
                  {
                    label: "Helpful Signals",
                    value: currentUser.helpful_votes,
                    icon: Award,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Network Reach",
                    value: (currentUser.followers / 1000).toFixed(1) + "k",
                    icon: Users,
                    color: "text-amber-500",
                  },
                ].map((metric) => (
                  <Card
                    key={metric.label}
                    className="glass-card border-none hover:border-white/20 transition-all group"
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center space-y-2">
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-background/50 border border-white/5 transition-transform group-hover:scale-110",
                          metric.color
                        )}
                      >
                        <metric.icon className="h-4 w-4" />
                      </div>
                      <div className="text-xl font-bold tracking-tighter">
                        {metric.value}
                      </div>
                      <Text
                        variant="label"
                        className="text-[8px] opacity-50 uppercase font-bold tracking-widest leading-tight"
                      >
                        {metric.label}
                      </Text>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* REPUTATION HISTORY COLUMN */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" /> Authority
                    Trajectory
                  </CardTitle>
                  <CardDescription>
                    Longitudinal reputation growth over the last 3 fiscal
                    cycles.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 h-7"
                >
                  RE-SYNCED
                </Badge>
              </CardHeader>
              <CardContent className="p-8 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorRep" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#8272F2"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8272F2"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1C1822",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Reputation Score"
                      stroke="#8272F2"
                      fillOpacity={1}
                      fill="url(#colorRep)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CONTRIBUTION ACTIVITY CHART */}
            <Card className="glass-card border-none shadow-xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-secondary" /> Interaction
                  Velocity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1C1822",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="contributions"
                      name="Net Contributions"
                      fill="#69B9FF"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* LEADERBOARD TAB */}
      <TabsContent
        value="leaderboard"
        className="mt-0 space-y-10 animate-in fade-in duration-500 outline-none"
      >
        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Network Meritocracy</CardTitle>
              <CardDescription>
                Top contributors ranked by aggregate authority nodes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search contributor nodes..."
                  className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl text-xs"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl border-white/10 bg-card/30"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 border-b border-white/5">
                  <TableHead className="w-24 text-center font-bold text-[10px] uppercase tracking-widest py-6">
                    Rank
                  </TableHead>
                  <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest">
                    Contributor Node
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                    Trust level
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                    Network reach
                  </TableHead>
                  <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                    Authority Score
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user) => (
                  <TableRow
                    key={user.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
                  >
                    <TableCell className="text-center font-mono font-bold text-muted-foreground">
                      #{user.rank}
                    </TableCell>
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 rounded-[1.25rem] border-2 border-background ring-1 ring-white/5 group-hover:border-primary/30 transition-all shadow-lg">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold group-hover:text-primary transition-colors">
                            {user.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold uppercase text-[8px] h-5 px-2 border-white/10 bg-black/20",
                            getLevelColor(user.level)
                          )}
                        >
                          {user.level}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-foreground/80">
                      {user.followers.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="text-lg font-bold font-mono text-primary tracking-tighter">
                          {user.reputation_score}
                        </div>
                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${user.reputation_score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 bg-muted/10 border-t border-white/5 flex justify-center">
            <Button
              variant="ghost"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl"
            >
              Load deeper reputation layers
            </Button>
          </div>
        </Card>
      </TabsContent>

      {/* STRATEGIC LEVEL & BADGE MATRIX (Footer Section) */}
      <section className="space-y-8 pt-10 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <Text variant="h3" className="font-bold">
              Reputation Matrix
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground uppercase tracking-widest font-bold text-[9px]"
            >
              Hierarchy & Visual Authority Nodes
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              label: "Beginner",
              score: "0-20",
              icon: Star,
              color: "text-muted-foreground",
            },
            {
              label: "Contributor",
              score: "21-40",
              icon: TrendingUp,
              color: "text-emerald-500",
            },
            {
              label: "Trusted Member",
              score: "41-60",
              icon: ShieldCheck,
              color: "text-primary",
            },
            {
              label: "Expert Contributor",
              score: "61-80",
              icon: Zap,
              color: "text-secondary",
            },
            {
              label: "Authority",
              score: "81-100",
              icon: Trophy,
              color: "text-amber-500",
            },
          ].map((level) => (
            <Card
              key={level.label}
              className={cn(
                "glass-card border-none hover:scale-105 transition-all duration-500 group",
                currentUser.level.includes(level.label)
                  ? "ring-2 ring-primary/40 bg-primary/5"
                  : "opacity-60"
              )}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div
                  className={cn(
                    "p-3 rounded-2xl bg-background/50 border border-white/5 mx-auto w-fit transition-transform group-hover:rotate-12",
                    level.color
                  )}
                >
                  <level.icon className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <Text
                    variant="bodySmall"
                    weight="bold"
                    className="block leading-tight"
                  >
                    {level.label}
                  </Text>
                  <Text
                    variant="caption"
                    className="font-mono text-[9px] opacity-50 uppercase font-bold tracking-widest"
                  >
                    {level.score} Threshold
                  </Text>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-card border-none bg-card/30 p-8">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" /> Active Achievement
                Matrix
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-4">
              {available_badges.map((badge) => (
                <div
                  key={badge}
                  className="p-4 rounded-2xl bg-background/50 border border-white/10 hover:border-primary/30 transition-all group flex items-center gap-4 cursor-default"
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {getBadgeIcon(badge)}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">{badge}</span>
                    <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">
                      Node verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Layout className="h-16 w-16 text-primary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Info className="h-4 w-4" /> Authority Logic
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic block"
            >
              "Authority is earned, not assigned. Scores are calculated using a
              weighted matrix of **Predictive Precision**, **Peer Citations**,
              and **Community Helpful Votes**."
            </Text>
            <Button
              variant="link"
              className="p-0 h-auto w-fit text-primary font-bold text-[10px] uppercase group/link"
              asChild
            >
              <Link href="/community/discussions">
                Explore Dialogue Nodes{" "}
                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
