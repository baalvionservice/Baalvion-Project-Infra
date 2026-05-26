'use client';

import React, { useEffect, useState } from 'react';
import { TrustRankedContributor } from '@/types/trust';
import { getTrustDirectory } from '@/services/mock-api/creators';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Loader2, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Star,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Directory hub for verified expert contributors ranked by trust nodes.
 */
export function TrustDirectoryClient() {
  const [contributors, setContributors] = useState<TrustRankedContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getTrustDirectory();
        if (response.data) setContributors(response.data);
      } catch (e) {
        console.error('Trust index sync failure', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = contributors.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <Text variant="bodySmall" className="animate-pulse font-bold tracking-widest uppercase text-muted-foreground">
          Establishing Institutional Handshake...
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Verified Authority Index</Text>
          </div>
          <Text variant="h1" className="text-4xl font-bold tracking-tight">Trusted Contributors</Text>
          <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Explore our curated directory of verified analysts and institutional experts. Trust is quantified via our proprietary precision algorithms.
          </Text>
        </div>
        
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search verified experts..." 
            className="pl-12 h-14 bg-card/30 border-white/10 rounded-2xl text-lg shadow-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Featured Strategic Triage Card */}
      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
          <Sparkles className="h-64 w-64 text-primary rotate-12" />
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <CheckCircle2 className="h-10 w-10 animate-pulse" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl lg:text-3xl font-bold">The Gold Standard of Trust</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed max-w-3xl text-base">
              Every contributor in this directory has undergone a mandatory **Credentials Audit**. Their research nodes are prioritized in search results, ensuring readers receive intelligence from authenticated sources.
            </Text>
          </div>
          <Button size="lg" className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 shrink-0">
            Expert Onboarding Hub
          </Button>
        </div>
      </Card>

      {/* Directory Matrix */}
      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">Expert Node</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Trust Index</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Verification Cluster</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Reach</TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="group hover:bg-white/5 transition-colors border-b border-white/5">
                  <TableCell className="py-6 pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-[1.5rem] border-2 border-background ring-1 ring-white/10 group-hover:border-primary/30 transition-all shadow-lg">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{user.title}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center w-24">
                        <span className="text-xs font-bold font-mono text-primary">{user.trust_score}%</span>
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      </div>
                      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${user.trust_score}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {user.verification.map(v => (
                        <Badge key={v} variant="outline" className="text-[8px] font-bold uppercase border-emerald-500/30 bg-emerald-500/5 text-emerald-500 h-5 px-1.5">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold font-mono">{(user.followers / 1000).toFixed(1)}k</span>
                      <Text variant="label" className="text-[7px] opacity-50 uppercase tracking-widest">Followers</Text>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-bold uppercase gap-2 text-muted-foreground hover:text-primary transition-all" asChild>
                      <Link href={`/creator/${user.id}`}>
                        Audit Expert <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Strategic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card border-none bg-card/30 p-8 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Trust Multiplier</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Research nodes from **Highly Trusted** contributors receive a prioritized visibility weight in global discovery, ensuring institutional fidelity for our audience.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-none bg-card/30 p-8 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Activity className="h-24 w-24 text-primary rotate-12" />
          </div>
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Velocity Adjustment</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Expert trust scores are re-indexed every 24 hours. Consistent predictive precision leads to tiered status upgrades and exclusive badge unlocks.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-none bg-card/30 p-8 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <Info className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Compliance Buffer</Text>
            <Text variant="caption" className="text-muted-foreground mt-2 leading-relaxed">
              Contributor identity data is cryptographically secured. Verification logs are immutable and stored within our off-site governance cluster for transparency.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
