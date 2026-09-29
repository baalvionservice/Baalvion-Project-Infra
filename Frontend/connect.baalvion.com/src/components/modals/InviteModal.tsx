'use client';

import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IndianRupee, Send, Loader2 } from 'lucide-react';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: {
    name: string;
    handle: string;
    avatar: string;
  };
  onSendInvite: (data: any) => Promise<void>;
}

export function InviteModal({ open, onOpenChange, creator, onSendInvite }: InviteModalProps) {
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSendInvite({ budget, message });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader description="Send a direct campaign proposal.">
        Invite {creator.name}
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage src={creator.avatar} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-slate-900">{creator.name}</p>
            <p className="text-xs text-slate-400 font-bold uppercase">@{creator.handle}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-700">Initial Budget Offer (₹)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input 
              type="number" 
              placeholder="5,000" 
              className="pl-9 rounded-xl h-12" 
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-bold text-slate-700">Proposal Message</Label>
          <Textarea 
            placeholder="Hey! Love your recent tech reviews. We'd love to collaborate on our new hub launch..."
            className="min-h-[120px] rounded-2xl p-4 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !budget}
          className="w-full h-12 rounded-xl font-black text-md shadow-xl"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send Invite
        </Button>
      </ModalFooter>
    </Modal>
  );
}
