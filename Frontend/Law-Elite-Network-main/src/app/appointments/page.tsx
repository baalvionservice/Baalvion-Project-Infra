"use client";

import React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/store/authStore';
import { useAppointments } from '@/hooks/useAppointments';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  CalendarClock, 
  Loader2, 
  Search,
  Gavel,
  Briefcase,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

/**
 * @fileOverview AppointmentsPage
 * Cleaned up loading state by removing text labels.
 */
export default function AppointmentsPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <AppointmentsContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function AppointmentsContent() {
  const { user } = useAuthStore();
  const { appointments, loading, cancel } = useAppointments(user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-2">
              <CalendarClock className="w-3 h-3" />
              Executive Agenda
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">
            Consultation Dossiers
          </h1>
          <p className="text-slate-500 text-sm font-medium italic">
            Audit and manage your secure professional engagements within the network.
          </p>
        </div>
        <Link href="/lawyers">
          <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl px-6 font-bold shadow-lg">
            <Search className="w-4 h-4 mr-2" /> Find Counsel
          </Button>
        </Link>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="bg-white border-slate-200 executive-card group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Gavel className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Counsel: {apt.lawyerName || 'Verified Practitioner'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Briefcase className="w-3 h-3 text-blue-600" /> {apt.caseTitle || 'General Legal Brief'}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> {apt.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                    <Badge 
                      variant="outline"
                      className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(apt.status)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${apt.status === 'confirmed' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                      {apt.status} Engagement
                    </Badge>

                    {(apt.status === 'pending' || apt.status === 'confirmed') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Confirm termination of this consultation engagement?")) {
                            cancel(apt.id || apt.appointmentId || '');
                          }
                        }}
                        className="text-red-600 hover:bg-red-50 text-[9px] font-bold uppercase tracking-widest border border-red-100 h-9 rounded-xl px-4"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Terminate
                      </Button>
                    )}
                    
                    <Link href={`/booking-details/${apt.id}`}>
                      <Button variant="outline" className="border-slate-200 hover:bg-slate-50 text-[9px] font-bold uppercase tracking-widest h-9 rounded-xl px-4">
                        Secure Dossier <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <CalendarClock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-2 text-slate-900">No Scheduled Engagements</h3>
          <p className="text-slate-500 max-w-xs mx-auto italic text-sm mb-8 font-medium">
            Platform intelligence could not locate any active consultation dossiers in your agenda.
          </p>
          <Link href="/lawyers">
            <Button className="bg-[#0B1F3A] text-white rounded-xl px-10 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg">
              Explore the Discovery Marketplace
            </Button>
          </Link>
        </div>
      )}

      <footer className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 opacity-40">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Agenda Integrity Protocol v2.4.10</p>
      </footer>
    </div>
  );
}