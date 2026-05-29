
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCountries } from '@/hooks/use-countries';

interface AddBusinessModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const industries = ["Fintech", "E-commerce", "Media", "SaaS", "Logistics", "Retail", "Healthcare"];

export default function AddBusinessModal({ isOpen, onOpenChange }: AddBusinessModalProps) {
  const { toast } = useToast();
  const { countries } = useCountries();
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(step => Math.min(step + 1, 3));
  const handleBack = () => setStep(step => Math.max(step - 1, 1));
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    setStep(1); // Reset for next time
    
    // In a real app, you would check if this is the first business.
    // For this demo, we'll assume it is if the user isn't in demo mode.
    const isDemo = localStorage.getItem('baalvion_demo_mode') === 'true';
    if (!isDemo) {
        window.dispatchEvent(new CustomEvent('celebrate', { detail: { message: 'Your first business is live on Baalvion!' } }));
    } else {
        toast({
            title: 'Business Created',
            description: 'Your new business has been added to the platform.',
        });
    }
  };

  const progress = (step / 3) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Business</DialogTitle>
          <DialogDescription>
            Follow the steps to add and configure a new business.
          </DialogDescription>
        </DialogHeader>
        <Progress value={progress} className="w-full" />
        
        <form onSubmit={handleSubmit}>
            <div className="py-4 space-y-4">
            {step === 1 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="biz-name">Business Name</Label>
                        <Input id="biz-name" placeholder="e.g., QuantumLeap AI" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-country">Country of Operation</Label>
                        <Select><SelectTrigger id="biz-country"><SelectValue placeholder="Select a country" /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-industry">Industry</Label>
                        <Select><SelectTrigger id="biz-industry"><SelectValue placeholder="Select an industry" /></SelectTrigger><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-currency">Primary Currency</Label>
                        <Select><SelectTrigger id="biz-currency"><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
                    </div>
                </div>
            )}
            {step === 2 && (
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="biz-domain">Primary Domain</Label>
                        <Input id="biz-domain" placeholder="e.g., ql-ai.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Add Employees</Label>
                        <Button variant="outline" className="w-full">Invite employees via email</Button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="space-y-4">
                    <h4 className="font-semibold">Review Details</h4>
                    <div className="text-sm space-y-2 rounded-md border p-4 bg-muted/50">
                        <p><strong>Name:</strong> QuantumLeap AI</p>
                        <p><strong>Country:</strong> USA</p>
                        <p><strong>Industry:</strong> SaaS</p>
                        <p><strong>Currency:</strong> USD</p>
                    </div>
                </div>
            )}
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
              {step > 1 && <Button type="button" variant="outline" onClick={handleBack}>Back</Button>}
              <div className={step === 1 ? 'col-span-2' : ''}>
                {step < 3 ? (
                    <Button type="button" className="w-full" onClick={handleNext}>Next</Button>
                ) : (
                    <Button type="submit" className="w-full">Create Business</Button>
                )}
              </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
