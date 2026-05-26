'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Volume2, Pause, VolumeX, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * MadAveLiveWidget: Persistent storefront live-stream preview.
 * Updated to AMARISÉ branding.
 */
export function MadAveLiveWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const { country } = useParams();
  const countryCode = (country as string) || 'us';

  useEffect(() => {
    // Show widget after a brief delay for institutional presence
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[70] w-[320px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden border border-gray-100 font-body"
      >
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-center bg-white">
          <h3 className="font-headline text-2xl font-medium tracking-tight text-gray-900">
            AMARISÉ
          </h3>
          <button 
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            aria-label="Close Live Preview"
          >
            <X className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        {/* Video Preview Area */}
        <div className="px-6 pb-6">
          <div className="relative aspect-[3/4] bg-muted overflow-hidden group">
            <Image 
              src="https://picsum.photos/seed/madave-live-preview/600/800" 
              alt="Live Atelier Presentation" 
              fill 
              className={cn(
                "object-cover transition-transform duration-[10s] ease-linear",
                isPlaying ? "scale-110" : "scale-100"
              )}
              data-ai-hint="luxury fashion"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            
            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest shadow-sm">Live Now</span>
            </div>

            {/* Video Controls Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Content Text Overlay */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 drop-shadow-lg">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Current Presentation</p>
               <h4 className="text-lg font-headline font-bold italic leading-tight">Birkin 25 Rose Sakura</h4>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="mt-6 text-center border-t border-gray-50 pt-6">
            <Link href={`/${countryCode}/account/live`}>
              <button className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-900 hover:text-plum transition-colors group flex items-center justify-center mx-auto border-b border-gray-900 pb-1">
                VIEW LIVE SHOP
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}