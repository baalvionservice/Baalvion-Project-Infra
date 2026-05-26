
"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAllOpenCases, assignLawyerToCase } from "@/services/cases/caseService";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  Inbox, 
  Briefcase, 
  Loader2, 
  Search, 
  CheckCircle2, 
  XCircle,
  FileText,
  Clock,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

/**
 * @fileOverview LawyerCaseRequestsPage
 * High-fidelity module for auditing and accepting incoming legal briefs.
 */
export default function LawyerCaseRequestsPage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <CaseRequestsContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function CaseRequestsContent() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllOpenCases();
      setRequests(data);
    } catch (err) {
      console.error("Discovery ledger sync failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAcceptCase = async (caseId: string) => {
    if (!user) return;
    setProcessingId(caseId);
    try {
      await assignLawyerToCase(caseId, user.id);
      toast({
        title: "Brief Accepted",
        description: "The legal matter has been successfully assigned to your chambers.",
      });
      loadRequests();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Unable to commit brief assignment.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <Inbox className="w-3 h-3" />
              Incoming Opportunities
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Case Discovery</h1>
          <p className="text-slate-500 text-sm font-medium italic">Audit and engage with high-intent legal briefs across the global network.</p>
        </div>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Discovery Ledger...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <Search className="w-16 h-16 text-slate-100 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-2 text-slate-900">No New Briefs Identified</h3>
          <p className="text-slate-500 max-w-xs mx-auto italic text-sm font-medium">
            Platform intelligence could not locate any active "open" briefs matching your professional scope at this moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="bg-white border-slate-200 executive-card group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-widest py-1 px-3">
                          {req.category || 'General'} Law
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest py-1 px-3 ${
                          req.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {req.priority || 'Standard'} Priority
                        </Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Posted {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{req.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed italic line-clamp-2">
                        {req.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <FileText className="w-3.5 h-3.5 text-blue-600" /> {req.documents?.length || 0} Record(s) Linked
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Member ID: {req.clientId.slice(-6)}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-64 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                    <Button 
                      onClick={() => handleAcceptCase(req.id)}
                      disabled={processingId === req.id}
                      className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest shadow-lg"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Commit to Brief
                    </Button>
                    <Button variant="outline" className="border-slate-200 hover:bg-slate-50 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest" asChild>
                      <Link href={`/cases/${req.id}`}>
                        Audit Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                    <Button variant="ghost" className="text-slate-400 hover:text-blue-600 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest">
                      <MessageSquare className="w-3.5 h-3.5 mr-2" /> Request Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
