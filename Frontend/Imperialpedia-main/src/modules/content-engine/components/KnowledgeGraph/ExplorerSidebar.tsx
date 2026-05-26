"use client";

import React, { useState } from "react";
import { GraphNode, NodeCategory } from "@/types/knowledge-graph";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Text } from "@/design-system/typography/text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  Layers,
  Zap,
  ArrowRight,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplorerSidebarProps {
  nodes: GraphNode[];
  onNodeSelect: (id: string) => void;
  activeId: string | null;
}

/**
 * Filterable directory sidebar for the Knowledge Graph.
 */
export function ExplorerSidebar({
  nodes,
  onNodeSelect,
  activeId,
}: ExplorerSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  const categories = [
    "All",
    "Macroeconomics",
    "Stock Market",
    "Cryptocurrency",
  ];

  const filtered = nodes.filter((n) => {
    const matchesSearch = n.label.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCat === "All" || n.category === activeCat;
    return matchesSearch && matchesCat;
  });

  return (
    <Card className="glass-card border-none shadow-2xl h-full flex flex-col bg-card/30 overflow-hidden">
      <CardHeader className="bg-card/30 border-b border-white/5 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Knowledge Explorer
          </CardTitle>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search taxonomy..."
              className="pl-10 h-10 bg-background/50 border-white/5 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter border transition-all",
                  activeCat === cat
                    ? "bg-primary text-white border-primary shadow-lg"
                    : "bg-background/50 text-muted-foreground border-white/5 hover:border-primary/30"
                )}
              >
                {cat === "Macroeconomics" ? "Macro" : cat}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-[500px]">
          <div className="divide-y divide-white/5">
            {filtered.map((node) => (
              <div
                key={node.id}
                onClick={() => onNodeSelect(node.id)}
                className={cn(
                  "p-5 flex items-center justify-between cursor-pointer transition-all group",
                  activeId === node.id
                    ? "bg-primary/5 border-l-2 border-primary"
                    : "hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-background/50 border border-white/5 transition-all",
                      activeId === node.id
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <Text
                      variant="bodySmall"
                      weight="bold"
                      className={cn(
                        "block truncate transition-colors",
                        activeId === node.id
                          ? "text-primary"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      {node.label}
                    </Text>
                    <Text
                      variant="caption"
                      className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest opacity-50"
                    >
                      {node.type}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[8px] border-white/5 bg-background/30 h-5 px-1.5 font-mono"
                  >
                    {node.metrics.articles}
                  </Badge>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 transition-all",
                      activeId === node.id
                        ? "text-primary opacity-100"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 bg-muted/10 border-t border-white/5">
        <div className="flex items-center gap-3 w-full">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <Text
              variant="label"
              className="text-[8px] opacity-50 uppercase font-bold"
            >
              Index Integrity
            </Text>
            <Text
              variant="caption"
              weight="bold"
              className="text-emerald-500 block"
            >
              Stable Handshake
            </Text>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
