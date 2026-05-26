'use client';

import React, { useState, useMemo } from 'react';
import { CreatorProfile } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  TrendingUp, 
  Grid as GridIcon, 
  ChevronLeft,
  ChevronRight,
  Globe,
  Tag as TagIcon,
  SortAsc,
  UserCheck,
  Calendar
} from 'lucide-react';
import { CreatorCard } from '@/modules/creators/components/CreatorCard';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/design-system/typography/text';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE = 8;

interface CreatorDiscoveryClientProps {
  initialCreators: CreatorProfile[];
}

/**
 * Intelligent discovery engine for the Creator Economy platform.
 * Supports multi-vector search, taxonomy filtering, adaptive sorting, and dynamic pagination.
 */
export function CreatorDiscoveryClient({ initialCreators }: CreatorDiscoveryClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [currentPage, setCurrentPage] = useState(1);

  // Derive unique categories and regions for filters
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(initialCreators.map(c => c.category))).sort()], 
    [initialCreators]
  );
  
  const regions = useMemo(() => 
    ['all', ...Array.from(new Set(initialCreators.map(c => c.region))).sort()], 
    [initialCreators]
  );

  // Search, Filter & Sort Logic
  const filteredAndSortedCreators = useMemo(() => {
    // 1. Filtering
    let results = initialCreators.filter(creator => {
      const matchesSearch = 
        creator.displayName.toLowerCase().includes(search.toLowerCase()) || 
        creator.bio.toLowerCase().includes(search.toLowerCase()) ||
        creator.specialties.some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || creator.category === selectedCategory;
      const matchesRegion = selectedRegion === 'all' || creator.region === selectedRegion;
      const matchesVerified = !verifiedOnly || creator.verified;

      return matchesSearch && matchesCategory && matchesRegion && matchesVerified;
    });

    // 2. Sorting
    results.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.stats.followersCount - a.stats.followersCount;
        case 'newest':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        case 'verified':
          // Sort verified experts to the top
          if (a.verified === b.verified) return 0;
          return a.verified ? -1 : 1;
        case 'alphabetical':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });

    return results;
  }, [initialCreators, search, selectedCategory, selectedRegion, verifiedOnly, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedCreators.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredAndSortedCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedRegion('all');
    setVerifiedOnly(false);
    setSortBy('popularity');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-10">
      {/* Search & Filter Matrix */}
      <div className="bg-card/30 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl space-y-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by expert name, specialty, or bio..." 
              className="pl-12 h-14 bg-background/50 border-white/10 rounded-2xl text-lg focus:ring-primary/40 focus:border-primary transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-background/40 px-5 py-3.5 rounded-2xl border border-white/5 shadow-inner">
              <Checkbox 
                id="verified" 
                checked={verifiedOnly} 
                onCheckedChange={(val) => {
                  setVerifiedOnly(val as boolean);
                  setCurrentPage(1);
                }}
              />
              <Label htmlFor="verified" className="text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" /> Verified Only
              </Label>
            </div>
            
            <Button variant="ghost" className="text-muted-foreground hover:text-primary font-bold" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Text variant="label" className="text-[10px] ml-1 opacity-50">Finance Taxonomy</Text>
            <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Text variant="label" className="text-[10px] ml-1 opacity-50">Expert Location</Text>
            <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-secondary" />
                  <SelectValue placeholder="Region" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {regions.map(reg => (
                  <SelectItem key={reg} value={reg}>{reg.charAt(0).toUpperCase() + reg.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Text variant="label" className="text-[10px] ml-1 opacity-50">Discovery Order</Text>
            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="Sort By" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">
                  <div className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Most Followed</div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Newest Joined</div>
                </SelectItem>
                <SelectItem value="verified">
                  <div className="flex items-center gap-2"><UserCheck className="h-3 w-3" /> Verified Authority</div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2"><SortAsc className="h-3 w-3" /> Alphabetical</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Feedback */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <Text variant="bodySmall" className="text-muted-foreground font-bold italic">
          Intelligence Discovery: <span className="text-foreground">{filteredAndSortedCreators.length} experts</span> indexed matching your criteria
        </Text>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl"><GridIcon className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Results Grid */}
      {paginatedResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {paginatedResults.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="py-40 text-center border-2 border-dashed rounded-[4rem] border-white/5 bg-card/10 backdrop-blur-sm">
          <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Search className="h-12 w-12 text-muted-foreground opacity-30" />
          </div>
          <Text variant="h3" className="mb-3 font-bold">No experts found</Text>
          <Text variant="bodySmall" className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            We couldn't find any experts matching your current search terms or filter selection. Try broadening your criteria.
          </Text>
          <Button 
            variant="outline" 
            className="mt-8 rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5" 
            onClick={resetFilters}
          >
            Clear all active filters
          </Button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-16">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/5"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage(prev => prev - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className={`w-11 h-11 rounded-xl font-bold transition-all ${
                  currentPage === page ? "shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {page}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl px-6 h-11 gap-2 font-bold bg-card/30 border-white/5"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage(prev => prev + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}