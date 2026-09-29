'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (currentUser?.role === 'BRAND') {
        router.replace('/dashboard/brand');
      } else if (currentUser?.role === 'CREATOR') {
        router.replace('/dashboard/creator');
      } else if (currentUser?.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [currentUser, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="bg-primary p-4 rounded-[2rem] shadow-2xl shadow-primary/20 mb-8"
      >
        <Zap className="h-12 w-12 text-white fill-white" />
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Baalvion Connect</h2>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Syncing Workspace...</p>
        </div>
      </div>
    </div>
  );
}
