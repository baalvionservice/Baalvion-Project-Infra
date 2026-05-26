"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CommunityRankingsData, RankedUser } from "@/types/community";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Medal,
  Award,
  Target,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  Flame,
  MessageSquare,
  Users,
  Zap,
  Info,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface RankingsClientProps {
  initialData: CommunityRankingsData;
}

/**
 * Community Rankings & Leaderboards Client Hub.
 * Orchestrates platform meritocracy through visualized authority and gamification nodes.
 */
export function RankingsClient({ initialData }: RankingsClientProps) {
  const [data, setData] = useState(initialData);
  const [activeCategory, setActiveCategory] = useState("Global Rankings");
  const [timeframe, setTimeframe] = useState("This Month");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<RankedUser | null>(null);

  const filteredLeaderboard = data.leaderboard.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case "Top Contributor":
        return <Trophy className="h-3 w-3 text-amber-500" />;
      case "Rising Star":
        return <Flame className="h-3 w-3 text-primary" />;
      case "Most Helpful":
        return <Heart className="h-3 w-3 text-secondary" />;
      case "Community Mentor":
        return <Award className="h-3 w-3 text-emerald-500" />;
      default:
        return <Star className="h-3 w-3 text-primary" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      {/* Header & Sub-Orchestration */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Trophy className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Platform Meritocracy
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Network Leaderboards
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-card/30 border border-white/5 p-1 rounded-xl flex">
            {["Today", "This Week", "This Month", "All Time"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 h-9 rounded-lg text-[10px] font-bold uppercase transition-all",
                  timeframe === tf
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="rounded-xl h-11 border-white/10 bg-card/30 font-bold text-xs gap-2"
          >
            <Download className="h-4 w-4" /> Export Matrix
          </Button>
        </div>
      </header>

      {/* Main Discovery Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="space-y-10"
      >
        <div className="overflow-x-auto no-scrollbar border-b border-white/5 pb-1">
          <TabsList className="bg-transparent border-none p-0 h-12 justify-start gap-8">
            {data.categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="bg-transparent border-none rounded-none px-0 h-full font-bold text-xs uppercase tracking-widest data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent
          value={activeCategory}
          className="mt-0 space-y-10 animate-in fade-in duration-500"
        >
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {filteredLeaderboard.slice(0, 3).map((user, idx) => (
              <Card
                key={user.id}
                className={cn(
                  "glass-card border-none relative overflow-hidden transition-all duration-500 hover:translate-y-[-8px] cursor-pointer",
                  idx === 0
                    ? "md:scale-110 z-10 ring-2 ring-primary/40 shadow-2xl bg-primary/5"
                    : "opacity-90"
                )}
                onClick={() => setSelectedUser(user)}
              >
                {idx === 0 && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                )}
                <CardContent className="p-8 text-center space-y-5">
                  <div className="relative mx-auto w-24 h-24">
                    <Avatar
                      className={cn(
                        "w-24 h-24 border-4 p-1 rounded-[2rem]",
                        idx === 0
                          ? "border-primary ring-4 ring-primary/10"
                          : idx === 1
                          ? "border-zinc-400"
                          : "border-amber-700"
                      )}
                    >
                      <AvatarImage
                        src={user.avatar}
                        className="rounded-[1.8rem]"
                      />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute -bottom-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-background",
                        idx === 0
                          ? "bg-primary text-white"
                          : idx === 1
                          ? "bg-zinc-400 text-zinc-900"
                          : "bg-amber-700 text-white"
                      )}
                    >
                      {idx === 0 ? (
                        <Trophy className="h-5 w-5" />
                      ) : (
                        <Medal className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  <div>
                    <Text
                      variant="body"
                      weight="bold"
                      className="text-lg flex items-center justify-center gap-2"
                    >
                      {user.name}
                      {user.role === "Analyst" && (
                        <ShieldCheck className="h-4 w-4 text-secondary" />
                      )}
                    </Text>
                    <div className="flex justify-center mt-2">
                      <Badge
                        variant="outline"
                        className="bg-background/50 border-white/5 text-[8px] font-bold uppercase h-5 px-2 gap-1.5 shadow-inner"
                      >
                        {getBadgeIcon(user.badge)} {user.badge}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold tracking-tighter">
                        {user.engagement_score}%
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase tracking-widest"
                      >
                        Eng. Score
                      </Text>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-2xl font-bold tracking-tighter">
                        {(user.followers / 1000).toFixed(1)}k
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase tracking-widest"
                      >
                        Reach
                      </Text>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Master Ranking Matrix */}
          <Card className="glass-card border-none shadow-2xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  Network Authority Index
                </CardTitle>
                <CardDescription>
                  Auditing contributors by reach velocity and interaction depth.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter community nodes..."
                  className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                    <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-widest py-6">
                      Rank
                    </TableHead>
                    <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest">
                      Contributor Node
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                      Platform Persona
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Articles
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Reach
                    </TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                      Eng. Score
                    </TableHead>
                    <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                      Trajectory
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaderboard.map((user) => (
                    <TableRow
                      key={user.id}
                      className="group hover:bg-white/5 transition-colors border-b border-white/5 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell className="text-center font-mono font-bold text-muted-foreground">
                        #{user.rank}
                      </TableCell>
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-2xl border-2 border-white/5 group-hover:border-primary/30 transition-colors">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
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
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-primary/5 text-primary border-none text-[8px] font-bold uppercase h-5 px-2"
                          >
                            {user.role}
                          </Badge>
                          <div className="flex items-center gap-1 opacity-60">
                            {getBadgeIcon(user.badge)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">
                        {user.articles}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-foreground/80">
                        {user.followers.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold font-mono text-primary">
                            {user.engagement_score}%
                          </span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${user.engagement_score}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end">
                          <div className="p-2 rounded-xl bg-background/50 border border-white/5">
                            {getTrendIcon(user.trend || "stable")}
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
                size="sm"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl"
              >
                Load Next 50 Contributor Nodes
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QUICK VIEW MODAL */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="max-w-md bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          {selectedUser && (
            <div className="animate-in zoom-in-95 duration-300">
              <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black/40 text-white border-white/10 text-[8px] font-bold uppercase tracking-widest">
                    Rank #{selectedUser.rank}
                  </Badge>
                </div>
              </div>

              <div className="px-8 pb-8 -mt-12 relative z-10">
                <div className="flex justify-between items-end mb-6">
                  <Avatar className="h-24 w-24 rounded-[2rem] border-4 border-background shadow-2xl ring-1 ring-white/10">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button className="rounded-xl h-10 px-6 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    Follow Expert
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Text variant="h3" className="text-2xl font-bold">
                        {selectedUser.name}
                      </Text>
                      <ShieldCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <Text
                      variant="bodySmall"
                      className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]"
                    >
                      {selectedUser.role} • Verified Intelligence
                    </Text>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-white/5">
                    <div className="text-center space-y-1">
                      <div className="text-xl font-bold font-mono">
                        {selectedUser.articles}
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase"
                      >
                        Articles
                      </Text>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-xl font-bold font-mono">
                        {(selectedUser.followers / 1000).toFixed(1)}k
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase"
                      >
                        Followers
                      </Text>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-xl font-bold font-mono text-primary">
                        {selectedUser.reputation.toLocaleString()}
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase"
                      >
                        Reputation
                      </Text>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                      <Zap className="h-3.5 w-3.5" /> Recent Achievement
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-background/50 border border-white/5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {getBadgeIcon(selectedUser.badge)}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">
                          {selectedUser.badge}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          Awarded for 95% forecast precision this month.
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/10 font-bold group"
                    asChild
                  >
                    <Link href={`/creator/${selectedUser.id}`}>
                      Full Intelligence Profile{" "}
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* STRATEGIC CONTEXT FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-primary/10 w-fit text-primary">
            <Zap className="h-8 w-8" />
          </div>
          <div>
            <Text
              variant="h3"
              className="mb-2 text-xl font-bold text-foreground"
            >
              Authority Matrix
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Leaderboard rankings are calculated every 24 hours using a
              weighted algorithm of **Forecast Precision**, **Content
              Engagement**, and **Peer Citation Velocity**.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-secondary/20 p-8 flex flex-col gap-4">
          <div className="p-4 rounded-[2rem] bg-secondary/10 w-fit text-secondary">
            <Target className="h-8 w-8" />
          </div>
          <div>
            <Text
              variant="h3"
              className="mb-2 text-xl font-bold text-foreground"
            >
              Expert Verification
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Consistently ranking in the Top 50 of the **Analyst Hub** triggers
              an automated verification review, unlocking premium monetization
              gateways and institutional tools.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-emerald-500/20 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Award className="h-24 w-24 text-emerald-500 rotate-12" />
          </div>
          <div className="p-4 rounded-[2rem] bg-emerald-500/10 w-fit text-emerald-500">
            <Sparkles className="h-8 w-8" />
          </div>
          <div>
            <Text
              variant="h3"
              className="mb-2 text-xl font-bold text-foreground"
            >
              Node Reputation
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed"
            >
              Earn **Reputation Nodes** by participating in market polls and
              contests. Nodes can be exchanged for exclusive badges and featured
              profile placement.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Download, Heart } from "lucide-react";
