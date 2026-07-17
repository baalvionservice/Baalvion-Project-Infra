"use client"

import { useState, useEffect } from "react"
import { ClassSession } from "@/lib/types"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Clock, Shield, Calendar, MapPin, Globe } from "lucide-react"
import { motion } from "framer-motion"

export const NextClassCard = ({ session }: { session: ClassSession }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(session.startTime).getTime();
      const distance = start - now;

      if (distance < 0) {
        setTimeLeft("00:00:00");
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [session.startTime]);

  return (
    <NexusCard className="relative overflow-hidden border-blue-500/20 bg-gradient-to-br from-[#111118] to-[#0A0A0F] p-8 group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full group-hover:bg-blue-600/10 transition-colors" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> NEXT CLASS
            </div>
            <h2 className="text-3xl font-bold mb-2">{session.subject}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Global Private</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {session.duration} min</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">T-Minus</div>
            <div className="font-mono text-4xl font-bold text-white tracking-tight">{timeLeft}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/5 mb-10">
          <img src={session.teacherAvatar} className="w-14 h-14 rounded-xl object-cover" alt={session.teacherName} />
          <div className="flex-1">
            <div className="text-lg font-bold">{session.teacherName}</div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">NEXUS Elite Faculty</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-emerald-400 mb-1">{session.paidAmount}</div>
            <NexusBadge variant="success" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400">PAID</NexusBadge>
          </div>
        </div>

        <div className="flex gap-4">
          <NexusButton className="flex-1 nexus-gradient-bg h-14 text-lg font-bold" disabled>Join Class Room</NexusButton>
          <NexusButton variant="outline" className="flex-1 border-white/10 h-14 font-bold">Reschedule</NexusButton>
        </div>
        <div className="mt-6 text-center">
           <button className="text-[11px] font-bold text-gray-600 hover:text-blue-400 transition-colors uppercase tracking-widest">
             Add to Google Calendar
           </button>
        </div>
      </div>
    </NexusCard>
  )
}
