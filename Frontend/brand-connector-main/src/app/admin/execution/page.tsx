
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Zap,
  Building2,
  Calendar
} from 'lucide-react';
import { useCampaignStore } from '@/store/useCampaignStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CampaignExecutionDashboard() {
  const { campaigns, loading, fetchCampaigns } = useCampaignStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-100 text-blue-600">Active</Badge>;
      case 'in_review': return <Badge className="bg-orange-100 text-orange-600">In Review</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-600">Completed</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-500">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Execution Center
          </h1>
          <p className="text-slate-500 font-medium">Track live campaign progress and deliverable approvals.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search active projects..." 
            className="pl-10 h-11 rounded-xl bg-white border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="h-16 border-slate-100 hover:bg-transparent bg-slate-50/30">
                <TableHead className="pl-8 font-black text-[10px] uppercase">Project Name</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Execution</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-center">Timeline</TableHead>
                <TableHead className="pr-8 text-right font-black text-[10px] uppercase">Workspace</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary/30" /></TableCell></TableRow>
              ) : filtered.map((camp) => (
                <TableRow key={camp.id} className="h-24 border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none">{camp.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">{camp.companyName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(camp.status)}
                  </TableCell>
                  <TableCell className="text-center px-10">
                    <div className="space-y-2 min-w-[150px]">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-primary">{camp.progress}%</span>
                      </div>
                      <Progress value={camp.progress} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-900">{new Date(camp.endDate).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Deadline</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Link href={`/admin/execution/${camp.id}`}>
                      <Button variant="ghost" className="rounded-xl font-bold h-10 px-4 hover:bg-primary hover:text-white transition-all">
                        Control <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
