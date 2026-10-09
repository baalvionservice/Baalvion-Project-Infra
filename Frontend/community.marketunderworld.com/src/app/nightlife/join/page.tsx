"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Briefcase, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NightlifeJoinPage() {
  const router = useRouter();
  
  const handleSelect = (role: "candidate" | "employer") => {
    // In a real app, save to context or local storage before redirecting to actual auth
    // localStorage.setItem("nightlife_intent", role);
    router.push(`/nightlife/${role}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Link href="/clubs" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10">
        <ChevronLeft className="w-4 h-4" /> Back to Clubs
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Join the Nightlife Network</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Are you looking for high-paying gigs at premium clubs, or are you looking to hire top talent?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Button A: Candidate */}
          <button
            onClick={() => handleSelect("candidate")}
            className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-fuchsia-500/50 transition-all text-left overflow-hidden flex flex-col items-center text-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-fuchsia-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-10 h-10 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">I want to work at Events & Clubs</h3>
              <p className="text-sm text-gray-500">
                Sign up as a candidate to find paid gigs for hosting, promoting, dancing, and more.
              </p>
            </div>
            <div className="w-full mt-4 py-3 rounded-xl bg-white/5 group-hover:bg-fuchsia-600 font-bold text-white transition-colors">
              Continue as Candidate
            </div>
          </button>

          {/* Button B: Employer */}
          <button
            onClick={() => handleSelect("employer")}
            className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-blue-500/50 transition-all text-left overflow-hidden flex flex-col items-center text-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">I want to hire Staff / Promoters</h3>
              <p className="text-sm text-gray-500">
                Sign up as an employer, club owner, or coordinator to post jobs and recruit verified talent.
              </p>
            </div>
            <div className="w-full mt-4 py-3 rounded-xl bg-white/5 group-hover:bg-blue-600 font-bold text-white transition-colors">
              Continue as Employer
            </div>
          </button>
        </div>
        
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
             <p className="text-[12px] text-amber-400 font-bold uppercase tracking-wider">
               Warning: Never pay any coordinator an upfront registration fee or dress fee to get work. Report scam posts instantly.
             </p>
        </div>
      </motion.div>
    </div>
  );
}
