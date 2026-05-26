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
import { Text } from "@/design-system/typography/text";
import {
  Users,
  Settings2,
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getEditorialDashboardData } from "@/services/mock-api/editorial";
import { EditorNode } from "@/types/editorial";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/**
 * Editorial Resource & Assignment Hub.
 * Orchestrates auditor workloads and expertise matching for the index.
 */
export default function EditorialAssignmentsPage() {
  const [editors, setEditors] = useState<EditorNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getEditorialDashboardData();
        if (response.data) setEditors(response.data.editors);
      } catch (e) {
        console.error("Assignment sync failure", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = (name: string) => {
    toast({
      title: "Handshake Initiated",
      description: `Reconfiguring assignment logic for auditor: ${name}`,
    });
  };

  const filtered = editors.filter(
    (ed) =>
      ed.name.toLowerCase().includes(search.toLowerCase()) ||
      ed.expertise.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-12 w-12"
            asChild
          >
            <Link href="/editor/dashboard">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="h-4 w-4" />
              <Text
                variant="label"
                className="text-[10px] font-bold tracking-widest uppercase"
              >
                Auditor Registry
              </Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold tracking-tight">
              Resource Management
            </Text>
          </div>
        </div>
        <Button className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" /> Provision Auditor
        </Button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search auditors by name or taxonomy focus..."
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="glass-card h-64 animate-pulse border-white/5 bg-card/30"
              />
            ))
          : filtered.map((ed) => (
              <Card
                key={ed.id}
                className="glass-card border-none shadow-xl hover:border-primary/20 transition-all group overflow-hidden"
              >
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                    <Avatar className="h-16 w-16 rounded-[1.5rem] border-2 border-background ring-1 ring-white/10 shadow-xl group-hover:border-primary/30 transition-all">
                      <AvatarImage src={ed.avatar} />
                      <AvatarFallback>{ed.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge
                      className={cn(
                        "border-none text-[8px] font-bold uppercase px-2 h-5",
                        ed.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {ed.status}
                    </Badge>
                  </div>
                  <Text
                    variant="h3"
                    className="text-xl font-bold group-hover:text-primary transition-colors"
                  >
                    {ed.name}
                  </Text>
                  <Text
                    variant="caption"
                    className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] mt-1 block"
                  >
                    {ed.expertise}
                  </Text>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Workload Depth</span>
                      <span className="text-primary">
                        {ed.review_progress}%
                      </span>
                    </div>
                    <Progress
                      value={ed.review_progress}
                      className="h-1 bg-white/5"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5 shadow-inner">
                    <div className="text-center flex-1 space-y-1">
                      <div className="text-lg font-bold font-mono">
                        {ed.articles_assigned}
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase"
                      >
                        Active Nodes
                      </Text>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-center flex-1 space-y-1">
                      <div className="text-lg font-bold font-mono text-emerald-500">
                        4.2h
                      </div>
                      <Text
                        variant="label"
                        className="text-[7px] opacity-50 font-bold uppercase"
                      >
                        Avg. Triage
                      </Text>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/10 border-t border-white/5">
                  <Button
                    variant="ghost"
                    className="w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                    onClick={() => handleAction(ed.name)}
                  >
                    Modify Workload Logic
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>

      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Zap className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Heuristic Load Balancing
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl text-base"
            >
              The platform architecture utilizes a **Taxonomy-Expertise
              Matcher**. New submissions are automatically routed to auditors
              with the highest historical precision in the corresponding
              financial hub.
            </Text>
          </div>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
          >
            Configure Routing Order
          </Button>
        </div>
      </Card>
    </div>
  );
}
