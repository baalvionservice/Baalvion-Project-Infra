"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getLawyerById } from "@/services/lawyerService";
import { createBooking } from "@/services/bookingService";
import { handleEvent } from "@/services/automationService";
import { sendEmail, sendWhatsApp } from "@/services/communicationService";
import { EVENTS } from "@/lib/automation/eventTriggers";
import SlotPicker from "@/components/booking/SlotPicker";
import BookingSummary from "@/components/booking/BookingSummary";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CalendarCheck, 
  ArrowLeft, 
  ChevronRight,
  Gavel
} from "lucide-react";
import Link from "next/link";

/**
 * @fileOverview BookingPage
 * The primary portal for securing executive consultations.
 */
export default function BookingPage() {
  const { lawyerId } = useParams();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { toast } = useToast();

  const [lawyer, setLawyer] = useState<any>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getLawyerById(lawyerId as string);
        setLawyer(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [lawyerId]);

  const handleBooking = async () => {
    if (!user) {
      toast({ 
        title: "Authentication Required", 
        description: "Please sign in to secure an executive consultation.", 
        variant: "destructive" 
      });
      router.push("/login");
      return;
    }

    if (!date || !time) {
      toast({ 
        title: "Incomplete Request", 
        description: "Please select both a date and an executive slot.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the real booking; the backend returns the canonical id used for checkout.
      const created = await createBooking({
        lawyerId: lawyerId as string,
        date,
        time,
        notes: `Consultation with ${lawyer.name}`,
      });
      const bookingId = created?.id || created?.appointmentId;
      if (!bookingId) throw new Error('Booking was not created');

      // Fire-and-forget engagement signals (non-blocking).
      handleEvent(EVENTS.BOOKING_CREATED, { userId: user.id }).catch(() => {});
      sendEmail("booking", { lawyerName: lawyer.name, date, time, bookingId }).catch(() => {});
      sendWhatsApp("booking", { lawyerName: lawyer.name, date, time }).catch(() => {});

      toast({
        title: "Engagement Initiated",
        description: "Your consultation request is reserved. Please complete settlement.",
      });

      // Transition to Checkout flow
      router.push(`/checkout/${bookingId}`);
    } catch (error) {
      toast({ 
        title: "Protocol Error", 
        description: "Unable to synchronize booking. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center glass-panel p-12 rounded-3xl border-white/5">
          <Gavel className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h2 className="text-2xl font-headline italic mb-2">Practitioner Not Found</h2>
          <Link href="/lawyers">
            <Button variant="link" className="text-accent uppercase tracking-widest text-[10px] font-bold">
              Return to Discovery
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <header className="flex items-center justify-between">
            <Link 
              href={`/lawyer/${lawyerId}`}
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Dossier
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 px-2 py-1 rounded">Scheduling Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </header>

          <div className="space-y-2">
            <h1 className="font-headline text-4xl italic text-white">Secure Consultation</h1>
            <p className="text-muted-foreground text-sm italic">Establish a direct engagement with {lawyer.name}.</p>
          </div>

          <div className="space-y-8 glass-panel p-8 rounded-3xl border-white/5 shadow-2xl">
            <div className="space-y-4">
              <Label htmlFor="date" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Calendar Date</Label>
              <div className="relative">
                <Input 
                  id="date"
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  className="glass-panel border-white/10 h-12 text-white"
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <SlotPicker 
              selectedSlot={time} 
              onSelect={setTime} 
              lawyerId={lawyerId as string}
              date={date}
            />

            <BookingSummary
              lawyer={lawyer}
              date={date}
              time={time}
            />

            <Button 
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-accent/10 transition-all active:scale-[0.98]"
              onClick={handleBooking}
              disabled={isSubmitting || !date || !time}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  AUTHENTICATING PROTOCOL...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  COMMIT ENGAGEMENT <ChevronRight className="ml-1 w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-[9px] text-muted-foreground text-center italic uppercase tracking-tighter">
              By committing, you agree to the Law Elite Network engagement terms and session protocols.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
