
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileSearch, 
  Download, 
  Trash2, 
  History,
  Lock,
  Eye,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview ComplianceCenter
 * GDPR and data management module for system authority.
 */
export default function ComplianceCenter() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
            <ShieldCheck className="w-6 h-6 text-slate-900" /> Compliance & Legal Control
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Regulatory data oversight and member privacy management.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Data Access Audit */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4" /> Personnel Data Audit
            </CardTitle>
            <CardDescription className="text-[10px] italic">Ledger of all internal staff access to sensitive member records.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Case Dossier Audit</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Admin: SEC_992 • 2h ago</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-bold uppercase">Internal View</Badge>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 p-0">View Full Access Ledger</Button>
            </div>
          </CardContent>
        </Card>

        {/* Regulatory Actions */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Privacy Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Member Data Export</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Generate GDPR JSON bundle</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest border-slate-200 bg-white">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Execute
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-red-50 bg-red-50/20">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-red-900">Right to be Forgotten</p>
                  <p className="text-[9px] text-red-400 font-bold uppercase">Permanently redact member dossier</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest border-red-100 text-red-600 hover:bg-red-50 bg-white">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Redact
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/30 transition-all" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em]">Compliance Standing</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Platform is currently 100% compliant with standard regional data statutes. All intelligence signals are E2E encrypted.
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-[8px] font-bold uppercase tracking-widest text-blue-400">Certification Valid: OCT 2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
