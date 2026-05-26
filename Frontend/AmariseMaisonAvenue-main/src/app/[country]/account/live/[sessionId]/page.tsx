'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { 
  Camera, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  Zap, 
  Maximize2,
  Settings,
  MessageSquare,
  Users,
  ChevronLeft,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Live Atelier Viewport: Immersive Curatorial Viewing.
 * Simulates a high-fidelity 4K video session between client and curator.
 */
export default function LiveAtelierViewport() {
  const { country, sessionId } = useParams();
  const router = useRouter();
  const { activeVip } = useAppStore();
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [activeLens, setActiveLens] = useState<'Wide' | 'Macro' | 'Structural'>('Wide');
  const [isCuratorSpeaking, setIsCuratorSpeaking] = useState(false);

  const countryCode = (country as string) || 'us';

  useEffect(() => {
    const interval = setInterval(() => {
      setIsCuratorSpeaking(Math.random() > 0.7);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-body animate-fade-in">
      {/* 1. Viewport Header */}
      <header className="h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-10 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center space-x-8">
          <Link href={`/${countryCode}/account/live`}>
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10 rounded-none border-none">
              <ChevronLeft className="w-5 h-5 mr-2" /> EXIT ATELIER
            </Button>
          </Link>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
             <div className="flex items-center space-x-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Live Private Viewing</span>
                <Badge className="bg-red-500 text-white border-none text-[8px] uppercase animate-pulse">4K SECURE</Badge>
             </div>
             <h1 className="text-sm font-bold uppercase tracking-widest text-white/80">Ref: {sessionId?.toString().toUpperCase()}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-6">
           <div className="flex items-center space-x-2 text-secondary">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Stream</span>
           </div>
           <div className="w-10 h-10 bg-white/10 rounded-none flex items-center justify-center font-bold text-xs">
             {activeVip?.name.charAt(0)}
           </div>
        </div>
      </header>

      {/* 2. Main High-Fidelity Feed */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#050505]">
        {/* Placeholder for Video Feed */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
           <Video className="w-64 h-64 text-white" />
        </div>
        
        {/* Cinematic Visual Box Mock */}
        <div className={cn(
          "w-full h-full relative transition-all duration-[2s] flex items-center justify-center",
          activeLens === 'Macro' ? "scale-150 grayscale-[20%]" : 
          activeLens === 'Structural' ? "scale-110 brightness-110" : "scale-100"
        )}>
           <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
           <p className="absolute text-[10px] font-bold tracking-[0.8em] text-white/10 uppercase italic">Atelier Optical Lens: {activeLens}</p>
        </div>

        {/* Overlay: Curator Node */}
        <div className="absolute top-32 right-10 w-64 aspect-video bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl z-10 overflow-hidden group">
           <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full bg-plum/20 border-2 flex items-center justify-center transition-all duration-500",
                isCuratorSpeaking ? "border-gold scale-110 shadow-gold-glow" : "border-white/10"
              )}>
                 <span className="font-headline text-2xl font-bold italic text-gold">M</span>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-bold uppercase tracking-widest">Maison Curator</p>
                 <p className="text-[8px] text-gray-400 italic">Paris Central Atelier</p>
              </div>
           </div>
           <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 overflow-hidden">
              <div className={cn("h-full bg-gold transition-all duration-300", isCuratorSpeaking ? "w-full opacity-100" : "w-0 opacity-0")} />
           </div>
        </div>

        {/* Overlay: Technical Specs */}
        <div className="absolute bottom-32 left-10 space-y-6 z-10">
           <div className="bg-black/40 backdrop-blur-md p-6 border border-white/10 space-y-4 w-72 shadow-2xl">
              <div className="flex items-center space-x-2 text-gold">
                 <Info className="w-3.5 h-3.5" />
                 <span className="text-[9px] font-bold uppercase tracking-widest">Artifact Specs</span>
              </div>
              <div className="space-y-2">
                 <SpecRow label="Material" value="Etoupe Clemence" />
                 <SpecRow label="Hardware" value="Brushed Gold" />
                 <SpecRow label="Condition" value="Pristine / Unworn" />
              </div>
           </div>
        </div>
      </main>

      {/* 3. Control Matrix */}
      <footer className="h-32 bg-black border-t border-white/10 flex items-center justify-between px-12 shrink-0 z-20">
        <div className="flex items-center space-x-4">
           <ControlBtn icon={isMicOn ? <Mic /> : <MicOff />} active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} />
           <ControlBtn icon={isCamOn ? <Video /> : <VideoOff />} active={isCamOn} onClick={() => setIsCamOn(!isCamOn)} />
           <div className="h-10 w-px bg-white/10 mx-4" />
           <ControlBtn icon={<Settings />} label="Audio Config" />
        </div>

        <div className="flex items-center space-x-3 bg-white/5 p-1.5 rounded-none border border-white/5">
           {(['Wide', 'Macro', 'Structural'] as const).map(lens => (
             <button 
              key={lens}
              onClick={() => setActiveLens(lens)}
              className={cn(
                "px-6 py-2 text-[9px] font-bold uppercase tracking-widest transition-all",
                activeLens === lens ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
              )}
             >
               {lens} LENS
             </button>
           ))}
        </div>

        <div className="flex items-center space-x-6">
           <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Session Duration</span>
              <span className="text-sm font-bold font-mono">12:42</span>
           </div>
           <Button className="h-14 px-10 rounded-none bg-red-600 text-white hover:bg-red-700 transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl" onClick={() => router.push(`/${countryCode}/account/live`)}>
             <PhoneOff className="w-4 h-4 mr-3" /> TERMINATE SESSION
           </Button>
        </div>
      </footer>
    </div>
  );
}

function ControlBtn({ icon, active = true, onClick, label }: { icon: any, active?: boolean, onClick?: () => void, label?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-12 h-12 flex flex-col items-center justify-center transition-all group rounded-none border",
        active ? "bg-white/5 border-white/10 text-white" : "bg-red-500/10 border-red-500/20 text-red-500"
      )}
    >
      {icon}
      {label && <span className="text-[6px] font-bold uppercase mt-1 opacity-40">{label}</span>}
    </button>
  );
}

function SpecRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
       <span className="text-[8px] font-bold uppercase text-white/30">{label}</span>
       <span className="text-[10px] font-bold text-white/80">{value}</span>
    </div>
  );
}
