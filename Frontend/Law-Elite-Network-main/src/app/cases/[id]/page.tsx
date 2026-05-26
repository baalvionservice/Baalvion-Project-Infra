"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCaseById, deleteCase } from '@/services/cases/caseService';
import { 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  FileText,
  Clock,
  MessageSquare,
  AlertTriangle,
  Trash2,
  CheckSquare,
  BookOpen,
  IndianRupee,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from 'date-fns';
import EditCaseModal from '@/components/case/EditCaseModal';
import ChatWindow from '@/components/chat/ChatWindow';
import DocumentVault from '@/components/case/DocumentVault';
import AIInsights from '@/components/case/AIInsights';
import CasePredictions from '@/components/case/CasePredictions';
import CaseTimeline from '@/components/dashboard/CaseTimeline';
import TaskSystem from '@/components/case/TaskSystem';
import TimeTracker from '@/components/case/TimeTracker';
import PrivateNotes from '@/components/case/PrivateNotes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function CaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLawyer } = useAuth();
  const [legalCase, setLegalCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCaseById(id as string);
      setLegalCase(data);
    } catch (err) {
      // Systemic error handling
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteBrief = async () => {
    if (!window.confirm("Confirm termination of this legal brief?")) return;
    setIsDeleting(true);
    try {
      await deleteCase(legalCase.id || legalCase.caseId);
      toast({ title: "Brief Terminated", description: "The legal matter has been archived." });
      router.push("/cases");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        </div>
      </DashboardShell>
    );
  }

  if (!legalCase) {
    return (
      <DashboardShell>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-sm max-w-lg">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Matter Not Located</h2>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">Return to Ledger</Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="container mx-auto px-8 pt-8 pb-12 max-w-7xl animate-in fade-in duration-700">
          <header className="flex flex-col gap-6 mb-10">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Return to Ledger
              </button>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold uppercase tracking-widest py-1 px-3",
                  legalCase.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                )}>
                  {legalCase.priority || 'Standard'} Priority
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-bold">
                  {legalCase.status || 'Active'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                  {legalCase.title}
                </h1>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-600" /> Created {legalCase.createdAt ? formatDistanceToNow(new Date(legalCase.createdAt)) : 'Recently'} ago</span>
                  <span className="flex items-center gap-1.5 text-blue-600"><ShieldCheck className="w-3.5 h-3.5" /> Dossier: {legalCase.id.slice(-8)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <EditCaseModal caseData={legalCase} onSuccess={loadData} />
                {isLawyer && <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 h-11">
                  Draft Document <Plus className="ml-2 w-3.5 h-3.5" />
                </Button>}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-8 w-fit">
                  <TabsTrigger value="overview" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6 py-2 rounded-lg transition-all">Overview</TabsTrigger>
                  <TabsTrigger value="workflow" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6 py-2 rounded-lg transition-all">
                    <CheckSquare className="w-3 h-3 mr-2" /> Workflow
                  </TabsTrigger>
                  <TabsTrigger value="vault" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6 py-2 rounded-lg transition-all">
                    <FileText className="w-3 h-3 mr-2" /> Vault
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6 py-2 rounded-lg transition-all">
                    <MessageSquare className="w-3 h-3 mr-2" /> Comms
                  </TabsTrigger>
                  {isLawyer && (
                    <TabsTrigger value="research" className="text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 px-6 py-2 rounded-lg transition-all">
                      <BookOpen className="w-3 h-3 mr-2" /> Research
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Matter Narrative</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <p className="text-slate-600 leading-relaxed font-medium text-lg whitespace-pre-wrap italic">
                        "{legalCase.description || 'Initialization pending...'}"
                      </p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AIInsights caseData={legalCase} />
                    <CasePredictions caseData={legalCase} />
                  </div>
                </TabsContent>

                <TabsContent value="workflow" className="animate-in fade-in duration-500">
                  <TaskSystem caseId={legalCase.id} tasks={legalCase.tasks || []} onUpdate={loadData} />
                </TabsContent>

                <TabsContent value="vault" className="animate-in fade-in duration-500">
                  <DocumentVault caseId={id as string} userId={user?.id || ''} />
                </TabsContent>

                <TabsContent value="chat" className="animate-in fade-in duration-500">
                  <ChatWindow 
                    caseId={id as string} 
                    userId={user?.id || ''} 
                    receiverId={isLawyer ? legalCase.clientId : (legalCase.assignedLawyerId || 'system')} 
                  />
                </TabsContent>

                <TabsContent value="research" className="animate-in fade-in duration-500">
                  <PrivateNotes caseId={legalCase.id} notes={legalCase.notes || []} onUpdate={loadData} />
                </TabsContent>
              </Tabs>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              {isLawyer && (
                <TimeTracker caseId={legalCase.id} timeLogs={legalCase.timeLogs || []} onUpdate={loadData} />
              )}

              <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Strategic Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CaseTimeline currentStatus={legalCase.status} compact />
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Financial Standing</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Settlement Protocol</p>
                      <p className="text-sm font-bold text-slate-900">Fixed Fee Tier</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-600 flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" /> 5,000
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Funds Secured in Escrow</p>
                  </div>
                </CardContent>
              </Card>

              {!legalCase.isDeleted && (
                <Card className="border-red-100 bg-red-50/30 overflow-hidden">
                  <CardHeader className="pb-4 border-b border-red-100 bg-red-50/50">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Termination Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isDeleting}
                      onClick={handleDeleteBrief}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[9px] tracking-widest h-10 rounded-lg shadow-sm"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
                      Archive Matter
                    </Button>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}