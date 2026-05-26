
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import corporateActionsData from '@/lib/data/corporate-actions.json';
import countriesData from '@/lib/data/countries.json';

interface AcquisitionWizardProps {
  onBack: () => void;
}

const industries = ["Fintech", "E-commerce", "Media", "SaaS", "Logistics", "Retail", "Healthcare"];
const paymentTerms = ["All Cash", "70% Cash / 30% Stock", "50% Cash / 50% Stock"];

export default function AcquisitionWizard({ onBack }: AcquisitionWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    targetName: 'Innovate Solutions',
    website: 'innovate.com',
    industry: 'SaaS',
    country: 'USA',
    revenue: 2500000,
    askingPrice: 10000000,
    diligence: [] as string[],
    offer: 9500000,
    terms: '70% Cash / 30% Stock',
    split: [70],
    closeDate: new Date(2024, 8, 30),
    milestones: [] as {name: string, date: Date}[],
  });
  const { toast } = useToast();

  const handleNext = () => setStep(prev => prev + 1);
  const handleBackStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Deal Submitted for Review',
      description: 'The acquisition proposal for ' + formData.targetName + ' has been sent to the board.',
    });
    onBack();
  };

  const Step1 = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={formData.targetName} onChange={e => setFormData({...formData, targetName: e.target.value})} /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Industry</Label><Select value={formData.industry} onValueChange={v => setFormData({...formData, industry: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Country</Label><Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{countriesData.map(c => <SelectItem key={c.name} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>Estimated Revenue ($)</Label><Input type="number" value={formData.revenue} onChange={e => setFormData({...formData, revenue: Number(e.target.value)})} /></div>
             <div className="space-y-2"><Label>Asking Price ($)</Label><Input type="number" value={formData.askingPrice} onChange={e => setFormData({...formData, askingPrice: Number(e.target.value)})} /></div>
        </div>
    </div>
  );
  
  const Step2 = () => (
     <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Select all items that have been completed or verified.</p>
        <div className="grid grid-cols-2 gap-4">
            {corporateActionsData.dueDiligenceItems.map(item => (
                <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item} onCheckedChange={(checked) => {
                        setFormData(prev => ({
                            ...prev,
                            diligence: checked ? [...prev.diligence, item] : prev.diligence.filter(d => d !== item)
                        }))
                    }} />
                    <label htmlFor={item} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{item}</label>
                </div>
            ))}
        </div>
    </div>
  );

  const Step3 = () => (
    <div className="space-y-4">
         <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2"><Label>Your Offer ($)</Label><Input type="number" value={formData.offer} onChange={e => setFormData({...formData, offer: Number(e.target.value)})} /></div>
             <div className="space-y-2"><Label>Payment Terms</Label><Select value={formData.terms} onValueChange={v => setFormData({...formData, terms: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentTerms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-2 pt-4">
            <Label>Cash / Equity Split</Label>
            <Slider value={formData.split} onValueChange={v => setFormData({...formData, split: v})} />
            <div className="flex justify-between text-sm">
                <span>{formData.split[0]}% Cash</span>
                <span>{100-formData.split[0]}% Equity</span>
            </div>
        </div>
    </div>
  );

  const Step4 = () => (
    <div className="space-y-4">
        <div className="space-y-2">
            <Label>Projected Completion Date</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{formData.closeDate ? format(formData.closeDate, 'PPP') : <span>Pick a date</span>}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.closeDate} onSelect={d => setFormData({...formData, closeDate: d!})} initialFocus /></PopoverContent>
            </Popover>
        </div>
        <div className="space-y-2">
            <Label>Key Milestones</Label>
            <p className="text-sm text-muted-foreground">This feature is coming soon.</p>
        </div>
    </div>
  );
  
  const Step5 = () => (
    <div className="space-y-4">
        <Card><CardHeader><CardTitle className="text-base">Target Details</CardTitle></CardHeader><CardContent className="text-sm"><p><strong>Company:</strong> {formData.targetName}</p><p><strong>Website:</strong> {formData.website}</p><p><strong>Industry:</strong> {formData.industry}</p><p><strong>Location:</strong> {formData.country}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Financials</CardTitle></CardHeader><CardContent className="text-sm"><p><strong>Asking Price:</strong> ${formData.askingPrice.toLocaleString()}</p><p><strong>Your Offer:</strong> ${formData.offer.toLocaleString()}</p><p><strong>Terms:</strong> {formData.terms}</p><p><strong>Split:</strong> {formData.split[0]}% Cash / {100-formData.split[0]}% Equity</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader><CardContent className="text-sm"><p><strong>Est. Close Date:</strong> {format(formData.closeDate, 'PP')}</p></CardContent></Card>
    </div>
  );

  const steps = [
      { title: 'Target', content: <Step1 /> },
      { title: 'Due Diligence', content: <Step2 /> },
      { title: 'Valuation', content: <Step3 /> },
      { title: 'Timeline', content: <Step4 /> },
      { title: 'Summary', content: <Step5 /> }
  ]

  return (
    <Card>
        <CardHeader>
            <Button variant="outline" size="sm" className="w-fit" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
            <CardTitle>New Acquisition</CardTitle>
            <CardDescription>Step {step} of {steps.length}: {steps[step - 1].title}</CardDescription>
            <Progress value={(step / steps.length) * 100} className="w-full" />
        </CardHeader>
        <CardContent>
            {steps[step-1].content}
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBackStep} disabled={step === 1}>Back</Button>
            {step < steps.length ? (
                <Button onClick={handleNext}>Next</Button>
            ) : (
                <Button onClick={handleSubmit}>Submit for Review</Button>
            )}
        </CardFooter>
    </Card>
  );
}
