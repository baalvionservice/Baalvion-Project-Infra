'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Zap, 
  Bookmark, 
  Clock, 
  Users, 
  IndianRupee, 
  Target, 
  ChevronRight,
  Instagram,
  Youtube,
  Music2,
  Globe,
  LayoutGrid,
  List,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { CREATOR_NICHES, SOCIAL_PLATFORMS, COUNTRIES } from '@/constants';
import { cn } from '@/lib/utils';

// Mock Data
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    brand: 'Lumina Tech',
    logo: 'https://picsum.photos/seed/lum1/100/100',
    title: 'AI Smart Home Ecosystem Review',
    budget: '₹45,000',
    deadline: 'July 28, 2024',
    spotsLeft: 3,
    matchScore: 98,
    niche: 'Tech & Gadgets',
    platform: 'YouTube',
    deliverables: ['1 Dedicated Video (10m+)', '3 Community Posts'],
    type: 'Dedicated Video',
    location: 'India',
    isSaved: false
  },
  {
    id: '2',
    brand: 'EcoVibe',
    logo: 'https://picsum.photos/seed/eco1/100/100',
    title: 'Summer Organic Linen Collection',
    budget: '₹12,500',
    deadline: 'July 24, 2024',
    spotsLeft: 8,
    matchScore: 94,
    niche: 'Fashion & Style',
    platform: 'Instagram',
    deliverables: ['1 Main Feed Reel', '2 Stories with Links'],
    type: 'Reel + Stories',
    location: 'Global',
    isSaved: true
  },
  {
    id: '3',
    brand: 'FitFlow',
    logo: 'https://picsum.photos/seed/fit1/100/100',
    title: '30-Day Morning Vitality Challenge',
    budget: '₹22,000',
    deadline: 'August 02, 2024',
    spotsLeft: 5,
    matchScore: 89,
    niche: 'Fitness & Wellness',
    platform: 'TikTok',
    deliverables: ['4 Video Series (weekly)', 'Product Link in Bio'],
    type: 'Short-form Series',
    location: 'United States',
    isSaved: false
  },
  {
    id: '4',
    brand: 'Azure Skincare',
    logo: 'https://picsum.photos/seed/azu1/100/100',
    title: 'Night Recovery Serum Launch',
    budget: '₹35,000',
    deadline: 'July 30, 2024',
    spotsLeft: 2,
    matchScore: 96,
    niche: 'Beauty & Personal Care',
    platform: 'Instagram',
    deliverables: ['1 Aesthetic Reel', '1 High-res Product Shot'],
    type: 'Content Creation',
    location: 'Global',
    isSaved: false
  },
  {
    id: '5',
    brand: 'GamerZone',
    logo: 'https://picsum.photos/seed/gam1/100/100',
    title: 'Pro-Series Mechanical Keyboard',
    budget: '₹18,000',
    deadline: 'August 15, 2024',
    spotsLeft: 12,
    matchScore: 82,
    niche: 'Gaming',
    platform: 'YouTube',
    deliverables: ['1 Integration (60s)', 'Discord Shoutout'],
    type: 'Integration',
    location: 'Global',
    isSaved: false
  },
  {
    id: '6',
    brand: 'Nomad Gear',
    logo: 'https://picsum.photos/seed/nom1/100/100',
    title: 'Ultralight Hiking Pack Promo',
    budget: '₹28,500',
    deadline: 'August 05, 2024',
    spotsLeft: 4,
    matchScore: 91,
    niche: 'Travel & Adventure',
    platform: 'Instagram',
    deliverables: ['1 Reel', '5 Stories', 'Usage Rights (3mo)'],
    type: 'Full Campaign',
    location: 'India',
    isSaved: true
  }
];

