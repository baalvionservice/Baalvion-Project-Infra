"use client";

import React, { useState } from "react";
import { PremiumReport } from "@/types/premium";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import {
  FileText,
  Download,
  Search,
  Filter,
  ArrowRight,
  BarChart3,
  Table as TableIcon,
  ChevronRight,
  ExternalLink,
  Zap,
  Globe,
  PieChart,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PremiumReportsClientProps {
  initialReports: PremiumReport[];
}

export function PremiumReportsClient({
  initialReports,
}: PremiumReportsClientProps) {
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.report_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = category === "all" || r.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    ...Array.from(new Set(reports.map((r) => r.category))),
  ];

  const COLORS = ["#8272F2", "#69B9FF", "#10b981", "#f59e0b"];

  const handleDownload = (name: string) => {
    toast({
      title: "Download Initiated",
      description: `Compressing institutional audit: ${name}.pdf`,
    });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      {/* Search & Meta */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/30 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Globe className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              Institutional Library
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Intelligence Reports
          </Text>
          <div className="relative group max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search research archive by name or taxonomy..."
              className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                className="rounded-xl font-bold text-[10px] uppercase h-10 px-4 transition-all"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-10 px-4 rounded-xl border-white/10 bg-background/30 gap-2 font-bold text-xs"
          >
            <Download className="h-3.5 w-3.5 text-primary" /> Archive Export
          </Button>
        </div>
      </header>

      {/* Reports Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className={cn(
              "glass-card border-none shadow-2xl overflow-hidden group hover:border-primary/20 transition-all duration-500",
              report.type === "chart" ? "lg:col-span-8" : "lg:col-span-4"
            )}
          >
            <CardHeader className="bg-card/30 border-b border-white/5 p-6 flex flex-row items-center justify-between">
              <div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary mb-2"
                >
                  {report.category}
                </Badge>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                  {report.report_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono">
                  <Calendar className="h-3 w-3" /> {report.date}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => handleDownload(report.report_name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <Text
                variant="bodySmall"
                className="text-muted-foreground mb-8 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1"
              >
                "{report.description}"
              </Text>

              {report.type === "chart" && (
                <div className="h-[300px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff05"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="asset"
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
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {report.data.map((_, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {report.type === "table" && (
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-background/20">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-white/5 bg-muted/20">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">
                          Sector Node
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">
                          Yield Var.
                        </TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">
                          Risk Profile
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.data.map((row, i) => (
                        <TableRow
                          key={i}
                          className="border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-bold text-sm pl-6">
                            {row.sector}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono font-bold",
                              row.performance.includes("+")
                                ? "text-emerald-500"
                                : "text-destructive"
                            )}
                          >
                            {row.performance}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge
                              variant="secondary"
                              className="text-[8px] font-bold uppercase border-none bg-muted/30"
                            >
                              {row.volatility}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {report.type === "summary" && (
                <div className="space-y-4">
                  {report.data.map((node, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-white/5 group/item hover:border-secondary/30 transition-all shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-secondary/10 text-secondary group-hover/item:bg-secondary group-hover/item:text-white transition-all">
                          <Zap className="h-4 w-4" />
                        </div>
                        <Text variant="bodySmall" weight="bold">
                          {node.protocol}
                        </Text>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-500">
                          {node.apy} APY
                        </div>
                        <Text
                          variant="caption"
                          className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter"
                        >
                          Verified Node
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/10 border-t border-white/5 p-4 flex justify-between items-center group-hover:bg-primary/5 transition-colors">
              <Text
                variant="caption"
                className="text-muted-foreground font-medium flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> E-E-A-T
                Verified Audit
              </Text>
              <Button
                variant="link"
                className="p-0 h-auto text-primary text-[10px] font-bold uppercase tracking-widest group/link"
                asChild
              >
                <a href="#">
                  Analyze Research Node{" "}
                  <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Strategic Footer */}
      <Card className="glass-card border-none bg-primary/5 p-12 relative overflow-hidden text-center lg:text-left">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <PieChart className="h-64 w-64 text-primary" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <BarChart3 className="h-12 w-12" />
          </div>
          <div className="flex-1 space-y-3">
            <Text variant="h2" className="text-3xl font-bold tracking-tight">
              Custom Institutional Audits
            </Text>
            <Text
              variant="body"
              className="text-muted-foreground leading-relaxed max-w-3xl"
            >
              As a **Pro** member, you can request custom research nodes for
              specialized taxonomies. Our analyst engine will aggregate
              institutional wires and social sentiment specifically for your
              portfolio nodes.
            </Text>
          </div>
          <Button
            size="lg"
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0 scale-105 active:scale-95 transition-all"
          >
            Request Custom Intel
          </Button>
        </div>
      </Card>
    </div>
  );
}
