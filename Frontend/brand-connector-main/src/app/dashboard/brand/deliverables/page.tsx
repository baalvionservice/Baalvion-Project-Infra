
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Eye,
  MessageSquare,
  Zap,
  Loader2,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { DeliverableStatus } from '@/types';
import { cn } from '@/lib/utils';

// Mock Metadata for campaigns and creators
const MOCK_METADATA: Record<string, any> = {
  'creator_1': { name: 'Sarah Chen', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  'creator_2': { name: 'Alex Rivers', avatar: 'https://picsum.photos/seed/alex/100/100' },
  'camp_1': { title: 'AI Smart Home Review', brand: 'Lumina Tech' },
};

export default function BrandDeliverablesPage() {
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all deliverables for campaigns owned by this brand
  // Note: In a real app, you'd filter by campaignIds owned by the brandId
  const { data: deliverables, loading } = useCollection<any>(
    db ? query(collection(db, 'deliverables'), orderBy('submittedAt', 'desc')) : null
  );

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'ALL' || d.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [deliverables, searchQuery, activeTab]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return { label: 'Review Needed', color: 'bg-blue-100 text-blue-600', icon: Clock };
      case 'APPROVED': return { label: 'Approved', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2 };
      case 'REVISION_REQUESTED': return { label: 'Revision Sent', color: 'bg-orange-100 text-orange-600', icon: MessageSquare };
      case 'REJECTED': return { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: AlertCircle };
      default: return { label: status, color: 'bg-slate-100 text-slate-600', icon: FileText };
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deliverable Inbox</h1>
          <p className="text-slate-500 font-medium">Review and approve content submitted by your creative partners.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by title..." 
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="SUBMITTED" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-slate-100/50 p-1 rounded-2xl border min-w-max">
            <TabsTrigger value="ALL" className="rounded-xl px-8 font-bold">All</TabsTrigger>
            <TabsTrigger value="SUBMITTED" className="rounded-xl px-8 font-bold flex items-center gap-2">
              Needs Review
              {deliverables.filter(d => d.status === 'SUBMITTED').length > 0 && (
                <Badge className="bg-primary text-white border-none h-5 px-1.5 min-w-[20px] flex items-center justify-center">
                  {deliverables.filter(d => d.status === 'SUBMITTED').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="REVISION_REQUESTED" className="rounded-xl px-8 font-bold">In Revision</TabsTrigger>
            <TabsTrigger value="APPROVED" className="rounded-xl px-8 font-bold">Approved</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing deliverables...</p>
            </div>
          ) : filteredDeliverables.length > 0 ? (
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 h-16">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Deliverable</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Creator</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Campaign</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Submitted</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredDeliverables.map((del, idx) => {
                        const creator = MOCK_METADATA[del.creatorId] || { name: 'Unknown Creator', avatar: '' };
                        const camp = MOCK_METADATA[del.campaignId] || { title: 'Unknown Campaign' };
                        const status = getStatusConfig(del.status);

                        return (
                          <motion.tr
                            key={del.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group border-slate-50 hover:bg-slate-50/50 transition-colors h-24"
                          >
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <p className="font-black text-slate-900 truncate max-w-[200px]">{del.title}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 rounded-lg border border-white shadow-sm">
                                  <AvatarImage src={creator.avatar} />
                                  <AvatarFallback>C</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-bold text-slate-600">{creator.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{camp.title}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">
                                  {new Date(del.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {new Date(del.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border-none", status.color)}>
                                <status.icon className="h-3 w-3 mr-1.5" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <Link href={`/dashboard/brand/deliverables/${del.id}`}>
                                <Button size="sm" variant="ghost" className="rounded-xl font-bold h-10 px-4 group-hover:bg-primary group-hover:text-white transition-all">
                                  Review Work <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center">
              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">No deliverables to review</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
                When creators submit their work for your active campaigns, they will appear here for your approval.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
