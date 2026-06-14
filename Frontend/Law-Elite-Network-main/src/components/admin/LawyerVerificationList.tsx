
"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  User,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";

interface LawyerVerificationListProps {
  pendingLawyers: any[];
  onAction: () => void;
}

/**
 * @fileOverview LawyerVerificationList V6
 * Functionalized administrative interface for auditing practitioner credentials.
 */
export default function LawyerVerificationList({ pendingLawyers, onAction }: LawyerVerificationListProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminController: any = null; // not yet wired to AuthContext
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (targetUserId: string, action: 'approve' | 'reject') => {
    if (!adminController || !user) return;
    
    setProcessingId(targetUserId);
    try {
      const res = action === 'approve' 
        ? await adminController.approveLawyer({ userId: targetUserId, adminId: user.userId, isAdmin: true })
        : await adminController.rejectLawyer({ userId: targetUserId, reason: "Credentials verification failure.", adminId: user.userId, isAdmin: true });
      
      if (res.success) {
        toast({
          title: action === 'approve' ? "Practitioner Verified" : "Application Rejected",
          description: `Identity audit for Member ID ${targetUserId.slice(-6)} committed.`,
        });
        onAction();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Audit Error", description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingLawyers.length === 0) {
    return (
      <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
        <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Queue Clear</h3>
        <p className="text-sm text-slate-400 italic">No practitioners awaiting identity audit.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {pendingLawyers.map((l) => (
        <Card key={l.userId} className="bg-white border-slate-200 executive-card group overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">{l.fullName}</h4>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-[8px] font-bold uppercase tracking-widest py-0.5">
                      {l.specialization?.[0] || 'Legal'} Counsel
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Submitted {l.verificationSubmittedAt ? new Date(l.verificationSubmittedAt).toLocaleDateString() : 'Syncing...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 max-w-md">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Bar Credentials & ID</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-100">
                    Audit KYC <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleReview(l.userId, 'approve')}
                  disabled={processingId === l.userId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[9px] tracking-widest h-10 px-6 rounded-lg shadow-lg shadow-emerald-900/10"
                >
                  {processingId === l.userId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                  Approve Standing
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReview(l.userId, 'reject')}
                  disabled={processingId === l.userId}
                  className="border-red-100 text-red-600 hover:bg-red-50 font-bold uppercase text-[9px] tracking-widest h-10 px-6 rounded-lg"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
