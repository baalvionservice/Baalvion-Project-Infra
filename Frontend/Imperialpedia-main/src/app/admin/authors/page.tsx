'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { 
  UserCheck, Plus, Search, Edit, Trash2, ShieldCheck, 
  ChevronRight, Loader2, Award, Zap, Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

export default function AuthorManagement() {
  const [search, setSearch] = useState('');
  
  const mockAuthors = [
    { id: 'a1', name: "Eleanor Vance", handle: "econvance", expertise: ["Macro", "SEO"], articles: 120, verified: true, avatar: "https://picsum.photos/seed/eleanor/100/100" },
    { id: 'a2', name: "Julian Wealth", handle: "wealth_builder", expertise: ["Investing", "Bonds"], articles: 85, verified: true, avatar: "https://picsum.photos/seed/julian/100/100" },
    { id: 'a3', name: "Sarah Crypto", handle: "defiqueen", expertise: ["DeFi", "Web3"], articles: 42, verified: false, avatar: "https://picsum.photos/seed/sarah/100/100" },
  ];

  const handleVerify = (name: string) => {
    toast({ title: "Author Verified", description: `${name} has been assigned expert credentials.`, variant: "default" });
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <UserCheck className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Expert Registry</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">Verified Contributors</Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Provision Author Profile
        </Button>
      </header>

      <div className="bg-card/30 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by expert name, handle, or specialty..." 
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
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Expert Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Specialties</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Articles</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuthors.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((author) => (
                <TableRow key={author.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-white/10 rounded-xl shadow-lg">
                        <AvatarImage src={author.avatar} />
                        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{author.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">@{author.handle}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {author.expertise.map(exp => (
                        <Badge key={exp} variant="outline" className="text-[8px] border-primary/20 bg-primary/5 text-primary uppercase font-bold px-1.5 h-4">
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs">{author.articles}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {author.verified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-bold uppercase h-5 px-2">Verified</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] font-bold uppercase text-amber-500 hover:bg-amber-500/10" onClick={() => handleVerify(author.name)}>
                          Verify Identity
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary"><Mail className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Award className="h-24 w-24 text-primary" /></div>
          <Text variant="bodySmall" weight="bold" className="text-primary uppercase tracking-widest text-[10px]">Credential Audit</Text>
          <Text variant="caption" className="text-muted-foreground leading-relaxed">
            Every author node must undergo a 3-point credentials verification before being assigned the **'Expert'** visual badge in the public discovery feed.
          </Text>
        </Card>

        <Card className="glass-card border-none bg-secondary/5 p-8 flex flex-col gap-4">
          <Text variant="bodySmall" weight="bold" className="text-secondary flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <ShieldCheck className="h-4 w-4" /> Editorial Integrity
          </Text>
          <Text variant="caption" className="text-muted-foreground leading-relaxed">
            Top contributors with 90%+ accuracy scores are granted **'Chief Auditor'** capabilities for their primary taxonomy hub.
          </Text>
        </Card>

        <Card className="glass-card border-none bg-amber-500/5 p-8 flex flex-col gap-4">
          <Text variant="bodySmall" weight="bold" className="text-amber-500 flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <Zap className="h-4 w-4" /> Impact Multiplier
          </Text>
          <Text variant="caption" className="text-muted-foreground leading-relaxed">
            Verified experts receive a **2.4x discovery multiplier** in the search index, increasing the yield of their intelligence nodes.
          </Text>
        </Card>
      </div>
    </div>
  );
}