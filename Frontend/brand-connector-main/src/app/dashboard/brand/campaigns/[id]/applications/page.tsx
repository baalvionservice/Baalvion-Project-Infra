
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Search,
  Filter,
  Zap,
  Download,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Trash2,
  Mail,
  ArrowUpRight,
  TrendingUp,
  IndianRupee,
  Eye
} from 'lucide-react';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { ApplicationStatus, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Mock Creator Data for Enrichment (In real app, this would be a join or fetched by ID)
const CREATOR_METADATA: Record<string, any> = {
  'creator_1': { name: 'Sarah Chen', handle: '@sarah_tech', followers: '850k', er: '5.8%', match: 98, avatar: 'https://picsum.photos/seed/sarah/100/100' },
  'creator_2': { name: 'Alex Rivers', handle: '@alex_creates', followers: '320k', er: '7.2%', match: 94, avatar: 'https://picsum.photos/seed/alex/100/100' },
  'creator_3': { name: 'Marcus Thorne', handle: '@m_fitness', followers: '1.2M', er: '4.1%', match: 91, avatar: 'https://picsum.photos/seed/marcus/100/100' },
  'creator_4': { name: 'Elena Vance', handle: '@elena_style', followers: '450k', er: '6.5%', match: 89, avatar: 'https://picsum.photos/seed/elena/100/100' },
};

export default function ApplicationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedPitchId, setExpandedPitchId] = useState<string | null>(null);

  // 1. Fetch Applications for this campaign
  const appsQuery = useMemo(() => {
    return query(
      collection(db!, 'applications'),
      where('campaignId', '==', params.id as string),
      orderBy('appliedAt', 'desc')
    );
  }, [db!, params.id]);

  const { data: applications, loading } = useCollection<any>(appsQuery);

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const meta = CREATOR_METADATA[app.creatorId] || { name: 'Unknown Creator' };
      return meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.pitch.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [applications, searchQuery]);

  const handleUpdateStatus = async (appId: string, creatorId: string, newStatus: ApplicationStatus) => {
    const appRef = doc(db!, 'applications', appId);

    // Update Application
    updateDoc(appRef, { status: newStatus }).catch(async (err) => {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/applications/${appId}`,
        operation: 'update',
        requestResourceData: { status: newStatus }
      }));
    });

    // Notify Creator
    const notificationData = {
      userId: creatorId,
      title: `Application ${newStatus.toLowerCase()}`,
      message: `Your application for campaign #${params.id} has been marked as ${newStatus.toLowerCase()}.`,
      type: 'CAMPAIGN',
      read: false,
      createdAt: new Date().toISOString(),
      link: `/dashboard/applications`
    };

    addDoc(collection(db!, 'notifications'), notificationData).catch(async (err) => {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: '/notifications',
        operation: 'create',
        requestResourceData: notificationData
      }));
    });

    toast({ title: `Decision: ${newStatus}`, description: "Creator has been notified." });
  };

  const handleBulkAction = async (newStatus: ApplicationStatus) => {
    if (selectedIds.length === 0) return;

    const batch = writeBatch(db!);
    selectedIds.forEach(id => {
      const app = applications.find(a => a.id === id);
      if (app) {
        batch.update(doc(db!, 'applications', id), { status: newStatus });

        // Add individual notifications in batch (Note: real app would use a cloud function)
        const nRef = doc(collection(db!, 'notifications'));
        batch.set(nRef, {
          userId: app.creatorId,
          title: `Bulk Update: ${newStatus}`,
          message: `Update on your application for campaign #${params.id}.`,
          type: 'CAMPAIGN',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    try {
      await batch.commit();
      toast({ title: `Bulk ${newStatus.toLowerCase()} success`, description: `${selectedIds.length} applicants updated.` });
      setSelectedIds([]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Bulk action failed' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredApps.length ? [] : filteredApps.map(a => a.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Applicants</h1>
            <p className="text-slate-500 font-medium">Evaluate pitches and hire creators for campaign #{params.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase h-11 px-4 rounded-xl flex items-center gap-2">
            <Users className="h-4 w-4" /> {applications.length} Total Applicants
          </Badge>
          <Button variant="outline" className="rounded-xl font-bold bg-white h-11 border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Export List
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or pitch content..."
              className="pl-10 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <span className="text-xs font-black text-primary uppercase mr-2">{selectedIds.length} Selected</span>
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold"
                  onClick={() => handleBulkAction(ApplicationStatus.ACCEPTED)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="rounded-lg font-bold"
                  onClick={() => handleBulkAction(ApplicationStatus.REJECTED)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 h-16">
                <TableHead className="w-12 pl-8">
                  <Checkbox
                    checked={selectedIds.length === filteredApps.length && filteredApps.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Creator</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Reach/ER</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Proposed Rate</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">AI Match</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredApps.length > 0 ? (
                  filteredApps.map((app, idx) => {
                    const meta = CREATOR_METADATA[app.creatorId] || { name: 'New Creator', handle: '@user', followers: '---', er: '---', match: 50, avatar: '' };
                    const isExpanded = expandedPitchId === app.id;

                    return (
                      <React.Fragment key={app.id}>
                        <TableRow className={cn(
                          "border-slate-50 group hover:bg-slate-50/50 transition-colors h-24",
                          isExpanded && "bg-slate-50/80"
                        )}>
                          <TableCell className="pl-8">
                            <Checkbox
                              checked={selectedIds.includes(app.id)}
                              onCheckedChange={() => toggleSelect(app.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 rounded-xl border border-white shadow-sm ring-2 ring-slate-50">
                                <AvatarImage src={meta.avatar} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{meta.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-black text-slate-900 leading-none">{meta.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{meta.handle}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-900">{meta.followers}</span>
                              <span className="text-[10px] font-bold text-emerald-600">{meta.er} ER</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-lg font-black text-slate-900">₹{app.proposedBudget?.toLocaleString() || '---'}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1 mb-1">
                                <Zap className="h-3 w-3 text-primary fill-primary" />
                                <span className="text-sm font-black text-primary">{meta.match}%</span>
                              </div>
                              <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${meta.match}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase border-none",
                              app.status === 'PENDING' ? "bg-orange-100 text-orange-600" :
                                app.status === 'ACCEPTED' ? "bg-emerald-100 text-emerald-600" :
                                  app.status === 'REJECTED' ? "bg-red-100 text-red-600" :
                                    "bg-blue-100 text-blue-600"
                            )}>
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 rounded-lg font-bold text-xs"
                                onClick={() => setExpandedPitchId(isExpanded ? null : app.id)}
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                                Pitch
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-400">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-none shadow-2xl">
                                  <DropdownMenuItem
                                    className="rounded-lg font-bold text-emerald-600"
                                    onClick={() => handleUpdateStatus(app.id, app.creatorId, ApplicationStatus.ACCEPTED)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Hire Creator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="rounded-lg font-bold text-red-600"
                                    onClick={() => handleUpdateStatus(app.id, app.creatorId, ApplicationStatus.REJECTED)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" /> Decline Application
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="rounded-lg font-bold">
                                    <MessageSquare className="h-4 w-4 mr-2" /> Start Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="rounded-lg font-bold"
                                    onClick={() => handleUpdateStatus(app.id, app.creatorId, ApplicationStatus.REVIEWING)}
                                  >
                                    <Star className="h-4 w-4 mr-2 text-orange-500" /> Shortlist
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Pitch Row */}
                        <AnimatePresence>
                          {isExpanded && (
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                              <TableCell colSpan={7} className="p-0 border-none">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-10 pl-24 space-y-6">
                                    <div className="max-w-3xl space-y-4">
                                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" /> Creator Pitch Vision
                                      </h4>
                                      <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                        "{app.pitch}"
                                      </p>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="p-4 rounded-2xl bg-white border shadow-sm space-y-1 min-w-[160px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Availability</p>
                                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                          <Clock className="h-3.5 w-3.5 text-primary" /> Within 10 Days
                                        </p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-white border shadow-sm space-y-1 min-w-[160px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Content Strategy</p>
                                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                          <Zap className="h-3.5 w-3.5 text-orange-500" /> High-Energy Reels
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching applications</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trust & Mediation Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Secure Escrow Hiring</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Accepting an application triggers the escrow hold. Funds are only released to the creator after you approve the final content.
            </p>
          </div>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 flex items-start gap-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">AI Decision Support</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              The AI Match Score considers creator historical performance, niche relevance, and target audience overlap for this specific campaign.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
