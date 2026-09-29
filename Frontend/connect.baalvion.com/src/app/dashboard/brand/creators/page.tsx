
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Zap, 
  Star, 
  Users, 
  TrendingUp, 
  MapPin, 
  IndianRupee, 
  Instagram, 
  Youtube, 
  Music2, 
  Loader2,
  Bookmark,
  ChevronRight,
  LayoutGrid,
  List
} from 'lucide-react';
import { useCreatorStore } from '@/store/useCreatorStore';
import { useDealStore } from '@/store/useDealStore';
import { Creator } from '@/types/creator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function CreatorMarketplace() {
  const { creators, loading, filters, setFilters, fetchCreators, shortlistCreator } = useCreatorStore();
  const { deals, fetchDeals, selectedDeal } = useDealStore();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCreators();
    fetchDeals();
  }, []);

  const handleShortlist = async (creator: Creator) => {
    if (!selectedDeal) {
      return toast({ 
        variant: 'destructive', 
        title: 'Select a Deal first', 
        description: 'Open a deal from the sales pipeline to shortlist creators for it.' 
      });
    }
    await shortlistCreator(creator.id, selectedDeal.id);
    toast({ title: 'Creator Shortlisted', description: `Added ${creator.name} to ${selectedDeal.companyName}` });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Creator Marketplace</h1>
          <p className="text-slate-500 font-medium">Discover and collaborate with verified talent across all niches.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <Button 
              variant={viewMode === 'grid' ? 'outline' : 'ghost'} 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'outline' : 'ghost'} 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name or handle..." 
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          
          <Select value={filters.platform} onValueChange={(v: any) => setFilters({ platform: v })}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs w-36">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.tier} onValueChange={(v: any) => setFilters({ tier: v })}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs w-32">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="micro">Micro</SelectItem>
              <SelectItem value="mid">Mid-Tier</SelectItem>
              <SelectItem value="macro">Macro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {creators.map((creator) => (
            <Card key={creator.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] overflow-hidden bg-white group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="h-16 w-16 rounded-2xl border-2 border-slate-50 shadow-sm">
                    <AvatarImage src={creator.avatar} />
                    <AvatarFallback>{creator.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-black uppercase">
                      {creator.tier}
                    </Badge>
                    <div className="flex gap-1">
                      {creator.platform === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                      {creator.platform === 'youtube' && <Youtube className="h-4 w-4 text-red-600" />}
                      {creator.platform === 'tiktok' && <Music2 className="h-4 w-4 text-slate-900" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="font-black text-slate-900 truncate">{creator.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">@{creator.username}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reach</p>
                    <p className="text-sm font-black text-slate-900">{(creator.followers / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engagement</p>
                    <p className="text-sm font-black text-emerald-600">{creator.engagementRate}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[8px] font-bold border-slate-100">{creator.niche}</Badge>
                  <Badge variant="outline" className="text-[8px] font-bold border-slate-100">{creator.location}</Badge>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl font-bold h-10"
                  onClick={() => handleShortlist(creator)}
                >
                  <Bookmark className="h-4 w-4 mr-2" /> Shortlist
                </Button>
                <Button className="flex-1 rounded-xl font-bold h-10 shadow-lg shadow-primary/10">
                  Profile
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
