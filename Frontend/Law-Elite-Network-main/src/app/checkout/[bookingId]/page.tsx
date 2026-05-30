"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getBookingById } from "@/services/bookingService";
import { createPayment, openRazorpayCheckout, verifyPayment } from "@/services/payments/paymentService";
import PaymentMethods from "@/components/payment/PaymentMethods";
import PaymentSummary from "@/components/payment/PaymentSummary";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Lock, 
  ArrowLeft, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * @fileOverview CheckoutPage
 * Bank-grade financial gateway for securing executive consultations.
 */
export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}

function CheckoutContent() {
  const { bookingId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [method, setMethod] = useState<string>("upi");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getBookingById(bookingId as string);
        setBooking(data);
      } catch (err) {
        toast({ title: "Protocol Error", description: "Unable to retrieve session ledger.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [bookingId, toast]);

  const handlePayment = async () => {
    if (!user || !booking) return;

    setIsProcessing(true);
    try {
      const created = await createPayment({
        bookingId: bookingId as string,
        amount: booking.amount || booking.total_amount || 0,
        method,
        currency: booking.currency || "INR",
        lawyerId: booking.lawyerId,
      });

      // Real gateway: open Razorpay Checkout (cards / UPI / netbanking / wallets / bank), then verify.
      if (created?.gateway === "razorpay" && created?.razorpay) {
        const rzp = await openRazorpayCheckout({
          keyId: created.razorpay.keyId,
          orderId: created.razorpay.orderId,
          amount: created.razorpay.amount,
          currency: created.razorpay.currency,
          description: `Consultation${booking.lawyerName ? ` with ${booking.lawyerName}` : ""}`,
          prefill: { name: (user as any)?.name, email: (user as any)?.email },
        });
        await verifyPayment(created.id as any, rzp);
      }
      // (no gateway configured -> payment already settled server-side)

      setIsSuccess(true);
      toast({
        title: "Transaction Successful",
        description: "Your session fee has been secured. Engagement is now active.",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      if (error?.message === "Payment cancelled") {
        toast({ title: "Payment cancelled", description: "You can complete the payment anytime from your dashboard." });
      } else {
        toast({
          variant: "destructive",
          title: "Settlement Failure",
          description: error?.message || "Unable to process payment. Please try again.",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Payment Gateway...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-emerald-100 shadow-2xl animate-in zoom-in duration-500 max-w-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Settlement Verified</h2>
          <p className="text-slate-500 font-medium text-sm mb-8">Your executive consultation has been secured. Redirecting to your command center...</p>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="text-center bg-white p-12 rounded-3xl border border-slate-200 shadow-xl">
          <Lock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Session Ledger</h2>
          <Link href="/dashboard">
            <Button variant="outline" className="text-blue-600 uppercase tracking-widest text-[10px] font-bold border-slate-200">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
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
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Secure Gateway</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          </header>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">Secure Settlement</h1>
            <p className="text-slate-500 text-sm font-medium">Authorize session fee for Engagement #{bookingId.toString().slice(-8)}.</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <PaymentSummary booking={booking} />
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-30" />
              
              <PaymentMethods onSelect={setMethod} />

              <div className="pt-4 border-t border-slate-100">
                <Button 
                  className="w-full bg-[#0B1F3A] text-white hover:bg-slate-800 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      AUTHORIZING SETTLEMENT...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      AUTHORIZE PAYMENT <ChevronRight className="ml-1 w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-tighter mt-4 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-300" /> Secure 256-bit encryption active. Unauthorized attempts are logged.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
