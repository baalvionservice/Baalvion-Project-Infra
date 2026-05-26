
'use client';

import React, { useEffect } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopOpportunities() {
  const { topLeads, fetchTopLeads, selectLead } = useLeadStore();

  useEffect(() => {
    fetchTopLeads(5);
  }, []);

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-primary/20" />
            Top Opportunities
          </CardTitle>
          <p className="text-[10px] text-slate-400 font-bold uppercase">AI Ranked Prospects</p>
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {topLeads.map((lead, idx) => (
            <div key={lead.id} className="p-5 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center font-black text-primary text-xs border border-primary/10">
                  {lead.score}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{lead.companyName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{lead.niche}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-primary"
                onClick={() => selectLead(lead.id)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
