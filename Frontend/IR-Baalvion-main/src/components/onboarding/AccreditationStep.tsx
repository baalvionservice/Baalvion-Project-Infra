
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Check, X, ShieldCheck, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function AccreditationStep({ onNext }: { onNext: (data: any) => void }) {
  const [isAccredited, setIsAccredited] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      <CardHeader className="text-center border-b border-border/50 pb-8 bg-primary/5">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Accreditation Audit</CardTitle>
        <CardDescription>Compliance verification per SEC Regulation D, Rule 501.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 flex gap-4">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-[11px] leading-relaxed text-muted-foreground italic">
            "Institutional access to Baalvion SPVs and Capital Operations is restricted to accredited investors meeting net-worth or professional sophistication requirements."
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-3 p-4 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer" onClick={() => setIsAccredited(!isAccredited)}>
            <Checkbox id="accredited" checked={isAccredited} onCheckedChange={(v) => setIsAccredited(!!v)} className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="accredited" className="text-sm font-bold leading-tight cursor-pointer">
                I certify my status as an Accredited Investor
              </Label>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Net worth exceeds $1M (excluding primary residence) or annual income exceeds $200k/$300k.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl border border-border/50 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
            <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} className="mt-1" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terms" className="text-sm font-bold leading-tight cursor-pointer">
                Fiduciary Acknowledgement
              </Label>
              <p className="text-[10px] text-muted-foreground leading-normal">
                I understand that private placement investments involve high risk and are illiquid.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest justify-center">
          <Info className="h-3 w-3" />
          <span>Documentation may be requested during audit</span>
        </div>

        <Button 
          disabled={!isAccredited || !agreedToTerms} 
          onClick={() => onNext({ accredited: true })}
          className="w-full h-12 font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          Verify Accreditation
        </Button>
      </CardContent>
    </div>
  );
}
