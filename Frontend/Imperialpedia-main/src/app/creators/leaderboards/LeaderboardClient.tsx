"use client";

import React, { useState, useMemo } from "react";
import { CreatorLeaderboard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Text } from "@/design-system/typography/text";
import {
  Trophy,
  TrendingUp,
  DollarSign,
  Eye,
  Heart,
  ShieldCheck,
  Globe,
  Tag as TagIcon,
  Medal,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface LeaderboardClientProps {
  initialData: CreatorLeaderboard[];
}

export function LeaderboardClient({ initialData }: LeaderboardClientProps) {
  const [metric, setMetric] = useState<"revenue" | "engagement">("revenue");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Filters
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(initialData.map((d) => d.category)))],
    [initialData]
  );
  const regions = useMemo(
    () => ["all", ...Array.from(new Set(initialData.map((d) => d.region)))],
    [initialData]
  );

  // Derived & Filtered Data
  const sortedData = useMemo(() => {
    return [...initialData]
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "all" || item.category === selectedCategory;
        const matchesRegion =
          selectedRegion === "all" || item.region === selectedRegion;
        const matchesVerified = !verifiedOnly || item.verified;
        return matchesCategory && matchesRegion && matchesVerified;
      })
      .sort((a, b) => {
        if (metric === "revenue") return b.totalRevenue - a.totalRevenue;
        return b.totalViews - a.totalViews;
      });
  }, [initialData, metric, selectedCategory, selectedRegion, verifiedOnly]);

  const topThree = sortedData.slice(0, 3);
  const remaining = sortedData.slice(3);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const formatCompact = (val: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact" }).format(val);

  return (
    <div className="space-y-12">
      {/* Filters Toolbar */}
      <div className="bg-card/30 p-6 rounded-[2.5rem] border border-white/5 flex flex-wrap gap-6 items-end backdrop-blur-xl">
        <div className="space-y-2">
          <Text variant="label" className="text-[10px] ml-1">
            Rank By Metric
          </Text>
          <Tabs
            value={metric}
            onValueChange={(v) => setMetric(v as any)}
            className="w-[300px]"
          >
            <TabsList className="bg-background/50 border border-white/5">
              <TabsTrigger value="revenue" className="gap-2">
                <DollarSign className="h-3.5 w-3.5" /> Revenue
              </TabsTrigger>
              <TabsTrigger value="engagement" className="gap-2">
                <TrendingUp className="h-3.5 w-3.5" /> Reach
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Text variant="label" className="text-[10px] ml-1">
            Taxonomy
          </Text>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-10 bg-background/50 border-white/5 rounded-xl">
              <TagIcon className="mr-2 h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Text variant="label" className="text-[10px] ml-1">
            Market Region
          </Text>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[180px] h-10 bg-background/50 border-white/5 rounded-xl">
              <Globe className="mr-2 h-3.5 w-3.5 text-secondary" />
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((reg) => (
                <SelectItem key={reg} value={reg}>
                  {reg.charAt(0).toUpperCase() + reg.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 bg-background/40 px-4 py-2.5 rounded-xl border border-white/5 mb-0.5">
          <Checkbox
            id="verified"
            checked={verifiedOnly}
            onCheckedChange={(v) => setVerifiedOnly(v as boolean)}
          />
          <Label
            htmlFor="verified"
            className="text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Verified
          </Label>
        </div>
      </div>

      {/* Podium - Top 3 Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative pt-10">
        {topThree.map((creator, idx) => (
          <Card
            key={creator.creatorId}
            className={`glass-card relative overflow-hidden transition-all hover:translate-y-[-8px] hover:shadow-2xl ${
              idx === 0
                ? "md:order-2 border-primary/40 md:scale-110 md:-translate-y-4 z-10"
                : idx === 1
                ? "md:order-1 border-white/10"
                : "md:order-3 border-white/10"
            }`}
          >
            {idx === 0 && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            )}
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-4">
                <Avatar
                  className={`h-24 w-24 border-4 ${
                    idx === 0
                      ? "border-primary ring-4 ring-primary/20"
                      : idx === 1
                      ? "border-zinc-400"
                      : "border-amber-700"
                  }`}
                >
                  <AvatarImage src={creator.profileImage} />
                  <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    idx === 0
                      ? "bg-primary text-white"
                      : idx === 1
                      ? "bg-zinc-400 text-zinc-900"
                      : "bg-amber-700 text-white"
                  }`}
                >
                  <Medal className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold flex flex-col items-center gap-1">
                <span className="flex items-center gap-1.5">
                  {creator.name}
                  {creator.verified && (
                    <ShieldCheck className="h-4 w-4 text-secondary" />
                  )}
                </span>
                <Text
                  variant="caption"
                  className="text-muted-foreground font-normal"
                >
                  Rank #{idx + 1} — {creator.category}
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <Text
                  variant="label"
                  className="text-[10px] text-muted-foreground"
                >
                  {metric === "revenue" ? "Gross Revenue" : "Total Reach"}
                </Text>
                <Text
                  variant="h3"
                  className={idx === 0 ? "text-primary font-bold" : "font-bold"}
                >
                  {metric === "revenue"
                    ? formatCurrency(creator.totalRevenue)
                    : formatCompact(creator.totalViews)}
                </Text>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl font-bold"
                asChild
              >
                <Link href={`/creator/${creator.creatorId}`}>
                  View Analysis Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Leaderboard Table */}
      <Card className="glass-card overflow-hidden border-none shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-card/30">
          <Text variant="h4" className="font-bold">
            Expert Rankings
          </Text>
          <Text
            variant="caption"
            className="text-muted-foreground uppercase tracking-widest font-bold"
          >
            Showing {sortedData.length} Experts
          </Text>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Expert Identity</TableHead>
              <TableHead>Market Focus</TableHead>
              <TableHead className="text-right">Global Reach</TableHead>
              <TableHead className="text-right">Intelligence Revenue</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow
                key={item.creatorId}
                className="group hover:bg-white/5 transition-colors"
              >
                <TableCell className="text-center font-bold text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={item.profileImage} />
                      <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold flex items-center gap-1.5">
                        {item.name}
                        {item.verified && (
                          <ShieldCheck className="h-3 w-3 text-secondary" />
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                        {item.region}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold"
                  >
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />{" "}
                      {formatCompact(item.totalViews)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatCompact(item.totalLikes)} total interactions
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-500 border-none font-mono font-bold"
                  >
                    {formatCurrency(item.totalRevenue)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                    asChild
                  >
                    <Link href={`/creator/${item.creatorId}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-primary/5 border-primary/20 p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-[2rem] bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div>
              <Text variant="h3" className="mb-2">
                Rewards for Excellence
              </Text>
              <Text
                variant="bodySmall"
                className="text-muted-foreground leading-relaxed"
              >
                Top-ranking experts receive increased reach within the
                Intelligence Index, early access to new generative content
                tools, and enhanced revenue shares from platform-wide
                engagement.
              </Text>
            </div>
          </div>
        </Card>

        <Card className="glass-card bg-secondary/5 border-secondary/20 p-8">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-[2rem] bg-secondary/10">
              <ShieldCheck className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <Text variant="h3" className="mb-2">
                Verified Growth
              </Text>
              <Text
                variant="bodySmall"
                className="text-muted-foreground leading-relaxed"
              >
                The Leaderboard highlights our verified expert network. Rankings
                are recalculated every 24 hours based on unique organic reach
                and verified intelligence output.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
