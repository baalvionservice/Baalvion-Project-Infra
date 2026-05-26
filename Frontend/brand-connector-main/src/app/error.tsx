'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center mb-12">
            <div className="bg-primary p-2 rounded-xl mr-2 shadow-lg shadow-primary/20">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight text-slate-900">
              Baalvion <span className="text-primary">Connect</span>
            </span>
          </Link>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-24 w-24 rounded-[2.5rem] bg-red-100 flex items-center justify-center text-red-600 mb-6 shadow-xl shadow-red-100/50"
          >
            <AlertTriangle className="h-12 w-12" />
          </motion.div>

          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">System Malfunction</h1>
          <p className="text-slate-500 mt-4 text-lg font-medium leading-relaxed">
            A critical error occurred in the marketplace engine. Don't worry, your data and escrowed funds are safe.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => reset()}
              size="lg"
              className="w-full rounded-2xl font-black text-lg h-14 shadow-xl shadow-primary/20"
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Re-initialize Workspace
            </Button>
            <Link href="/" className="w-full">
              <Button 
                variant="outline"
                size="lg"
                className="w-full rounded-2xl font-bold h-14 bg-white border-slate-200"
              >
                <Home className="mr-2 h-5 w-5" />
                Return to Safety
              </Button>
            </Link>
          </div>
          
          <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Incident Reference</span>
            <code className="text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-400">
              {error.digest || 'BV-AUTO-LOG'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
