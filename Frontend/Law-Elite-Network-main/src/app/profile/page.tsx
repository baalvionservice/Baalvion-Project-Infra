"use client";

import React from 'react';
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import ProfileForm from "@/components/forms/ProfileForm";
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Mail, MapPin, Loader2, Calendar } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * @fileOverview Member Profile Portal.
 * Cleaned up loading state by removing text labels.
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <ProfileContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user } = useAuthStore();
  const { userProfile, loading, refreshProfile } = useUserProfile(user?.id);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 max-w-6xl animate-in fade-in duration-700">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 bg-slate-100 shadow-inner">
              <Avatar className="w-full h-full border-4 border-white shadow-sm">
                <AvatarImage src={userProfile.profileImage} />
                <AvatarFallback className="bg-[#0B1F3A] text-white text-3xl font-bold italic">
                  {userProfile.name?.charAt(0) || userProfile.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-white shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-bold text-slate-900">{userProfile.name || "Elite Member"}</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-[0.2em]">Verified</span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-600" /> {userProfile.email}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-600" /> Global Jurisdiction</div>
            </div>
            
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 italic flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> {userProfile.role?.toUpperCase()} STANDING • MEMBER SINCE {new Date(userProfile.createdAt || Date.now()).getFullYear()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <aside className="md:col-span-1 space-y-6">
            <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Account Integrity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-600">Operational</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                  <span className="text-slate-400">Encryption:</span>
                  <span className="text-blue-600">E2E Active</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter pt-2 border-t border-slate-100">
                  <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last Sync:</span>
                  <span className="text-slate-900">{new Date(userProfile.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="md:col-span-2">
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-8 border-b border-slate-50">
                <CardTitle className="text-2xl font-bold text-slate-900">Credential Management</CardTitle>
                <CardDescription className="italic font-medium">Update your professional dossier and network visibility settings.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <ProfileForm onUpdate={refreshProfile} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}