export default function DiscoverCampaignsPage() {
  const [viewMode, setViewViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetRange, setBudgetRange] = useState([0]);
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const filteredCampaigns = useMemo(() => {
    return MOCK_CAMPAIGNS.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNiche = selectedNiche === 'all' || c.niche === selectedNiche;
      const matchPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
      const matchType = selectedType === 'all' || c.type.includes(selectedType);
      const matchLocation = selectedLocation === 'all' || c.location === selectedLocation;
      return matchSearch && matchNiche && matchPlatform && matchType && matchLocation;
    });
  }, [searchQuery, selectedNiche, selectedPlatform, selectedType, selectedLocation]);

  const savedCampaigns = filteredCampaigns.filter(c => c.isSaved);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'YouTube': return <Youtube className="h-4 w-4 text-red-600" />;
      case 'TikTok': return <Music2 className="h-4 w-4 text-slate-900" />;
      default: return <Globe className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Campaign Discovery</h1>
          <p className="text-slate-500 mt-1">Explore and apply to campaigns tailored to your reach and style.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <Button 
              variant={viewMode === 'grid' ? 'outline' : 'ghost'} 
              size="icon" 
              className={cn("h-9 w-9 rounded-lg", viewMode === 'grid' && "shadow-sm")}
              onClick={() => setViewViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'outline' : 'ghost'} 
              size="icon" 
              className={cn("h-9 w-9 rounded-lg", viewMode === 'list' && "shadow-sm")}
              onClick={() => setViewViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white sticky top-24">
            <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filters
              </h3>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7 uppercase tracking-tight text-slate-400 hover:text-primary">
                Reset
              </Button>
            </div>
            <CardContent className="p-6 space-y-8">
              {/* Search */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Brand or keyword..." 
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Niche */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Category</label>
                <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                    <SelectValue placeholder="All Niches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Niches</SelectItem>
                    {CREATOR_NICHES.slice(0, 15).map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Instagram', 'YouTube', 'TikTok', 'X'].map((plat) => (
                    <Button 
                      key={plat} 
                      variant="outline" 
                      className={cn(
                        "h-10 rounded-xl font-bold text-xs border-slate-100",
                        selectedPlatform === plat ? "bg-primary/5 border-primary text-primary" : "bg-white"
                      )}
                      onClick={() => setSelectedPlatform(selectedPlatform === plat ? 'all' : plat)}
                    >
                      {plat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Min. Budget</label>
                  <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">₹{budgetRange[0]}+</span>
                </div>
                <Slider 
                  value={budgetRange} 
                  onValueChange={setBudgetRange} 
                  max={100000} 
                  step={5000} 
                  className="py-2"
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Target Market</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none">
                    <SelectValue placeholder="Global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global Reach</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          <Tabs defaultValue="browse" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-slate-100/50 p-1 rounded-2xl border">
                <TabsTrigger value="browse" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                  Discovery Feed
                </TabsTrigger>
                <TabsTrigger value="saved" className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                  Saved ({savedCampaigns.length})
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/20" />
                AI MATCHING ACTIVE
              </div>
            </div>

            <TabsContent value="browse" className="mt-0">
              <AnimatePresence mode="popLayout">
                {filteredCampaigns.length > 0 ? (
                  <motion.div 
                    className={cn(
                      "grid gap-6",
                      viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                    )}
                    layout
                  >
                    {filteredCampaigns.map((job, idx) => (
                      <CampaignCard key={job.id} job={job} mode={viewMode} index={idx} />
                    ))}
                  </motion.div>
                ) : (
                  <EmptyState />
                )}
              </AnimatePresence>

              {/* Pagination */}
              {filteredCampaigns.length > 0 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button variant="outline" disabled className="rounded-xl font-bold h-11 px-6">Previous</Button>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(p => (
                      <Button key={p} variant={p === 1 ? 'primary' : 'ghost'} className="h-11 w-11 rounded-xl font-bold">
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold h-11 px-6">Next</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              <AnimatePresence mode="popLayout">
                {savedCampaigns.length > 0 ? (
                  <motion.div 
                    className={cn(
                      "grid gap-6",
                      viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                    )}
                    layout
                  >
                    {savedCampaigns.map((job, idx) => (
                      <CampaignCard key={job.id} job={job} mode={viewMode} index={idx} />
                    ))}
                  </motion.div>
                ) : (
                  <EmptyState title="No saved campaigns" description="Bookmark campaigns you like to see them here later." />
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ job, mode, index }: { job: any, mode: 'grid' | 'list', index: number }) {
  const isGrid = mode === 'grid';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className={cn(
        "border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white border border-slate-100",
        !isGrid && "flex-row p-6 items-center"
      )}>
        {isGrid ? (
          <>
            <CardHeader className="p-6 pb-2">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-14 w-14 rounded-2xl border-2 border-slate-50 shadow-sm">
                  <AvatarImage src={job.logo} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">{job.brand[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-primary/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-primary/10">
                    <Zap className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-[10px] font-black text-primary">{job.matchScore}% MATCH</span>
                  </div>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", job.isSaved ? "text-primary" : "text-slate-300 hover:text-primary")}>
                    <Bookmark className={cn("h-4 w-4", job.isSaved && "fill-current")} />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{job.brand}</p>
                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                  {job.title}
                </h3>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 flex-1 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] px-2.5 py-1">
                  {job.niche}
                </Badge>
                <Badge variant="outline" className="bg-white text-primary border-primary/20 font-bold text-[10px] px-2.5 py-1 flex items-center gap-1.5">
                  {job.platform}
                </Badge>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requirements</p>
                <div className="space-y-2">
                  {job.deliverables.map((d: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Pay</p>
                    <p className="text-sm font-black text-slate-900">{job.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Ends</p>
                    <p className="text-[11px] font-bold text-slate-900 truncate">Jul 28</p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 mt-auto flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-tighter">
                <Users className="h-3.5 w-3.5" />
                <span>{job.spotsLeft} SPOTS LEFT</span>
              </div>
              <Button size="sm" className="rounded-xl font-bold h-9 px-6 shadow-lg shadow-primary/20">
                View Details
              </Button>
            </CardFooter>
          </>
        ) : (
          /* List Mode Row */
          <>
            <div className="flex-1 flex items-center gap-6">
              <Avatar className="h-16 w-16 rounded-2xl border-2 border-slate-50 shadow-sm">
                <AvatarImage src={job.logo} />
                <AvatarFallback>{job.brand[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{job.brand}</p>
                  <Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black uppercase tracking-tighter px-1.5 py-0 h-4 border-none">
                    {job.matchScore}% Match
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{job.title}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> {job.budget}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" /> {job.niche}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" /> {job.location}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 ml-8 border-l pl-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Deadline</p>
                <p className="text-sm font-bold text-slate-900">{job.deadline}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Bookmark className={cn("h-5 w-5", job.isSaved && "fill-primary text-primary")} />
                </Button>
                <Button className="rounded-xl font-bold px-8 h-11">Apply Now</Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}

function EmptyState({ title = "No campaigns found", description = "Try adjusting your filters or search terms." }: { title?: string, description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-xs mx-auto">{description}</p>
      <Button variant="outline" className="mt-8 rounded-xl font-bold px-8 border-slate-200" onClick={() => window.location.reload()}>
        Clear All Filters
      </Button>
    </div>
  );
}
