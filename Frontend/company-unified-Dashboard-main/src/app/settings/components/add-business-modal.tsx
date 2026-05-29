
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
import { dashboardApi } from '@/lib/api-client';

interface AddBusinessModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const industries = ["Fintech", "E-commerce", "Media", "SaaS", "Logistics", "Retail", "Healthcare"];

export default function AddBusinessModal({ isOpen, onOpenChange }: AddBusinessModalProps) {
  const { toast } = useToast();
  const { countries } = useCountries();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => setStep(step => Math.min(step + 1, 3));
  const handleBack = () => setStep(step => Math.max(step - 1, 1));

  const reset = () => { setStep(1); setName(''); setCountry(''); setIndustry(''); setCurrency(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: 'Business name required', variant: 'destructive' }); setStep(1); return; }
    setSubmitting(true);
    try {
      // Real create → dashboard-service POST /domains (a "business" is modelled as a domain).
      await dashboardApi.createBusiness({ name: name.trim(), type: industry || undefined, country: country || undefined, currency: currency || undefined });
      onOpenChange(false);
      reset();
      window.dispatchEvent(new CustomEvent('business-created')); // business-management refetches
      const isDemo = localStorage.getItem('baalvion_demo_mode') === 'true';
      if (!isDemo) {
        window.dispatchEvent(new CustomEvent('celebrate', { detail: { message: 'Your first business is live on Baalvion!' } }));
      }
      toast({ title: 'Business Created', description: `${name.trim()} has been added to the platform.` });
    } catch (err) {
      toast({ title: 'Could not create business', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
                        <Input id="biz-name" placeholder="e.g., QuantumLeap AI" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-country">Country of Operation</Label>
                        <Select value={country} onValueChange={setCountry}><SelectTrigger id="biz-country"><SelectValue placeholder="Select a country" /></SelectTrigger><SelectContent>{countries.map(c => <SelectItem key={c.code} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-industry">Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}><SelectTrigger id="biz-industry"><SelectValue placeholder="Select an industry" /></SelectTrigger><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="biz-currency">Primary Currency</Label>
                        <Select value={currency} onValueChange={setCurrency}><SelectTrigger id="biz-currency"><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="INR">INR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select>
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
                        <p><strong>Name:</strong> {name || '—'}</p>
                        <p><strong>Country:</strong> {country || '—'}</p>
                        <p><strong>Industry:</strong> {industry || '—'}</p>
                        <p><strong>Currency:</strong> {currency || '—'}</p>
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
                    <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Business'}</Button>
                )}
              </div>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
