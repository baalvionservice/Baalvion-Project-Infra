
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Star,
  Eye,
  EyeOff,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Edit2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { PortfolioItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { AddPortfolioItemDialog } from '@/components/dashboard/creator/AddPortfolioItemDialog';
import { cn } from '@/lib/utils';

export default function CreatorPortfolioPage() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'FEATURED' | 'PRIVATE'>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 1. Fetch Portfolio Items
  const portfolioQuery = useMemo(() => {
    if (!currentUser?.id) return null;
    return query(
      collection(db!, 'portfolioItems'),
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc')
    );
  }, [db!, currentUser?.id]);

  const { data: items, loading } = useCollection<PortfolioItem>(portfolioQuery);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.platform.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'ALL'
        ? true
        : activeTab === 'FEATURED'
          ? item.isFeatured
          : !item.isPublic;
      return matchesSearch && matchesTab;
    });
  }, [items, searchQuery, activeTab]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db!, 'portfolioItems', id));
      toast({ title: "Item deleted", description: "Your portfolio has been updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item." });
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db!, 'portfolioItems', id), { isFeatured: !current });
      toast({ title: !current ? "Pinned to top" : "Removed from featured" });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db!, 'portfolioItems', id), { isPublic: !current });
      toast({ title: !current ? "Now visible to brands" : "Hidden from profile" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Portfolio Manager</h1>
          <p className="text-slate-500 mt-1">Curate your best work to show brands exactly what you're capable of.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold bg-white" asChild>
            <a href={`/creator/${currentUser?.displayName?.toLowerCase().replace(' ', '_')}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" /> View Public Profile
            </a>
          </Button>
          <Button
            className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Work Sample
          </Button>
        </div>
      </div>

      {/* Portfolio Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Samples</p>
              <h3 className="text-2xl font-black text-slate-900">{items.length}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Star className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Featured Posts</p>
              <h3 className="text-2xl font-black text-slate-900">{items.filter(i => i.isFeatured).length}</h3>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Verified Reach</p>
              <h3 className="text-2xl font-black">1.2M+ Views</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border w-fit">
          {[
            { id: 'ALL', label: 'All Work' },
            { id: 'FEATURED', label: 'Featured' },
            { id: 'PRIVATE', label: 'Private' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'outline' : 'ghost'}
              size="sm"
              className={cn(
                "rounded-xl font-bold px-6 h-10",
                activeTab === tab.id && "shadow-sm"
              )}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search title or platform..."
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Masonry Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing your work...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                index={idx}
                onDelete={() => handleDelete(item.id)}
                onToggleFeatured={() => toggleFeatured(item.id, item.isFeatured)}
                onToggleVisibility={() => toggleVisibility(item.id, item.isPublic)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
          <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
            <ImageIcon className="h-12 w-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Your portfolio is empty</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
            Upload your best collaborations to attract higher-paying brand campaigns.
          </p>
          <Button
            className="mt-10 rounded-full px-10 h-14 text-lg font-black shadow-xl shadow-primary/20"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" /> Start Building
          </Button>
        </div>
      )}

      <AddPortfolioItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}

function PortfolioItemCard({ item, index, onDelete, onToggleFeatured, onToggleVisibility }: {
  item: PortfolioItem,
  index: number,
  onDelete: () => void,
  onToggleFeatured: () => void,
  onToggleVisibility: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="break-inside-avoid"
      layout
    >
      <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <CardContent className="p-0 relative">
          {/* Media Preview */}
          <div className="relative aspect-video sm:aspect-square lg:aspect-[4/5] overflow-hidden group-hover:cursor-pointer">
            <img
              src={item.mediaUrl}
              alt={item.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button size="icon" variant="secondary" className="rounded-full h-10 w-10">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="danger" className="rounded-full h-10 w-10" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.isFeatured && (
                <Badge className="bg-orange-500 text-white border-none shadow-lg px-3 py-1 font-black text-[10px] uppercase">
                  <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                </Badge>
              )}
              {!item.isPublic && (
                <Badge className="bg-slate-900/80 backdrop-blur-md text-white border-none px-3 py-1 font-black text-[10px] uppercase">
                  <EyeOff className="h-3 w-3 mr-1" /> Private
                </Badge>
              )}
            </div>

            <div className="absolute top-4 right-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-48 p-2">
                  <DropdownMenuItem onClick={onToggleFeatured} className="rounded-lg font-bold">
                    <Star className="mr-2 h-4 w-4 text-orange-500" />
                    {item.isFeatured ? 'Unpin from top' : 'Mark as Featured'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleVisibility} className="rounded-lg font-bold">
                    {item.isPublic ? <><EyeOff className="mr-2 h-4 w-4" /> Hide from profile</> : <><Eye className="mr-2 h-4 w-4" /> Make Public</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-lg font-bold text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Sample
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.platform}</p>
                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-1">{item.title}</h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {item.mediaType === 'VIDEO' ? <VideoIcon className="h-5 w-5 text-blue-500" /> : <ImageIcon className="h-5 w-5 text-pink-500" />}
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            {item.results && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-emerald-600 fill-emerald-600/20" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter leading-none">Campaign Results</p>
                  <p className="text-xs font-bold text-slate-700 truncate mt-1">{item.results}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[9px] uppercase tracking-tighter px-2 h-5">
                {item.campaignType}
              </Badge>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-auto">
                {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
