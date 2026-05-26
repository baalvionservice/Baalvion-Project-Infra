"use client"

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { 
  UserCheck, 
  Search, 
  Filter, 
  Download, 
  TrendingUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/use-leads";
import { LeadStats } from "@/components/leads/LeadStats";
import { LeadTable } from "@/components/leads/LeadTable";
import { LeadService } from "@/services/lead-service";

export default function AdminLeadManagement() {
  const { toast } = useToast();
  const { leads, setLeads, loading } = useLeads();
  const [searchQuery, setSearchQuery] = useState("");

  const handleStatusUpdate = async (id: string, updates: any) => {
    try {
      await LeadService.updateLead(id, updates);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: "Profile Synced", description: "Lead information has been updated globally." });
    } catch (error) {
      toast({ title: "Sync Failed", variant: "destructive" });
    }
  };

  const handleLeadDelete = async (id: string) => {
    try {
      await LeadService.deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      toast({ title: "Lead Removed", description: "Record has been archived." });
    } catch (error) {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            Lead Terminal & CRM
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Govern partnership inquiries and manage automated blueprint fulfillment.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-bold uppercase">
            <TrendingUp className="h-4 w-4" />
            {leads.length} Active Profiles
          </div>
        </div>
      </div>

      <LeadStats leads={leads} />

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search Lead or Company..." 
                className="pl-10 h-10 border-slate-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200"><Filter className="h-4 w-4" /> All Stages</Button>
          </div>
        </CardHeader>
        <LeadTable 
          leads={filteredLeads} 
          onUpdate={handleStatusUpdate} 
          onDelete={handleLeadDelete}
        />
      </Card>
    </div>
  );
}
