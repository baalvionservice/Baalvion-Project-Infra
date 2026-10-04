import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MapPin, Calendar, CreditCard, ChevronLeft, Briefcase, Shirt, ShieldCheck, CheckCircle2 } from "lucide-react";
import { gigs } from "@/lib/api/gigs";
import { ApplyButton } from "./apply-button";

export default async function GigDetailPage({ params }: { params: Promise<{ gigId: string }> }) {
  const { gigId } = await params;
  const gig = await gigs.get(gigId);

  if (!gig) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Back Link */}
        <Link 
          href="/nightlife/candidate" 
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Candidate Dashboard
        </Link>

        {/* Header Section */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Briefcase className="w-48 h-48 text-fuchsia-500" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                {gig.status === "active" ? "Active" : gig.status}
              </span>
              <span className="text-xs text-gray-500 font-medium">Posted {new Date(gig.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">{gig.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fuchsia-500" />
                <span className="text-white font-medium">{gig.venueAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-fuchsia-500" />
                <span className="text-white font-medium">{gig.eventDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Gig Requirements</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-bold mb-3">Roles Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {gig.rolesNeeded.map((role) => (
                      <span key={role} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {gig.dressCode && <div>
                  <h4 className="flex items-center gap-2 text-white font-bold mb-3">
                    <Shirt className="w-4 h-4 text-gray-400" /> Dress Code
                  </h4>
                  <p className="text-gray-400 text-sm">{gig.dressCode}</p>
                </div>}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">About the Employer</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">{gig.postedBy}</h4>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Verified Employer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="space-y-6">
            <div className="bg-fuchsia-600/5 border border-fuchsia-500/20 rounded-3xl p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-2">Compensation</p>
                <div className="text-4xl font-black text-white mb-2">₹{gig.payAmount.toLocaleString("en-IN")}</div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CreditCard className="w-4 h-4" /> {gig.payCycle}
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-fuchsia-500 shrink-0" />
                  <span>The employer reviews your verified profile</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-fuchsia-500 shrink-0" />
                  <span>No upfront fees or cuts taken</span>
                </li>
              </ul>

              <ApplyButton gigId={gig.id} open={gig.status === "active" && gig.eventDate >= new Date().toISOString().slice(0, 10)} />
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
