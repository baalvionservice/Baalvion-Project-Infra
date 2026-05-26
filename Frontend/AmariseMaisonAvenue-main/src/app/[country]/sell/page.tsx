'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

/**
 * SellPage: Institutional Consignment Entrance.
 * Redirects authenticated sellers to their private terminal.
 */
export default function SellPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();
  const { toast } = useToast();
  const { recordLog } = useAppStore();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate Institutional Authentication
    setTimeout(() => {
      toast({
        title: "Atelier Identity Established",
        description: "Entering the private Partner Terminal.",
      });
      recordLog('Seller Login Initiated', 'Auth', countryCode);
      router.push('/admin/vendor');
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen font-body text-gray-900">
      <header className="h-20 border-b border-gray-100 px-12 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex-1">
          <Link
            href={`/${countryCode}`}
            className="text-[10px] font-bold tracking-[0.1em] text-gray-500 hover:text-black transition-colors flex items-center"
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Shopping
          </Link>
        </div>

        <div className="text-center">
          <Link href={`/${countryCode}`} className="group">
            <span className="font-headline text-3xl font-medium tracking-[0.05em] text-black">
              AMARISÉ <span className="text-xs font-bold tracking-[0.2em] ml-2 uppercase opacity-60 font-body italic">Maison Avenue</span>
            </span>
          </Link>
        </div>

        <div className="flex-1" />
      </header>

      <main className="container mx-auto px-6 py-32 flex flex-col items-center">
        <h1 className="text-5xl font-headline font-medium text-gray-900 mb-16 tracking-tight">
          Sell and Consign with Us
        </h1>

        <div className="w-full max-w-[500px] bg-white border border-gray-50 p-12 md:p-20 shadow-sm text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-gray-900">LOGIN</h2>
            <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
              Enter your email and we'll send you a login code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-none border-gray-900 bg-white text-center text-sm font-light placeholder:text-gray-300 focus:ring-0 focus:border-black transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-[160px] h-12 bg-[#E1D3DC] text-gray-900 hover:bg-[#D8C4D1] rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all mx-auto shadow-sm"
            >
              {isSubmitting ? 'SECURE...' : 'SUBMIT'}
            </Button>
          </form>

          <div className="pt-4">
            <p className="text-[11px] text-gray-400 font-light italic">
              New user? Register and submit an application <Link href="#" className="underline underline-offset-4 text-gray-600 hover:text-black transition-colors">here</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
