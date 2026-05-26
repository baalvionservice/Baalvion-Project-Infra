
'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, MessageSquare, Mail, Globe, ArrowRight, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSalesSystem } from '@/hooks/use-sales-system';
import { useToast } from '@/hooks/use-toast';
import { Product, MaisonService } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  service?: MaisonService;
}

export function InquiryModal({ isOpen, onClose, product, service }: InquiryModalProps) {
  const { createInitialInquiry } = useSalesSystem();
  const { toast } = useToast();
  const { country } = useParams();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    budget: 'Tier 2',
    intent: 'Personal',
    message: '',
    contactMethod: 'WhatsApp'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const inquiryId = createInitialInquiry({
      productId: product?.id,
      serviceId: service?.id,
      customerName: formData.name,
      email: formData.email,
      country: (country as string) || 'Global',
      budgetRange: formData.budget as any,
      intent: formData.intent as any,
      message: formData.message,
      contactMethod: formData.contactMethod as any,
      brandId: 'amarise-luxe'
    });

    toast({
      title: "Acquisition Intent Received",
      description: "A specialist curator has been assigned. Redirecting to secure dialogue...",
    });

    // Close and redirect to chat
    setTimeout(() => {
      onClose();
      router.push(`/${country || 'us'}/inquiry/${inquiryId}`);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white p-0 overflow-hidden flex flex-col md:flex-row rounded-none border-none shadow-2xl animate-fade-in">
        <div className="w-full md:w-[40%] bg-ivory p-12 space-y-12 flex flex-col justify-center border-r border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-plum via-gold to-plum opacity-50" />
          
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-secondary">
               <Crown className="w-5 h-5" />
               <span className="text-[10px] font-bold tracking-[0.5em] uppercase border-b border-gold/40 pb-1">
                 Acquisition Desk
               </span>
            </div>
            <h2 className="text-5xl font-headline font-bold italic leading-[0.9] text-gray-900 tracking-tighter">
              Private <br /> Curation
            </h2>
            <div className="h-px w-16 bg-plum" />
          </div>

          <p className="text-lg text-gray-500 font-light leading-relaxed italic">
            "Acquisition is a dialogue. Our curatorial specialists maintain the highest standard of discretion for the world's most serious collectors."
          </p>

          <div className="space-y-8 pt-4">
            <FeatureItem icon={<Globe className="w-5 h-5 text-gold" />} label="Global Sourcing Matrix" />
            <FeatureItem icon={<ShieldCheck className="w-5 h-5 text-gold" />} label="Institutional Trust" />
            <FeatureItem icon={<MessageSquare className="w-5 h-5 text-gold" />} label="Bespoke Private Dialogue" />
          </div>

          {product && (
            <div className="p-8 bg-white border border-border shadow-sm group">
               <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 block mb-2">TARGET ARTIFACT</span>
               <p className="text-xl font-headline font-bold italic text-gray-900 truncate group-hover:text-plum transition-colors">{product.name}</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-[60%] p-16 space-y-10 bg-white">
          <div className="space-y-2">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400">Registry Entry</h3>
             <p className="text-sm font-light italic">Please provide verified credentials for specialist review.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Legal Name</Label>
                <Input required className="h-12 rounded-none bg-ivory/30 border-border focus:border-plum transition-colors px-4" placeholder="Julian Vandervilt" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Verified Email</Label>
                <Input required type="email" className="h-12 rounded-none bg-ivory/30 border-border focus:border-plum transition-colors px-4" placeholder="j.vandervilt@lux.net" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Strategic Intent</Label>
                <Select value={formData.intent} onValueChange={v => setFormData({...formData, intent: v as any})}>
                  <SelectTrigger className="rounded-none bg-ivory/30 border-border h-12 px-4 focus:ring-plum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-luxury">
                    <SelectItem value="Personal" className="text-[10px] uppercase font-bold">Heritage Acquisition</SelectItem>
                    <SelectItem value="Investment" className="text-[10px] uppercase font-bold">Portfolio Curation</SelectItem>
                    <SelectItem value="Collector" className="text-[10px] uppercase font-bold">Archival Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Allocation Bracket</Label>
                <Select value={formData.budget} onValueChange={v => setFormData({...formData, budget: v as any})}>
                  <SelectTrigger className="rounded-none bg-ivory/30 border-border h-12 px-4 focus:ring-plum">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border shadow-luxury">
                    <SelectItem value="Tier 3" className="text-[10px] uppercase font-bold">Initial Discovery</SelectItem>
                    <SelectItem value="Tier 2" className="text-[10px] uppercase font-bold">Strategic Allocation</SelectItem>
                    <SelectItem value="Tier 1" className="text-[10px] uppercase font-bold">Institutional Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Discreet Brief</Label>
              <Textarea className="rounded-none bg-ivory/30 border-border min-h-[120px] text-xs px-4 py-4 italic font-light focus:border-plum" placeholder="Detail your requirements, heritage preferences, or provenance inquiries..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
            </div>

            <div className="space-y-4 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">PREFERRED DIALOGUE CHANNEL</p>
              <div className="flex space-x-6">
                <ContactMethodBtn icon={<MessageSquare className="w-4 h-4" />} label="WhatsApp Concierge" active={formData.contactMethod === 'WhatsApp'} onClick={() => setFormData({...formData, contactMethod: 'WhatsApp'})} />
                <ContactMethodBtn icon={<Mail className="w-4 h-4" />} label="Secure Portal" active={formData.contactMethod === 'Email'} onClick={() => setFormData({...formData, contactMethod: 'Email'})} />
              </div>
            </div>

            <div className="pt-6">
              <Button type="submit" className="w-full h-20 bg-plum text-white hover:bg-black rounded-none text-[11px] font-bold tracking-[0.5em] uppercase transition-all shadow-2xl shadow-plum/20">
                <Lock className="w-4 h-4 mr-4" /> TRANSMIT ACQUISITION BRIEF <ArrowRight className="ml-4 w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center space-x-4 group">
      <div className="p-3 bg-white rounded-full shadow-sm border border-border group-hover:bg-gold/10 transition-colors">{icon}</div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-700 leading-none">{label}</span>
    </div>
  );
}

function ContactMethodBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center space-x-3 h-14 border transition-all duration-500 ${active ? 'border-plum bg-plum/5 text-plum shadow-inner' : 'border-border text-gray-400 hover:border-plum hover:text-plum'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
