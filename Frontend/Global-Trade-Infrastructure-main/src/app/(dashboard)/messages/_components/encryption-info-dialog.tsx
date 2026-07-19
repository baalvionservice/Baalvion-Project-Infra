'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, Lock, KeyRound, RefreshCw } from 'lucide-react';

const PROTOCOL_DETAILS = [
  { icon: Lock, label: 'Cipher Suite', value: 'AES-256-GCM over TLS 1.3' },
  { icon: KeyRound, label: 'Handshake', value: 'X25519 key exchange, per-thread session keys' },
  { icon: RefreshCw, label: 'Key Rotation', value: 'Every 24 hours or on participant change' },
  { icon: ShieldCheck, label: 'Verification', value: 'HMAC-signed envelopes on every message' },
];

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function EncryptionInfoDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> E2E Encryption: AUTH_V4
          </DialogTitle>
          <DialogDescription>
            Every institutional dialogue node on this protocol version is end-to-end encrypted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {PROTOCOL_DETAILS.map((d) => (
            <div key={d.label} className="flex items-center gap-4 p-3 rounded-xl border-2 bg-muted/10">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <d.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{d.label}</p>
                <p className="text-sm font-bold truncate">{d.value}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
