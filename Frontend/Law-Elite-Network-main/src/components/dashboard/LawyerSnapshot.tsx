"use client";

import React from 'react';
import { User, Star, Briefcase, MessageSquare, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

/**
 * @fileOverview LawyerSnapshot
 * SURFACES assigned counsel credentials and contact protocols.
 */
export default function LawyerSnapshot({ lawyer }: { lawyer?: any }) {
  if (!lawyer) {
    return (
      <Card className="border-slate-200 bg-slate-50/50 border-dashed p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <User className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discovery Phase</p>
        <p className="text-[9px] text-slate-400 mt-1 italic">Assign counsel to activate snapshot</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden group h-full">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src={lawyer.profileImage} />
                <AvatarFallback className="bg-[#0B1F3A] text-white text-xs font-bold italic">HS</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate leading-tight">{lawyer.name || 'Harvey Specter'}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Elite Practitioner</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Expertise</p>
              <p className="text-[10px] font-bold text-slate-700 truncate">Corporate</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Rating</p>
              <p className="text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1">
                <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" /> 5.0
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <Button asChild size="sm" variant="outline" className="w-full h-9 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
            <Link href="/chat">
              <MessageSquare className="w-3.5 h-3.5 mr-2" /> Message Counsel
            </Link>
          </Button>
          <Link href="/lawyers" className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-tighter block text-center transition-colors">
            View Full Dossier <ChevronRight className="w-2.5 h-2.5 inline" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
