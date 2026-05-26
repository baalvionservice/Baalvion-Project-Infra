
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MoreHorizontal,
  ArrowRight,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ApplicationStatus } from '@/types';
import { cn } from '@/lib/utils';

// Mock Campaign Data for display (since applications only store IDs)
const CAMPAIGN_METADATA: Record<string, any> = {
  '1': { title: 'AI Smart Home Ecosystem Review', brand: 'Lumina Tech', logo: 'https://picsum.photos/seed/lumina/100/100' },
  '2': { title: 'Sustainable Summer Collection', brand: 'EcoVibe', logo: 'https://picsum.photos/seed/eco/100/100' },
  '3': { title: 'Morning Vitality Challenge', brand: 'FitFlow', logo: 'https://picsum.photos/seed/fit/100/100' },
};

export default function MyApplicationsPage() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch applications for current creator
  const appsQuery = useMemo(() => {
    if (!currentUser?.id || !db) return null;
    return query(
      collection(db, 'applications'),
      where('creatorId', '==', currentUser.id),
      orderBy('appliedAt', 'desc')
    );
  }, [db, currentUser?.id]);

  const { data: applications, loading } = useCollection<any>(appsQuery);

  const filteredApps = useMemo(() => {
    if (!applications) return [];
    return applications.filter(app => {
      const metadata = CAMPAIGN_METADATA[app.campaignId] || { title: 'Unknown Campaign', brand: 'Unknown' };
      const matchesSearch = metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'ALL' || app.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [applications, searchQuery, activeTab]);

  const handleWithdraw = async (appId: string) => {
    try {
      await deleteDoc(doc(db!, 'applications', appId));
      toast({
        title: "Application Withdrawn",
        description: "Your pitch has been removed from the brand's list.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to withdraw application. Please try again.",
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return { label: 'Pending', color: 'bg-orange-100 text-orange-600', icon: Clock };
      case ApplicationStatus.REVIEWING:
        return { label: 'In Review', color: 'bg-blue-100 text-blue-600', icon: Eye };
      case ApplicationStatus.ACCEPTED:
        return { label: 'Accepted', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      case ApplicationStatus.REJECTED:
        return { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: XCircle };
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-slate-100 text-slate-600', icon: Check };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-600', icon: Briefcase };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-slate-500 mt-1">Track the status of your pitches and manage active collaborations.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaigns..."
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="ALL" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border min-w-max">
            <TabsTrigger value="ALL" className="rounded-xl px-6 font-bold">All ({applications?.length || 0})</TabsTrigger>
            <TabsTrigger value="PENDING" className="rounded-xl px-6 font-bold">Pending</TabsTrigger>
            <TabsTrigger value="ACCEPTED" className="rounded-xl px-6 font-bold">Accepted</TabsTrigger>
            <TabsTrigger value="REJECTED" className="rounded-xl px-6 font-bold">Rejected</TabsTrigger>
            <TabsTrigger value="COMPLETED" className="rounded-xl px-6 font-bold">Completed</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing applications...</p>
            </div>
          ) : filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredApps.map((app, idx) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    index={idx}
                    onWithdraw={handleWithdraw}
                    statusConfig={getStatusConfig(app.status)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState tab={activeTab} hasSearch={!!searchQuery} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationCard({ app, index, onWithdraw, statusConfig }: {
  app: any,
  index: number,
  onWithdraw: (id: string) => void,
  statusConfig: any
}) {
  const metadata = CAMPAIGN_METADATA[app.campaignId] || {
    title: 'Campaign ID: ' + app.campaignId,
    brand: 'Baalvion Brand',
    logo: `https://picsum.photos/seed/${app.campaignId}/100/100`
  };

  const formattedDate = new Date(app.appliedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow group">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Main Info */}
            <div className="flex-1 p-6 flex items-start gap-6 border-b lg:border-b-0 lg:border-r border-slate-50">
              <Avatar className="h-16 w-16 rounded-2xl border-2 border-slate-50 shadow-sm shrink-0">
                <AvatarImage src={metadata.logo} />
                <AvatarFallback className="bg-primary/5 text-primary font-bold">B</AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] truncate">
                    {metadata.brand}
                  </p>
                  <Badge className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase border-none h-5", statusConfig.color)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight truncate">
                  {metadata.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Applied on {formattedDate}
                  </span>
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                    <IndianRupee className="h-3.5 w-3.5" /> Proposed ₹{app.proposedBudget?.toLocaleString() || '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Progress Timeline */}
            <div className="flex-[0.8] p-6 bg-slate-50/30 flex flex-col justify-center">
              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-1000"
                  style={{ width: app.status === 'PENDING' ? '25%' : app.status === 'REVIEWING' ? '75%' : '100%' }}
                />

                <div className="relative flex justify-between">
                  {[
                    { label: 'Applied', active: true },
                    { label: 'Reviewing', active: ['REVIEWING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(app.status) },
                    { label: 'Decision', active: ['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(app.status) }
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors",
                        step.active ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-300"
                      )}>
                        {step.active ? <Check className="h-3 w-3" /> : <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />}
                      </div>
                      <span className={cn("text-[9px] font-black uppercase tracking-tighter", step.active ? "text-primary" : "text-slate-400")}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 flex items-center justify-between lg:flex-col lg:justify-center gap-3 bg-white border-t lg:border-t-0 lg:border-l border-slate-50 min-w-[180px]">
              <Link href={`/campaigns/${app.campaignId}`} className="w-full">
                <Button variant="outline" className="w-full rounded-xl font-bold h-11 text-xs">
                  <Eye className="h-4 w-4 mr-2" /> View Pitch
                </Button>
              </Link>

              <div className="flex items-center gap-2 w-full lg:w-auto">
                {app.status === 'PENDING' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="rounded-xl font-bold h-11 text-red-500 hover:text-red-600 hover:bg-red-50 px-4">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem] p-8">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black">Withdraw Application?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600 mt-2">
                          Are you sure you want to withdraw your pitch for <strong>{metadata.title}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="rounded-xl font-bold">Keep Application</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onWithdraw(app.id)}
                          className="rounded-xl font-bold bg-red-600 hover:bg-red-700"
                        >
                          Withdraw Pitch
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="secondary" className="rounded-xl font-bold h-11 w-full lg:w-auto px-6 text-xs">
                  Message <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ tab, hasSearch }: { tab: string, hasSearch: boolean }) {
  const isAll = tab === 'ALL';
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
      <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
        {hasSearch ? (
          <Search className="h-12 w-12 text-slate-200" />
        ) : (
          <Briefcase className="h-12 w-12 text-slate-200" />
        )}
      </div>
      <h3 className="text-2xl font-black text-slate-900">
        {hasSearch ? "No matching applications" : isAll ? "You haven't applied yet" : `No ${tab.toLowerCase()} applications`}
      </h3>
      <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
        {hasSearch
          ? "Try clearing your search or filters to see all applications."
          : "Discover high-paying campaigns tailored to your reach in the discovery feed."}
      </p>
      <Link href="/dashboard/creator/campaigns" className="mt-10">
        <Button className="rounded-full px-10 h-14 text-lg font-black shadow-xl shadow-primary/20 group">
          Discover Campaigns
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}
