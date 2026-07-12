
"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, Globe, CheckCircle2, Zap, Clock, ShieldCheck } from 'lucide-react';
import { ListingCard, Badge } from '@/components/ui/ListingCard';
import { AppButton } from '@/components/ui/AppButton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface TeacherCardProps {
  teacher: any;
  index: number;
}

export const TeacherCard = ({ teacher, index }: TeacherCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <ListingCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02] group hover:border-brand-green/30 transition-all duration-500 flex flex-col h-full">
        <div className="relative aspect-square overflow-hidden bg-brand-void shrink-0">
          <Image
            src={teacher.avatar}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80"
            alt={teacher.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent opacity-60" />
          
          <div className="absolute top-4 left-4 flex gap-2">
            {teacher.isLive && (
              <Badge variant="live" className="animate-pulse shadow-lg shadow-red-500/20">LIVE</Badge>
            )}
            <Badge variant="info" className="bg-brand-void/80 border-white/10 text-[8px]">{teacher.regionId?.toUpperCase() || 'GLOBAL'}</Badge>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
              <span className="text-xl">🇮🇳</span>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{teacher.country}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 flex-1 flex flex-col">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-brand-green transition-colors leading-none mb-2">
                  {teacher.name}
                </h3>
                <div className="flex items-center gap-2">
                  {teacher.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Operator</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-green/10 text-brand-green px-2.5 py-1 rounded-lg">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold font-mono">{teacher.rating}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 font-medium italic">
              "{teacher.bio || 'Expert educator specialized in high-performance learning protocols.'}"
            </p>

            <div className="flex flex-wrap gap-2">
              {teacher.subjects?.map((s: string) => (
                <span key={s} className="text-[9px] font-bold px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5 uppercase tracking-tighter">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Standard Rate</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {teacher.price_per_hour || teacher.pricePerHour} <span className="text-xs text-brand-green">USDT/HR</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Students</div>
                <div className="text-lg font-bold text-gray-300 font-mono">1.2k+</div>
              </div>
            </div>

            <AppButton className="w-full h-12 nexus-gradient-bg font-bold uppercase tracking-widest text-[11px]">
              Initialize Session
            </AppButton>
          </div>
        </div>
      </ListingCard>
    </motion.div>
  );
};
