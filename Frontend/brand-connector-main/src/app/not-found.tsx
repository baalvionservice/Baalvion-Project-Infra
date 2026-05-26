'use client';

import { motion } from 'framer-motion';
import { Rocket, Home, Search, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="space-y-12"
        >
          {/* Logo Section */}
          <Link href="/" className="inline-flex items-center">
            <div className="bg-primary p-2 rounded-xl mr-2 shadow-lg">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight text-white">
              Baalvion <span className="text-primary">Connect</span>
            </span>
          </Link>

          {/* 404 Hero */}
          <div className="relative inline-block">
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                rotate: [-2, 2, -2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-[180px] md:text-[240px] font-black text-white/5 leading-none select-none"
            >
              404
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <Sparkles className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Lost in Orbit</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Campaign Not Found</h2>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been archived. Let's get you back to the marketplace.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-2xl h-14 px-10 font-black text-lg shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90">
                <Home className="mr-2 h-5 w-5" />
                Return to Base
              </Button>
            </Link>
            <Link href="/dashboard/creator/campaigns" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl h-14 px-10 font-bold text-white border-white/20 hover:bg-white/5 bg-transparent">
                <Search className="mr-2 h-5 w-5" />
                Search Campaigns
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-12 flex flex-wrap justify-center gap-8 border-t border-white/5">
            {['Support', 'Status', 'Help Docs', 'TOS'].map((link) => (
              <Link 
                key={link} 
                href="#" 
                className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] hover:text-primary transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
