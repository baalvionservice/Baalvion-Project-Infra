"use client"

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, GraduationCap, ShoppingBag, ChevronRight, Terminal, Globe, MapPin, Check } from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton';
import { REGIONS } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const router = useRouter();

  const activeRegion = useMemo(() => 
    REGIONS.find(r => r.id === selectedRegionId), 
  [selectedRegionId]);

  const handleComplete = () => {
    const path = role === 'TEACHER' ? '/admin/teacher' : role === 'SELLER' ? '/admin/seller' : '/student/dashboard';
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden scanline">
      <div className="max-w-4xl w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="text-center space-y-12"
            >
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-3xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green">
                  <Terminal className="w-12 h-12" />
                </div>
              </div>
              <div className="space-y-6">
                <h1 className="text-6xl font-bold tracking-tighter uppercase italic leading-none">Market <span className="text-brand-green">Underworld.</span></h1>
                <p className="text-text-secondary text-xl font-mono">Initializing connection to global trade network...</p>
              </div>
              <AppButton size="xl" onClick={() => setStep(2)}>Enter Network <ChevronRight className="ml-2 w-5 h-5" /></AppButton>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold uppercase tracking-tight">Identify Your <span className="text-brand-green">Role.</span></h2>
                <p className="text-text-muted font-mono text-sm uppercase">Select your primary function within the exchange.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'STUDENT', name: 'Learner', icon: GraduationCap, desc: 'Acquire high-precision knowledge from global masters.' },
                  { id: 'TEACHER', name: 'Operator', icon: Zap, desc: 'Deliver elite sessions and broadcast trade intelligence.' },
                  { id: 'SELLER', name: 'Merchant', icon: ShoppingBag, desc: 'Control inventory and fulfill global trade requests.' },
                ].map((r) => (
                  <button 
                    key={r.id}
                    onClick={() => { setRole(r.id); setStep(3); }}
                    className="p-8 rounded bg-brand-surface border border-brand-border text-left hover:border-brand-green transition-all group"
                  >
                    <r.icon className="w-10 h-10 text-text-muted group-hover:text-brand-green mb-6 transition-colors" />
                    <h3 className="text-xl font-bold mb-2 uppercase text-white">{r.name}</h3>
                    <p className="text-xs text-text-muted leading-relaxed font-mono">{r.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold uppercase tracking-tight">Node <span className="text-brand-green">Assignment.</span></h2>
                <p className="text-text-muted font-mono text-sm uppercase">Select your primary geographic intelligence node.</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {REGIONS.map((reg) => (
                  <button 
                    key={reg.id}
                    onClick={() => { setSelectedRegionId(reg.id); setStep(4); }}
                    className={cn(
                      "p-6 rounded bg-brand-surface border border-brand-border text-center transition-all group",
                      selectedRegionId === reg.id ? "border-brand-green" : "hover:border-semantic-info"
                    )}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{reg.icon}</div>
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-white">{reg.name}</h3>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold uppercase tracking-tight">Country <span className="text-brand-green">Precise.</span></h2>
                <p className="text-text-muted font-mono text-sm uppercase">Routing intelligence for {activeRegion?.name}.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {(activeRegion?.countries ?? []).map((country) => (
                  <button 
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className={cn(
                      "p-5 rounded bg-brand-surface border flex items-center justify-between transition-all",
                      selectedCountry === country ? "border-brand-green bg-brand-green/5" : "border-brand-border hover:border-white/20"
                    )}
                  >
                    <span className="text-sm font-bold text-white">{country}</span>
                    {selectedCountry === country && <Check className="w-4 h-4 text-brand-green" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <AppButton 
                  size="lg" 
                  disabled={!selectedCountry}
                  onClick={handleComplete}
                  className="px-16"
                >
                  Confirm Registry <ChevronRight className="ml-2 w-4 h-4" />
                </AppButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
