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
} from "@/components/ui/card";
import {
  ShieldCheck,
  BookOpen,
  Twitter,
  Linkedin,
  Globe,
  Github,
  Youtube,
  Layers,
  GraduationCap,
  Briefcase,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getCreatorContent } from "@/services/data/creators-service";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreatorProfileClientProps {
  creator: CreatorProfile;
}

/**
 * Institutional Expert Profile Hub.
 * Features credential matrix, impact telemetry, and published intelligence registry.
 */
export function CreatorProfileClient({ creator }: CreatorProfileClientProps) {
  const [content, setContent] = useState<CreatorContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadExtraData() {
      try {
        const contentRes = await getCreatorContent(creator.id);
        setContent(contentRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadExtraData();
  }, [creator.id]);

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
                      variant="h1" as="h1"
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
                              Verified
                            </Text>
                            <Text
                              variant="caption"
                              className="text-muted-foreground leading-relaxed"
                            >
                              This contributor&apos;s account has been verified by Imperialpedia.
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
                      {creator.company || "Independent Contributor"}
                    </Text>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-8 py-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold tracking-tighter">
                    {creator.stats.followersCount.toLocaleString()}
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
                    Articles
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
          <div className="w-full space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-4">
              <Text
                variant="h3"
                className="flex items-center gap-2 px-1 font-bold text-sm uppercase tracking-widest"
              >
                <BookOpen className="h-4 w-4" /> Published Articles
              </Text>

              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Filter articles..."
                  className="pl-10 h-10 bg-card/30 border-white/10 rounded-xl text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 border-b border-white/5">
                        <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                          Title
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                          Category
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                          Reads
                        </TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                          Likes
                        </TableHead>
                        <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                          Published
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
                              href={`/financial-intelligence/${item.slug}`}
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
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              {format(
                                new Date(item.createdAt),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
          </div>
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
              {(creator.yearsExperience || creator.education) && (
                <div className="space-y-6">
                  {creator.yearsExperience && (
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
                          {creator.yearsExperience}+ Years Institutional
                          Experience
                        </Text>
                      </div>
                    </div>
                  )}

                  {creator.education && (
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
                          {creator.education}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
        </div>
      </div>
    </div>
  );
}
