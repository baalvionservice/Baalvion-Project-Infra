
"use client";

import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import LawyerProfileForm from '@/components/forms/LawyerProfileForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, Award, Briefcase, Star } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/authStore';

/**
 * @fileOverview Lawyer Chambers Profile Page.
 * Updated to use Persistent Layout Architecture.
 */
export default function LawyerProfilePage() {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['lawyer']}>
        <DashboardShell>
          <LawyerProfileContent />
        </DashboardShell>
      </RoleGuard>
    </ProtectedRoute>
  );
}

function LawyerProfileContent() {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 max-w-7xl animate-in fade-in duration-700">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Practitioner Portal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Manage Chambers</h1>
        <p className="text-slate-500 text-sm font-medium mt-2 italic">Refine your professional standing and visibility within the network.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 flex items-center gap-2">
                <Award className="w-4 h-4" /> Network Standing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase">Identity Verified</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Elite Tier Practitioner</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-slate-400">Discovery Rank:</span>
                  <span className="text-blue-600 flex items-center gap-1">TOP 1% <Star className="w-2.5 h-2.5 fill-blue-600" /></span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                  <span className="text-slate-400">Verification:</span>
                  <span className="text-emerald-600">Approved</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Activity Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-slate-900">0</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Engagements Handled</p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-8 border-b border-slate-50">
              <CardTitle className="text-2xl font-bold text-slate-900">Practitioner Dossier</CardTitle>
              <CardDescription className="italic font-medium">Update your professional credentials and consultation terms.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <LawyerProfileForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
