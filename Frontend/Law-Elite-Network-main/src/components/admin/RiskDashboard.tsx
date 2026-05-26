
"use client";

import React, { useEffect, useState } from "react";
import { analyzeUsersRisk, AnalyzedUser } from "@/services/fraudService";
import { getAllUsers } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  UserX, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  Zap,
  Loader2,
  Target,
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview RiskDashboard V3
 * Functionalized behavioral intelligence perimeter for proactive fraud detection.
 */
export default function RiskDashboard() {
  const [analyzedUsers, setAnalyzedUsers] = useState<AnalyzedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const performAudit = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const results = await analyzeUsersRisk(users);
      setAnalyzedUsers(results);
      if (results.length > 0) {
        toast({ title: "Audit Synchronized", description: "Global network risk perimeter updated." });
      }
    } catch (err) {
      console.error("Risk scan failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performAudit();
  }, []);

  const highRiskCount = analyzedUsers.filter(u => u.riskLevel === 'High').length;

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Risk Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
            <ShieldAlert className="w-6 h-6 text-red-600" /> Risk Perimeter Dashboard
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Real-time behavioral intelligence and identity integrity auditing.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all ${
            highRiskCount > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-bold uppercase">{highRiskCount} Critical Anomalies</span>
          </div>
          <Button onClick={performAudit} className="bg-[#0B1F3A] hover:bg-slate-800 text-white h-10 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest">
            <RefreshCw className="w-4 h-4 mr-2" /> Re-Initialize Scan
          </Button>
        </div>
      </header>

      {analyzedUsers.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
          <Target className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h4 className="text-xl font-bold text-slate-900">Perimeter Clear</h4>
          <p className="text-sm text-slate-400 italic max-w-xs mx-auto mt-2">No behavioral signals identified for audit. Population scan required.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Risk Signal Intelligence */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Member Behavioral Scores</h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Detection Sensitivity: 75%</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {analyzedUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className={`bg-white border-slate-200 shadow-sm transition-all duration-500 hover:border-blue-400 ${
                    user.riskLevel === 'High' ? 'border-red-200 bg-red-50/10' : ''
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                          user.riskLevel === 'High' ? 'bg-red-600 text-white animate-pulse' : 
                          user.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Zap className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {user.name || "Member Dossier"}
                          </h4>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-10 flex-1 md:justify-center px-4">
                        <div className="w-full max-w-[140px] space-y-1.5">
                          <div className="flex justify-between text-[8px] font-bold uppercase text-slate-400">
                            <span>Threat Intensity</span>
                            <span>{user.riskScore}%</span>
                          </div>
                          <Progress 
                            value={user.riskScore} 
                            className={`h-1.5 bg-slate-100 [&>div]:bg-red-500`} 
                          />
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protocol</p>
                          <Badge className={`text-[8px] uppercase font-bold border-none shadow-none px-3 ${
                            user.riskLevel === 'High' ? 'bg-red-600 text-white' : 
                            user.riskLevel === 'Medium' ? 'bg-amber-500 text-white' : 
                            'bg-emerald-500 text-white'
                          }`}>
                            {user.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 border-slate-200 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Audit Dossier
                        </Button>
                        {user.riskLevel === 'High' && (
                          <Button variant="destructive" size="sm" className="h-9 px-4 text-[9px] font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700">
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Intelligence Context */}
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm overflow-hidden sticky top-24">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" /> Behavioral Audit Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <RiskFactor label="Transaction Velocity" intensity="High" color="text-red-600" desc="Spike in high-value settlements detected." />
                  <RiskFactor label="Multi-Login Conflict" intensity="Low" color="text-emerald-600" desc="Unique hardware fingerprint confirmed." />
                  <RiskFactor label="Specialization Mismatch" intensity="Medium" color="text-amber-600" desc="Briefing categories out of profile scope." />
                  <RiskFactor label="Response Latency" intensity="Stable" color="text-blue-600" desc="Natural engagement patterns observed." />
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" /> AI Perimeter Standing
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed italic font-medium">
                      "System authority is monitoring 100% of global network nodes. Behavioral fraud detection is operating with 96% accuracy."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-red-600/30 transition-all duration-700" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">Manual Lockdown</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  Administrative overrides allow for immediate termination of all active sessions across the high-risk perimeter.
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[9px] tracking-[0.2em] h-10 rounded-xl">
                  Execute Global Lockdown
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RiskFactor({ label, intensity, color, desc }: any) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{label}</span>
        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 ${color}`}>{intensity}</span>
      </div>
      <p className="text-[9px] text-slate-400 font-medium italic group-hover:text-slate-600 transition-colors">{desc}</p>
    </div>
  );
}
