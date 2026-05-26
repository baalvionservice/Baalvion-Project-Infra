'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  Layers, Plus, Search, Filter, Edit, Trash2, 
  ChevronRight, ArrowRight, Zap, Target
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function TopicManagement() {
  const [search, setSearch] = useState('');
  
  const mockTopics = [
    { id: 't1', name: "Investing", parent: "None", subcategories: 12, nodes: 450, status: "Active" },
    { id: 't2', name: "Stocks", parent: "Investing", subcategories: 8, nodes: 1200, status: "Active" },
    { id: 't3', name: "Personal Finance", parent: "None", subcategories: 6, nodes: 320, status: "Active" },
    { id: 't4', name: "Taxes", parent: "Personal Finance", subcategories: 4, nodes: 150, status: "Active" },
  ];

  const handleDelete = (name: string) => {
    toast({ title: "Node Purged", description: `Topic "${name}" removed from graph.`, variant: "destructive" });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Layers className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Knowledge Graph</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Topic Hierarchy</Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Add Topic Node
        </Button>
      </header>

      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search the taxonomy matrix..." 
            className="pl-12 bg-background/50 h-12 border-white/10 rounded-xl text-sm"
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
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Topic Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Parent Cluster</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Sub-Nodes</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Indexed Pages</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopics.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).map((topic) => (
                <TableRow key={topic.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{topic.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-bold uppercase border-white/10 bg-black/20 px-2 h-5">
                      {topic.parent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs">{topic.subcategories}</TableCell>
                  <TableCell className="text-center">
                    <div className="text-xs font-mono font-bold text-primary">{topic.nodes.toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => handleDelete(topic.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary"><Zap className="h-6 w-6" /></div>
          <Text variant="bodySmall" weight="bold" className="text-primary uppercase tracking-widest text-[10px]">AI Clustering</Text>
          <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
            "The graph engine has identified a potential cluster for **'RegTech'** under Compliance. AI suggests creating 5 sub-nodes for pSEO discovery."
          </Text>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 p-8 flex items-center justify-between group">
          <div className="space-y-2">
            <Text variant="bodySmall" weight="bold" className="text-secondary flex items-center gap-2 uppercase tracking-widest text-[10px]">
              <Target className="h-4 w-4" /> Discovery Map
            </Text>
            <Text variant="caption" className="text-muted-foreground">Visualize the full hierarchical knowledge matrix.</Text>
          </div>
          <Button variant="ghost" className="text-secondary font-bold group-hover:translate-x-1 transition-transform">
            Open Map <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}