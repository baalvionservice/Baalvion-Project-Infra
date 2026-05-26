"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CreatorProfile, CreatorContentItem } from "@/types";
import { Text } from "@/design-system/typography/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  UserPlus,
  UserMinus,
  BookOpen,
  TrendingUp,
  Twitter,
  Linkedin,
  Globe,
  Github,
  Youtube,
  ArrowUpRight,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Award,
  GraduationCap,
  Briefcase,
  Zap,
  Search,
  Activity,
  Bell,
  BellOff,
  Flame,
  Target,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { ArticleCard } from "@/modules/content-engine/components/ArticleCard";
import {
  getCreatorContent,
  getCreators,
  getContributorTrustData,
} from "@/services/mock-api/creators";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalystPerformanceDashboard } from "@/modules/creators/components/AnalystPerformanceDashboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrustVerificationPanel } from "@/modules/creators/components/TrustVerificationPanel";
import { ContributorTrustData } from "@/types/trust";

interface CreatorProfileClientProps {
  creator: CreatorProfile;
}

/**
 * Institutional Expert Profile Hub.
 * Features credential matrix, impact telemetry, and published intelligence registry.
 */
export function CreatorProfileClient({ creator }: CreatorProfileClientProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [notifsActive, setNotifsActive] = useState(true);
  const [followers, setFollowers] = useState(creator.stats.followersCount);
  const [content, setContent] = useState<CreatorContentItem[]>([]);
  const [trustData, setTrustData] = useState<ContributorTrustData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadExtraData() {
      try {
        const [contentRes, trustRes] = await Promise.all([
          getCreatorContent(creator.id),
          getContributorTrustData(creator.id),
        ]);
        setContent(contentRes.data);
        if (trustRes.data) setTrustData(trustRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExtraData();
  }, [creator.id]);

  const toggleFollow = () => {
    if (isFollowing) {
      setFollowers((prev) => prev - 1);
    } else {
      setFollowers((prev) => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "github":
        return <Github className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const filteredContent = content.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const mockPerformanceHistory = [
    { month: "Oct", articles: 4, engagement: 12400 },
    { month: "Nov", articles: 5, engagement: 15200 },
    { month: "Dec", articles: 3, engagement: 11800 },
    { month: "Jan", articles: 6, engagement: 18400 },
    { month: "Feb", articles: 4, engagement: 14200 },
    { month: "Mar", articles: 2, engagement: 8500 },
  ];

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Profile Header Card */}
      <Card className="glass-card overflow-hidden border-none shadow-2xl relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <CardContent className="p-8 lg:p-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="relative w-32 h-32 lg:w-48 lg:h-48 rounded-[2.5rem] overflow-hidden border-4 border-background shadow-2xl ring-1 ring-white/10 shrink-0">
              <Image
                src={creator.avatar}
                alt={creator.displayName}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1 space-y-6 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Text
                      variant="h1"
                      className="text-4xl lg:text-6xl font-bold tracking-tight"
                    >
                      {creator.displayName}
                    </Text>
                    {creator.verified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className="bg-secondary text-secondary-foreground border-none h-8 px-3 rounded-xl font-bold uppercase text-[10px] cursor-help">
                              <ShieldCheck className="mr-1.5 h-4 w-4" />{" "}
                              Verified Expert
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="glass-card border-secondary/20 p-4 max-w-xs">
                            <Text
                              variant="bodySmall"
                              weight="bold"
                              className="text-secondary mb-1"
                            >
                              Verification Matrix Complete
                            </Text>
                            <Text
                              variant="caption"
                              className="text-muted-foreground leading-relaxed"
                            >
                              This expert has provided verifiable proof of
                              industry credentials, academic research, and
                              institutional affiliation.
                            </Text>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Text
                      variant="h4"
                      className="text-primary font-bold uppercase tracking-widest text-sm"
                    >
                      {creator.title}
                    </Text>
                    <span className="text-muted-foreground opacity-40">•</span>
                    <Text
                      variant="bodySmall"
                      className="text-muted-foreground font-bold"
                    >
                      {creator.company || "Independent Institutional Analyst"}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    variant={isFollowing ? "outline" : "default"}
                    className={`h-12 px-8 rounded-2xl font-bold transition-all ${
                      !isFollowing
                        ? "shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                        : "border-white/10"
                    }`}
                    onClick={toggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" /> Follow Expert
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-2xl border-white/10 transition-colors",
                      notifsActive
                        ? "text-primary bg-primary/5 border-primary/20"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setNotifsActive(!notifsActive)}
                  >
                    {notifsActive ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <BellOff className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-8 py-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold tracking-tighter">
                    {followers.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Followers
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold tracking-tighter">
                    {creator.stats.articlesCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Insights
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold tracking-tighter">
                    {(creator.stats.totalReads || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Total Reads
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold tracking-tighter text-primary">
                    {creator.stats.engagementScore || 92}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Credibility
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {creator.socialLinks && creator.socialLinks.length > 0 && (
                  <div className="flex items-center gap-2 px-4 bg-white/5 rounded-2xl border border-white/5 h-12">
                    {creator.socialLinks.map((link, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary transition-colors"
                        asChild
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={link.platform}
                        >
                          {getSocialIcon(link.platform)}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
                <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <Text
                  variant="caption"
                  className="text-muted-foreground font-mono uppercase tracking-widest"
                >
                  @{creator.username} • Joined{" "}
                  {format(new Date(creator.joinedDate), "MMM yyyy")}
                </Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Intelligence Column */}
        <div className="lg:col-span-8 space-y-12">
          <Tabs defaultValue="trust" className="w-full space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-4">
              <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
                <TabsTrigger
                  value="trust"
                  className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
                >
                  <ShieldCheck className="h-4 w-4" /> Trust Node
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
                >
                  <Activity className="h-4 w-4" /> Performance Audit
                </TabsTrigger>
                <TabsTrigger
                  value="published"
                  className="px-8 h-10 gap-2 rounded-xl font-bold text-xs data-[state=active]:bg-primary"
                >
                  <BookOpen className="h-4 w-4" /> Research Archive
                </TabsTrigger>
              </TabsList>

              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter intelligence nodes..."
                  className="pl-10 h-10 bg-card/30 border-white/10 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TRUST TAB */}
            <TabsContent value="trust" className="mt-0">
              {trustData ? (
                <TrustVerificationPanel
                  trustData={trustData}
                  displayName={creator.displayName}
                />
              ) : (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </TabsContent>

            {/* PERFORMANCE TAB */}
            <TabsContent value="performance" className="mt-0">
              <AnalystPerformanceDashboard
                stats={{
                  engagementScore: creator.stats.engagementScore || 0,
                  accuracyScore: creator.stats.accuracyScore || 0,
                  credibilityScore: creator.stats.credibilityScore || 0,
                  totalReads: creator.stats.totalReads || 0,
                }}
                performanceHistory={mockPerformanceHistory}
              />
            </TabsContent>

            {/* RESEARCH ARCHIVE TAB */}
            <TabsContent value="published" className="mt-0">
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 border-b border-white/5">
                        <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                          Intelligence Title
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                          Taxonomy
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                          Reads
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                          Likes
                        </TableHead>
                        <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                          Handshake
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContent.map((item) => (
                        <TableRow
                          key={item.id}
                          className="group hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                          <TableCell className="py-5 pl-8">
                            <Link
                              href={`/articles/${item.slug}`}
                              className="text-sm font-bold text-foreground/90 leading-tight block group-hover:text-primary transition-colors"
                            >
                              {item.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-primary/20 bg-primary/5 text-primary text-[8px] font-bold uppercase h-5 px-2"
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold opacity-70">
                            {(item.reads || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs font-bold text-primary">
                            {(item.likes || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                {format(
                                  new Date(item.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                              <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">
                                Verified Index
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-muted/10 border-t border-white/5 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                  >
                    Full Chronological Matrix{" "}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Context Column */}
        <div className="lg:col-span-4 space-y-10">
          {/* Credentials Card */}
          <Card className="glass-card border-none shadow-xl h-fit">
            <CardHeader className="p-8 border-b border-white/5 bg-card/30">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Credential
                Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <Text
                      variant="label"
                      className="text-[9px] opacity-50 font-bold uppercase tracking-widest block mb-1"
                    >
                      Tenure
                    </Text>
                    <Text variant="bodySmall" weight="bold">
                      {creator.yearsExperience || 10}+ Years Institutional
                      Experience
                    </Text>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <Text
                      variant="label"
                      className="text-[9px] opacity-50 font-bold uppercase tracking-widest block mb-1"
                    >
                      Academy
                    </Text>
                    <Text variant="bodySmall" weight="bold">
                      {creator.education || "Institutional Researcher"}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 font-bold uppercase tracking-widest"
                >
                  Authority Nodes
                </Text>
                <div className="flex flex-wrap gap-2">
                  {creator.badges?.map((badge) => (
                    <Badge
                      key={badge}
                      className="bg-background/50 text-foreground border-white/10 text-[9px] font-bold uppercase h-6 px-3 shadow-inner"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expertise Taxonomy */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Layers className="h-4 w-4" />
              </div>
              <Text
                variant="h4"
                className="font-bold text-sm uppercase tracking-widest"
              >
                Expertise Taxonomy
              </Text>
            </div>

            <div className="flex flex-wrap gap-2">
              {creator.specialties.map((spec) => (
                <Badge
                  key={spec}
                  variant="secondary"
                  className="px-4 py-2 bg-card/50 border-white/5 hover:border-primary/30 hover:text-primary transition-all cursor-pointer rounded-xl font-bold text-xs"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/20 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame className="h-16 w-16 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Strategy Access
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic block"
            >
              "Upgrade to **Institutional Pro** to access{" "}
              {creator.displayName.split(" ")[0]}'s real-time model portolios
              and trade signals."
            </Text>
            <Button
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/premium/subscribe">Launch Pro Intelligence</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
