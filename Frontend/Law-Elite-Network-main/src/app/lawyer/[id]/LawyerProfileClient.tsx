"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { getLawyerById } from '@/services/lawyers/lawyerService';
import { trackViewLawyer } from '@/services/behaviorService';
import { handleEvent } from '@/services/automationService';
import { EVENTS } from '@/lib/automation/eventTriggers';
import { useAuthStore } from '@/store/authStore';
import LawyerDetail from '@/components/sections/LawyerDetail';
import { Loader2, ArrowLeft, Gavel, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * @fileOverview LawyerProfileClient
 * Interactive client shell for a practitioner dossier. Server metadata + JSON-LD
 * live in the parent server page (page.tsx) for SEO.
 */
export default function LawyerProfileClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLawyerData = async () => {
      setLoading(true);
      try {
        if (id) {
          const data = await getLawyerById(id);
          setLawyer(data);
          if (data) {
            trackViewLawyer(data);
            if (user) {
              handleEvent(EVENTS.LAWYER_VIEWED, {
                userId: user.id,
                metadata: { lawyerName: data.name },
              });
            }
          }
        }
      } catch (error) {
        console.error('Dossier retrieval error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLawyerData();
  }, [id, user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-left-4 duration-700">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Return to Discovery
          </button>
          <Link href="/lawyers">
            <Button variant="outline" size="sm" className="h-8 border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <Search className="w-3 h-3 mr-1.5" /> Full Marketplace
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 animate-pulse">
              Synchronizing Professional Dossier...
            </p>
          </div>
        ) : lawyer ? (
          <LawyerDetail lawyer={lawyer} />
        ) : (
          <div className="py-32 text-center bg-white p-12 rounded-3xl border border-slate-200 animate-in zoom-in duration-500 max-w-lg mx-auto shadow-sm">
            <Gavel className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Practitioner Not Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto italic mb-8 font-medium">
              The requested professional record could not be located in the elite network.
            </p>
            <Link href="/lawyers">
              <Button className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-lg px-10 h-12 font-bold uppercase text-[10px] tracking-widest shadow-md">
                Return to Discovery
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
