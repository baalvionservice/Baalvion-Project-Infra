'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ChevronRight, 
  RefreshCcw,
  LayoutDashboard,
  Clock,
  User,
  Activity,
  AlertTriangle,
  History,
  Lock,
  ArrowDownToLine,
  X,
  Scale,
  Award,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { downloadMockAuditReport } from '@/lib/audit/engine';

/**
 * Compliance Hub: The Governance Tactical Node.
 * Manages institutional policy, regulatory reports, and access governance.
 */
export default function ComplianceAdminHub() {
  const { scopedAuditLogs, currentUser, countryConfigs } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredLogs = scopedAuditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.entity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleExport = () => {
    downloadMockAuditReport(filteredLogs);
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
             <Scale className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Tactical Layer 4</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase">Compliance Hub</h1>
          <p className="text-sm text-white/40 font-light italic">Institutional policy governance and regulatory reporting matrix.</p>
        </div>
        <div className="flex items-center space-x-6">
            <Button 
              className="bg-white text-black hover:bg-blue-600 hover:text-white h-12 px-8 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all shadow-2xl"
              onClick={handleExport}
            >
              <ArrowDownToLine className="w-3.5 h-3.5 mr-2" /> GENERATE REGULATORY REPORT
            </Button>
        </div>
      </header>

      {/* Primary Governance Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GovernanceCard 
                title="GDPR / PII Protocol" 
                desc="Automated encryption of personal data in regional hubs." 
                status="Active" 
                icon={<Lock className="w-5 h-5" />} 
              />
              <GovernanceCard 
                title="Maison Tax Matrix" 
                desc="Jurisdictional logic audit for all 5 market nodes." 
                status="Verified" 
                icon={<Scale className="w-5 h-5" />} 
              />
           </div>

           <Card className="bg-[#111113] border-white/5 rounded-none shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 p-8 flex flex-row justify-between items-center">
                 <div>
                    <CardTitle className="font-headline text-2xl text-white uppercase tracking-tight">Access Governance Registry</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Historical verification of administrative credentials</CardDescription>
                 </div>
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-400" />
                    <input 
                      className="bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none w-64 text-white focus:border-blue-500 transition-all" 
                      placeholder="FILTER COMPLIANCE..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
              </CardHeader>
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Market Node</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Credential Status</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Policy Alignment</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Last Audit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryConfigs.map(c => (
                    <TableRow key={c.code} className="hover:bg-white/5 transition-colors border-white/5 h-16">
                      <TableCell className="pl-8 font-bold text-xs uppercase text-white/80">{c.name} Hub</TableCell>
                      <TableCell>
                         <div className="flex items-center space-x-2 text-emerald-400">
                            <ShieldCheck size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Level 3 Secure</span>
                         </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[7px] border-white/10 text-white/40 uppercase">Standard III</Badge></TableCell>
                      <TableCell className="text-right pr-8 text-[9px] font-mono text-white/20">24 Hours Ago</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
           <Card className="bg-black text-white p-10 space-y-10 shadow-2xl relative overflow-hidden rounded-none border-none">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><Award className="w-40 h-40 text-blue-500" /></div>
              <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none uppercase">The 1924 Charter</h3>
              <p className="text-sm font-light italic text-white/60 leading-relaxed">
                "Our founding principles require absolute transparency in the registry. Compliance is not a metric; it is an architectural constant."
              </p>
              <div className="pt-6 border-t border-white/10">
                 <Button variant="outline" className="w-full rounded-none border-blue-900/40 text-blue-400 hover:bg-blue-500 hover:text-white text-[9px] font-bold uppercase tracking-widest h-14 transition-all">
                    DOWNLOAD INSTITUTIONAL CHARTER
                 </Button>
              </div>
           </Card>

           <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none">
              <div className="flex items-center space-x-3 text-gold">
                 <History className="w-4 h-4" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest">Retention Policy</h4>
              </div>
              <p className="text-[10px] text-white/40 italic leading-relaxed">
                "Compliance logs are retained for 365 days in an append-only archive. High-risk overrides are stored indefinitely in the deep archival node."
              </p>
           </Card>
        </aside>
      </div>
    </div>
  );
}

function GovernanceCard({ title, desc, status, icon }: { title: string, desc: string, status: string, icon: any }) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-6 hover:border-blue-500/40 transition-all rounded-none group shadow-xl">
       <div className="flex justify-between items-start">
          <div className="p-3 bg-white/5 text-white/40 rounded-none border border-white/10 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
             {icon}
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[7px] uppercase px-3">{status}</Badge>
       </div>
       <div className="space-y-2">
          <h4 className="text-lg font-headline font-bold italic text-white uppercase tracking-tight">{title}</h4>
          <p className="text-xs text-white/40 font-light italic leading-relaxed">{desc}</p>
       </div>
    </Card>
  );
}
