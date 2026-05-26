'use client';

import React, { useState, useMemo } from 'react';
import { CreatorProfile, CreatorContentItem } from '@/types';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Calendar, 
  ArrowLeft,
  Search,
  Filter,
  ArrowUpRight,
  Edit,
  Trash2,
  Tag as TagIcon,
  Layers,
  MoreVertical,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 6;

interface CreatorContentClientProps {
  creator: CreatorProfile;
  initialContent: CreatorContentItem[];
}

/**
 * Enhanced content discovery and management archive for an individual expert.
 * Supports multi-factor filtering, pagination, and mock administrative actions.
 */
export function CreatorContentClient({ creator, initialContent }: CreatorContentClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [content, setContent] = useState<CreatorContentItem[]>(initialContent);

  // Derive unique categories for filtering
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(initialContent.map(item => item.category)))],
    [initialContent]
  );

  // Filter & Search Logic
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.snippet?.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [content, search, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);
  const paginatedResults = filteredContent.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = (id: string, title: string) => {
    setContent(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Insight Removed",
      description: `"${title}" has been purged from the Intelligence Index.`,
      variant: "destructive",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold text-[10px] uppercase">Published</Badge>;
      case 'scheduled': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px] uppercase">Scheduled</Badge>;
      default: return <Badge variant="secondary" className="opacity-70 font-bold text-[10px] uppercase">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Context */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href={`/creator/${creator.id}`}><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <BookOpen className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Intelligence Archive</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">{creator.displayName}</Text>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search research..." 
              className="pl-10 bg-card/30 border-white/10 h-11 rounded-xl" 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px] h-11 bg-card/30 border-white/10 rounded-xl">
              <Layers className="mr-2 h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="Taxonomy" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-white/10 bg-card/30">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content Discovery Matrix */}
      {paginatedResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedResults.map((item) => (
            <Card key={item.id} className="glass-card flex flex-col group overflow-hidden transition-all hover:translate-y-[-4px] hover:border-primary/40 h-full relative">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/creator/dashboard/editor?id=${item.id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit Analysis
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id, item.title)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Insight
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 pt-2 flex-grow">
                <Text variant="bodySmall" className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                  {item.snippet || "Access high-impact financial intelligence and expert research nodes within the Imperialpedia Index."}
                </Text>
                
                <div className="flex flex-wrap gap-1">
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-secondary/5 text-secondary text-[9px] font-bold border-none px-2">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 border-t border-white/5 flex items-center justify-between bg-card/10">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <Text variant="caption">{(item.views / 1000).toFixed(1)}k</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <Text variant="caption">8m read</Text>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="h-8 px-2 text-primary font-bold text-xs group/btn" asChild>
                  <Link href={item.status === 'published' ? `/articles/${item.slug}` : '#'}>
                    {item.status === 'published' ? 'Read Full' : 'Resume Draft'} 
                    <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-card/10 rounded-[3rem] border-2 border-dashed border-white/5">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <Text variant="h3" className="mb-2">No research found</Text>
          <Text variant="bodySmall" className="text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or taxonomy filters to expand your results.
          </Text>
          <Button variant="link" className="mt-4 text-primary font-bold" onClick={() => { setSearch(''); setSelectedCategory('all'); }}>
            Clear all active filters
          </Button>
        </div>
      )}

      {/* Discovery Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-10">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl px-4 h-10 gap-2 font-bold"
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
                className="w-10 h-10 rounded-xl font-bold"
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
            className="rounded-xl px-4 h-10 gap-2 font-bold"
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
