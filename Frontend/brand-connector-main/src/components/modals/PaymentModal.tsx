'use client';

import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, CreditCard, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  campaignTitle: string;
  onConfirm: () => Promise<void>;
}

export function PaymentModal({ open, onOpenChange, amount, campaignTitle, onConfirm }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
    onOpenChange(false);
  };

  const platformFee = Math.round(amount * 0.15);
  const total = amount + platformFee;

  return (
    <Modal open={open} onOpenChange={onOpenChange} variant="success" size="md">
      <ModalHeader description="Fund your campaign escrow.">
        Confirm Payment
      </ModalHeader>
      <ModalBody className="space-y-8">
        <div className="p-6 rounded-[2rem] bg-emerald-50/50 border-2 border-emerald-100 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total to Secure</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{total.toLocaleString()}</p>
          </div>
          <ShieldCheck className="h-12 w-12 text-emerald-500 opacity-20" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-400">Campaign Budget</span>
            <span className="text-slate-900">₹{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-400">Platform Service Fee (15%)</span>
            <span className="text-slate-900">₹{platformFee.toLocaleString()}</span>
          </div>
          <Separator />
          <p className="text-[10px] text-slate-400 font-medium italic">
            Reference Campaign: <strong>{campaignTitle}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Visa ending in •••• 4242</span>
        </div>
      </ModalBody>
      <ModalFooter className="flex-col !items-stretch">
        <Button 
          onClick={handlePay} 
          disabled={isProcessing}
          className="h-14 rounded-2xl font-black text-lg shadow-xl bg-emerald-600 hover:bg-emerald-700"
        >
          {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
          Fund Escrow & Launch
        </Button>
        <p className="text-[9px] text-center font-black text-slate-400 uppercase tracking-widest mt-4">
          Secured by Baalvion Multi-Sig Escrow
        </p>
      </ModalFooter>
    </Modal>
  );
}
