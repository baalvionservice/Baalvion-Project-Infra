'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CuratorChat } from '@/components/sales/CuratorChat';
import { useSalesSystem } from '@/hooks/use-sales-system';
import { ChevronLeft, Crown, ShieldCheck, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InquiryConversationPage() {
  const { id, country } = useParams();
  const { getInquiry } = useSalesSystem();
  const router = useRouter();
  
  const inquiry = getInquiry(id as string);
  const countryCode = (country as string) || 'us';

  if (!inquiry) {
    return <div className="py-40 text-center font-headline text-3xl">Acquisition Record Not Found</div>;
  }

  return (
    <div className="bg-ivory min-h-screen pb-32">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Metadata Sidebar */}
          <aside className="lg:w-80 space-y-12 shrink-0 lg:sticky lg:top-40">
            <div className="space-y-8">
              <Link href={`/${countryCode}`} className="inline-flex items-center text-[10px] tracking-[0.4em] uppercase text-gray-400 hover:text-plum transition-colors font-bold">
                <ChevronLeft className="w-3 h-3 mr-2" /> Exit Dialogue
              </Link>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-headline font-bold italic text-gray-900 leading-tight">Private Acquisition Registry</h1>
                <p className="text-xs text-muted-foreground font-light leading-relaxed italic">
                  Registry No. {inquiry.id.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="bg-white p-8 border border-border shadow-sm space-y-8">
              <div className="space-y-6">
                <StatusItem label="Market Hub" value={inquiry.country} icon={<Globe className="w-4 h-4 text-gold" />} />
                <StatusItem label="Lead Status" value={inquiry.status} icon={<ShieldCheck className="w-4 h-4 text-gold" />} />
                <StatusItem label="Priority Tier" value={`Tier ${inquiry.leadTier}`} icon={<Crown className="w-4 h-4 text-gold" />} />
              </div>
              
              <div className="pt-8 border-t border-border space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Acquisition Target</span>
                <div className="p-4 bg-ivory border border-border">
                  <p className="text-sm font-headline font-bold italic text-gray-900">Maison Archive Entry</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">REF: {inquiry.productId?.toUpperCase() || 'UNSPECIFIED'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-plum/5 border border-plum/10 rounded-sm">
              <p className="text-[10px] text-plum font-bold uppercase tracking-widest italic mb-2">Notice</p>
              <p className="text-[10px] text-gray-500 font-light leading-relaxed italic">
                All curatorial dialogues are archived for provenance verification and institutional responsibility.
              </p>
            </div>
          </aside>

          {/* Main Chat Interface */}
          <main className="flex-1 w-full">
            <CuratorChat inquiryId={id as string} />
          </main>

        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="p-2 bg-ivory rounded-full border border-border">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <span className="text-xs font-bold uppercase tracking-tight text-gray-900">{value}</span>
      </div>
    </div>
  );
}
