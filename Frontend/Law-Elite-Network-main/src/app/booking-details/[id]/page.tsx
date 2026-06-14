"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getBookingById, cancelBooking } from "@/services/bookingService";
import { getLawyerById } from "@/services/lawyerService";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle,
  FileText,
  User,
  Gavel,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview BookingDetailPage
 * Deep-dive audit portal for individual consultation engagements.
 */
export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [lawyer, setLawyer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const bookingData = await getBookingById(id as string);
        if (bookingData) {
          setBooking(bookingData);
          const lawyerData = await getLawyerById(bookingData.lawyerId as string);
          setLawyer(lawyerData);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleCancelEngagement = async () => {
    if (!window.confirm("Confirm termination of this consultation engagement?")) return;

    setIsCancelling(true);
    try {
      await cancelBooking(id as string);
      toast({
        title: "Engagement Terminated",
        description: "The consultation has been successfully removed from the active agenda.",
      });
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Unable to process termination. Please contact concierge.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-sm">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Engagement Not Found</h2>
          <button 
            onClick={() => router.back()}
            className="text-blue-600 uppercase tracking-widest text-[10px] font-bold hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <header className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Return to Previous
            </button>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <LayoutDashboard className="w-3 h-3 mr-1" /> Overview
                </Button>
              </Link>
              <Badge 
                variant="outline"
                className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  booking.status === "confirmed" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : booking.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${booking.status === "confirmed" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                {booking.status} Engagement
              </Badge>
            </div>
          </header>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">Engagement Dossier</h1>
            <p className="text-slate-500 text-sm font-medium">Audit report for Engagement ID: {booking.id.slice(-8)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Consultation Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                      <Gavel className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practitioner Assigned</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{lawyer?.name || "Verified Practitioner"}</h3>
                      <p className="text-xs text-blue-600 uppercase font-bold tracking-tighter mt-1">{lawyer?.specialization || "Legal"} Counsel</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 py-8 border-y border-slate-100">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-blue-600" /> Scheduled Date
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{new Date(booking.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3 text-blue-600" /> Session Time
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{booking.time}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance & Metadata</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Status Synchronization</span>
                        <span className="text-emerald-600 font-bold uppercase text-[10px]">Verified Secure</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Encryption Layer</span>
                        <span className="text-blue-600 font-bold uppercase text-[10px]">E2E Active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="md:col-span-1 space-y-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-lg font-bold text-[10px] uppercase tracking-widest h-11">
                    Open Secure Channel
                  </Button>
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-[10px] uppercase tracking-widest h-11">
                    Download Summary
                  </Button>
                </CardContent>
              </Card>

              {booking.status !== "cancelled" && (
                <Card className="border-red-100 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Termination Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">
                      Engagement can be terminated up to 24 hours prior to the session.
                    </p>
                    <Button 
                      onClick={handleCancelEngagement}
                      disabled={isCancelling}
                      variant="destructive" 
                      className="w-full rounded-lg font-bold text-[10px] uppercase tracking-widest bg-red-600 hover:bg-red-700 h-11"
                    >
                      {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                      Terminate Engagement
                    </Button>
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>

        </div>
      </main>
    </div>
  );
}
