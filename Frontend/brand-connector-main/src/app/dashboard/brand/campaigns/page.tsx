'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  IndianRupee,
  Users,
  FileText,
  Clock,
  Pause,
  Play,
  Copy,
  Archive,
  Edit2,
  ChevronRight,
  TrendingUp,
  Loader2,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { Campaign, CampaignStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type SortOption = 'newest' | 'deadline' | 'budget';

export default function BrandCampaignsPage() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Fetch campaigns for the current brand
  const campaignsQuery = useMemo(() => {
    if (!currentUser?.id || !db) return null;
    return query(
      collection(db, 'campaigns'),
      where('brandId', '==', `brand_${currentUser.id}`),
      orderBy('createdAt', 'desc')
    );
  }, [db, currentUser?.id]);

  const { data: campaigns, loading } = useCollection<Campaign>(campaignsQuery);

  const filteredCampaigns = useMemo(() => {
    return (campaigns || []).filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = activeTab === 'ALL' || c.status === activeTab;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'deadline') return new Date(a.endDate || '').getTime() - new Date(b.endDate || '').getTime();
      return 0;
    });
  }, [campaigns, searchQuery, activeTab, sortBy]);

  const handleUpdateStatus = (id: string, newStatus: CampaignStatus) => {
    const campaignRef = doc(db!, 'campaigns', id);
    updateDoc(campaignRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `/campaigns/${id}`,
        operation: 'update',
        requestResourceData: { status: newStatus }
      }));
    });
    toast({ title: `Campaign ${newStatus.toLowerCase()}` });
  };

  const handleDuplicate = (campaign: Campaign) => {
    // Redirect to creation flow with source ID for pre-population
    router.push(`/dashboard/campaigns/new?sourceId=${campaign.id}`);
    toast({ title: "Cloning Campaign...", description: "Preparing draft from source settings." });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaign Portfolio</h1>
          <p className="text-slate-500 font-medium">Manage and monitor your influencer marketing initiatives.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns/new">
            <Button className="rounded-xl font-bold shadow-lg shadow-primary/20 h-11 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Launch New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sort By:</label>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="font-bold">Newest First</SelectItem>
                <SelectItem value="deadline" className="font-bold">By Deadline</SelectItem>
                <SelectItem value="budget" className="font-bold">By Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Campaign List Tabs */}
      <Tabs defaultValue="ACTIVE" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border min-w-max">
            <TabsTrigger value="ACTIVE" className="rounded-xl px-8 font-bold flex items-center gap-2">
              Active
              {campaigns.filter(c => c.status === 'ACTIVE').length > 0 && (
                <Badge className="h-5 min-w-[20px] p-0 flex items-center justify-center bg-primary text-white border-none">
                  {campaigns.filter(c => c.status === 'ACTIVE').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="DRAFT" className="rounded-xl px-8 font-bold">Drafts</TabsTrigger>
            <TabsTrigger value="PAUSED" className="rounded-xl px-8 font-bold">Paused</TabsTrigger>
            <TabsTrigger value="COMPLETED" className="rounded-xl px-8 font-bold">Completed</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing campaign data...</p>
            </div>
          ) : filteredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredCampaigns.map((campaign, idx) => (
                  <CampaignManagementCard
                    key={campaign.id}
                    campaign={campaign}
                    index={idx}
                    onStatusUpdate={handleUpdateStatus}
                    onDuplicate={() => handleDuplicate(campaign)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState tab={activeTab} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CampaignManagementCard({ campaign, index, onStatusUpdate, onDuplicate }: {
  campaign: Campaign,
  index: number,
  onStatusUpdate: (id: string, s: CampaignStatus) => void,
  onDuplicate: () => void
}) {
  // Mock performance data for visual fidelity
  const spent = Math.round(campaign.budget * 0.45);
  const creatorsCount = 4;
  const appsCount = 28;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { label: 'Live', color: 'bg-emerald-100 text-emerald-600', icon: Zap };
      case 'DRAFT': return { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: FileText };
      case 'PAUSED': return { label: 'Paused', color: 'bg-orange-100 text-orange-600', icon: Pause };
      case 'COMPLETED': return { label: 'Finished', color: 'bg-blue-100 text-blue-600', icon: CheckCircle2 };
      default: return { label: status, color: 'bg-slate-100 text-slate-500', icon: Zap };
    }
  };

  const status = getStatusConfig(campaign.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white group flex flex-col h-full ring-1 ring-slate-100">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-none", status.color)}>
              <status.icon className="h-3 w-3 mr-1.5" />
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 border shadow-xl">
                <DropdownMenuItem className="rounded-lg font-bold">
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} className="rounded-lg font-bold">
                  <Copy className="h-4 w-4 mr-2" /> Duplicate Strategy
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {campaign.status === 'ACTIVE' ? (
                  <DropdownMenuItem onClick={() => onStatusUpdate(campaign.id, CampaignStatus.PAUSED)} className="rounded-lg font-bold text-orange-600">
                    <Pause className="h-4 w-4 mr-2" /> Pause Hiring
                  </DropdownMenuItem>
                ) : campaign.status === 'PAUSED' ? (
                  <DropdownMenuItem onClick={() => onStatusUpdate(campaign.id, CampaignStatus.ACTIVE)} className="rounded-lg font-bold text-emerald-600">
                    <Play className="h-4 w-4 mr-2" /> Resume Hiring
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem className="rounded-lg font-bold text-red-600">
                  <Archive className="h-4 w-4 mr-2" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {campaign.title}
          </h3>
        </CardHeader>

        <CardContent className="p-8 pt-0 flex-1 space-y-6">
          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Budget Utilization</span>
              <span className="text-slate-900">₹{spent.toLocaleString()} / ₹{campaign.budget.toLocaleString()}</span>
            </div>
            <Progress value={(spent / campaign.budget) * 100} className="h-1.5 bg-slate-50" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Users className="h-3 w-3" /> Creators
              </div>
              <p className="text-lg font-black text-slate-900">{creatorsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FileText className="h-3 w-3 text-primary" /> Applications
              </div>
              <p className="text-lg font-black text-slate-900">{appsCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50/50 border border-orange-100/50">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">
              Review Deadline: {new Date(campaign.endDate || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-8 pt-0 mt-auto border-t border-slate-50 bg-slate-50/30">
          <Link href={`/dashboard/brand/campaigns/${campaign.id}`} className="w-full pt-6">
            <Button variant="outline" className="w-full rounded-xl font-bold bg-white border-slate-200 group/btn h-11">
              Manage Workspace
              <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
        <Briefcase className="h-12 w-12 text-slate-200" />
      </div>
      <h3 className="text-2xl font-black text-slate-900">No {tab.toLowerCase()} campaigns</h3>
      <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
        {tab === 'ACTIVE'
          ? "You haven't launched any live campaigns yet. Create one to start reaching creators."
          : "Your campaign history is clean. Let's get something moving!"}
      </p>
      <Link href="/dashboard/campaigns/new" className="mt-10">
        <Button className="rounded-full px-10 h-14 text-lg font-black shadow-xl shadow-primary/20">
          Create Your First Brief
        </Button>
      </Link>
    </div>
  );
}