
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, ShieldCheck, MoreVertical, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @fileOverview UserList V2
 * Functional administrative directory for all registered platform members.
 */
export default function UserList({ users }: { users: any[] }) {
  if (!users || users.length === 0) {
    return (
      <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30 animate-in fade-in duration-700">
        <User className="w-16 h-16 text-slate-200 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-slate-900">Member Registry Empty</h3>
        <p className="text-sm text-slate-400 italic max-w-xs mx-auto mt-2">
          No authorized platform members have been identified in the current ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global Population: {users.length}</h3>
      </div>
      
      {users.map((u) => (
        <Card key={u.userId || u.id} className="bg-white border-slate-200 executive-card group overflow-hidden shadow-sm hover:border-blue-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline text-lg italic text-slate-900">{u.name || u.fullName || "Anonymous Member"}</h4>
                    {u.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-blue-600" /> {u.email}</span>
                    <span className="text-slate-200">|</span>
                    <span>ID: {(u.userId || u.id).slice(-8)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Standing</p>
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-widest font-bold border-none ${
                    u.roleId === 'admin' ? 'bg-purple-50 text-purple-700' :
                    u.roleId === 'lawyer' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {u.roleId || 'member'}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
                  <Badge className={`text-[9px] uppercase font-bold border-none shadow-none ${
                    u.profileStatus === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {u.profileStatus || 'pending'}
                  </Badge>
                </div>

                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
