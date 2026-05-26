'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const proFeatures = ['Up to 5 Businesses', '25 users', 'AI predictions', 'Priority support', 'Multi-currency'];
const enterpriseFeatures = ['Unlimited businesses', 'Unlimited users', 'White-label', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'];

interface UpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function UpgradeModal({ isOpen, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>You've reached your plan limit</DialogTitle>
          <DialogDescription>
            You have 5/5 businesses on your Pro plan. Upgrade to Enterprise to add more.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          <Card>
            <CardHeader><CardTitle>Pro (Current)</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {proFeatures.map(f => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</li>)}
              </ul>
            </CardContent>
          </Card>
           <Card className="border-primary ring-2 ring-primary">
            <CardHeader><CardTitle>Enterprise</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {enterpriseFeatures.map(f => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{f}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button>Upgrade to Enterprise <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
