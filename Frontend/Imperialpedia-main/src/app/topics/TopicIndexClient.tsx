"use client";

import React, { useState, useMemo } from "react";
import { GlobalTopicIndexData, TopicNode, LearningPath } from "@/types/topics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/design-system/typography/text";
import {
  Search,
  Filter,
  Layers,
  Zap,
  Flame,
  Star,
  Target,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Activity,
  Globe,
  Tag as TagIcon,
  SortAsc,
  Clock,
  Layout,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TopicIndexClientProps {
  initialData: GlobalTopicIndexData;
}

/**
 * Global Topic Index Discovery Terminal.
 * Features alphabetical navigation, category hubs, and strategic learning paths.
 */
export function TopicIndexClient({ initialData }: TopicIndexClientProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("alphabetical");
  const [difficulty, setDifficulty] = useState<string>("all");

  const filteredTopics = useMemo(() => {
    return initialData.topics.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.definition.toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty =
        difficulty === "all" || t.difficulty === difficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [search, difficulty, initialData.topics]);

  // Grouping logic for A-Z
  const groupedAlphabetical = useMemo(() => {
    const groups: Record<string, TopicNode[]> = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
      const topics = filteredTopics.filter(
        (t) => t.title.charAt(0).toUpperCase() === letter
      );
      if (topics.length > 0) groups[letter] = topics;
    });
    return groups;
  }, [filteredTopics]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* SEARCH & GLOBAL FILTER BAR */}
      <div className="flex flex-col lg:flex-row gap-6 bg-card/30 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-sm sticky top-20 z-30 shadow-xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Quick lookup for any financial node..."
            className="pl-12 h-12 bg-background/50 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {["all", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setDifficulty(lvl)}
              className={cn(
                "px-4 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                difficulty === lvl
                  ? "bg-primary text-white border-primary shadow-lg"
                  : "bg-background/50 text-muted-foreground border-white/5 hover:border-primary/30"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* MAIN NAVIGATION AREA */}
        <div className="lg:col-span-8 space-y-16">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-10"
          >
            <TabsList className="bg-card/30 border border-white/5 p-1 h-14 rounded-2xl w-full md:w-auto justify-start">
              <TabsTrigger
                value="alphabetical"
                className="px-8 h-12 gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-primary uppercase tracking-widest"
              >
                <SortAsc className="h-4 w-4" /> A – Z Index
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="px-8 h-12 gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-primary uppercase tracking-widest"
              >
                <Layers className="h-4 w-4" /> Category Hubs
              </TabsTrigger>
              <TabsTrigger
                value="paths"
                className="px-8 h-12 gap-2 text-xs font-bold rounded-xl data-[state=active]:bg-primary uppercase tracking-widest"
              >
                <GraduationCap className="h-4 w-4" /> Learning Paths
              </TabsTrigger>
            </TabsList>

            {/* ALPHABETICAL INDEX CONTENT */}
            <TabsContent
              value="alphabetical"
              className="mt-0 space-y-12 animate-in fade-in duration-500"
            >
              <nav className="flex flex-wrap gap-2 justify-center p-6 bg-card/20 rounded-[2rem] border border-white/5 shadow-inner">
                {alphabet.map((letter) => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all border",
                      groupedAlphabetical[letter]
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white hover:scale-110"
                        : "opacity-20 cursor-not-allowed border-transparent"
                    )}
                  >
                    {letter}
                  </a>
                ))}
              </nav>

              <div className="space-y-16">
                {Object.entries(groupedAlphabetical).map(([letter, topics]) => (
                  <div
                    key={letter}
                    id={`letter-${letter}`}
                    className="scroll-mt-48 space-y-8"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                        {letter}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                      <Text
                        variant="label"
                        className="text-[10px] text-muted-foreground font-bold"
                      >
                        {topics.length} Nodes
                      </Text>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {topics.map((topic) => (
                        <Link key={topic.id} href={`/glossary/${topic.slug}`}>
                          <Card className="glass-card border-none hover:border-primary/30 transition-all duration-300 group overflow-hidden h-full">
                            <CardContent className="p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-bold uppercase border-white/10 bg-black/20 text-muted-foreground"
                                >
                                  {topic.category}
                                </Badge>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 uppercase">
                                  Read Node <ArrowRight className="h-3 w-3" />
                                </div>
                              </div>
                              <Text
                                variant="body"
                                weight="bold"
                                className="group-hover:text-primary transition-colors text-lg"
                              >
                                {topic.title}
                              </Text>
                              <Text
                                variant="caption"
                                className="text-muted-foreground line-clamp-2 leading-relaxed italic"
                              >
                                "{topic.definition}"
                              </Text>

                              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
                                    {topic.reading_time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />{" "}
                                    {topic.difficulty}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-primary">
                                  <TrendingUp className="h-3 w-3" />
                                  <span className="text-[10px] font-mono font-bold">
                                    {topic.popularity_score}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* CATEGORIES INDEX CONTENT */}
            <TabsContent
              value="categories"
              className="mt-0 space-y-10 animate-in fade-in duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {initialData.categories.map((cat) => (
                  <Card
                    key={cat.name}
                    className="glass-card border-none shadow-xl hover:border-primary/30 transition-all duration-500 group overflow-hidden"
                  >
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-3xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                          <TagIcon className="h-8 w-8" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold tracking-tighter">
                            {cat.count}
                          </div>
                          <Text
                            variant="label"
                            className="text-[9px] opacity-50 font-bold uppercase tracking-widest"
                          >
                            Indexed Nodes
                          </Text>
                        </div>
                      </div>
                      <Text variant="h3" className="text-2xl font-bold mb-4">
                        {cat.name}
                      </Text>
                      <Button
                        variant="ghost"
                        className="p-0 h-auto text-primary font-bold text-xs group/btn"
                        asChild
                      >
                        <Link
                          href={`/categories/${cat.name
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          Explore Hub{" "}
                          <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* LEARNING PATHS CONTENT */}
            <TabsContent
              value="paths"
              className="mt-0 space-y-10 animate-in fade-in duration-500"
            >
              {initialData.learning_paths.map((path) => (
                <Card
                  key={path.id}
                  className="glass-card border-none bg-primary/5 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <GraduationCap className="h-48 w-48 text-primary" />
                  </div>
                  <CardHeader className="p-10 border-b border-white/5 space-y-4">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-none text-[9px] font-bold uppercase h-6 px-3 tracking-widest"
                    >
                      Curated Intelligence Node
                    </Badge>
                    <CardTitle className="text-3xl font-bold">
                      {path.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {path.topics.map((t, i) => (
                        <Link key={t.slug} href={`/glossary/${t.slug}`}>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5 hover:border-primary/30 transition-all group/item">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover/item:bg-primary group-hover/item:text-white transition-all">
                                {i + 1}
                              </div>
                              <Text variant="bodySmall" weight="bold">
                                {t.title}
                              </Text>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-10 pt-0">
                    <Button
                      size="lg"
                      className="rounded-xl h-12 px-10 font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
                    >
                      Begin Intelligence Cycle
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR AREA */}
        <aside className="lg:col-span-4 space-y-10">
          {/* TRENDING NODES PANEL */}
          <Card className="glass-card border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-card/30 border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Flame className="h-4 w-4 fill-primary" /> Discovery Velocity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {initialData.trending_topics.map((topic, idx) => (
                  <div
                    key={topic}
                    className="p-5 hover:bg-muted transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground opacity-50 w-4">
                        #{idx + 1}
                      </span>
                      <Text
                        variant="bodySmall"
                        weight="bold"
                        className="group-hover:text-primary transition-colors"
                      >
                        {topic}
                      </Text>
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/10 border-t border-white/5">
                <Button
                  variant="ghost"
                  className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary rounded-none"
                >
                  Real-time Sentiment Pulse
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* INDEX VITAL CARD */}
          <div className="p-10 rounded-[3rem] bg-secondary/5 border border-secondary/20 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Globe className="h-32 w-32 text-secondary rotate-12" />
            </div>
            <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Integrity Verified
            </div>
            <Text variant="h3" className="font-bold">
              Scale Telemetry
            </Text>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                <span>Total Indexed Nodes</span>
                <span className="text-secondary">1.2M+</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[94%] animate-pulse" />
              </div>
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic block"
            >
              "The Imperialpedia index is synchronized across global nodes every
              60 seconds to ensure discovery of new market intelligence."
            </Text>
          </div>

          {/* CALL TO ACTION HUB */}
          <div className="p-8 rounded-[3rem] bg-card/30 border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center mx-auto shadow-2xl">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <Text variant="bodySmall" weight="bold">
              Missing a specialized node?
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed block"
            >
              Our expert community can architect new taxonomy hubs for
              specialized assets or complex derivatives.
            </Text>
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-primary/20 text-primary font-bold text-xs uppercase"
            >
              Request Taxonomy Node
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
