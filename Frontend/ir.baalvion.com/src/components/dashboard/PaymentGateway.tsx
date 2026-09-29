"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Banknote, Copy, ExternalLink, Loader2, FileSignature, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addMockEvent } from '@/lib/events';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '../ui/separator';

export default function PaymentGateway() {
  const { toast } = useToast();
  // State to manage the current step in the payment flow
  const [step, setStep] = useState(1);
  // State for the selected currency
  const [currency, setCurrency] = useState('USD');
  // State to show a loader while simulating e-signature
  const [isSigning, setIsSigning] = useState(false);
  // State to show a loader while simulating fund transfer submission
  const [isTransferring, setIsTransferring] = useState(false);

  const amount = 750000;

  // Mock conversion rates for different currencies
  const conversionRates: { [key: string]: number } = {
    USD: 1,
    EUR: 0.93,
    GBP: 0.79,
    JPY: 157.5,
    CHF: 0.9,
  };

  const convertedAmount = amount * conversionRates[currency];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  // This effect simulates the asynchronous nature of bank transfers.
  // When the user reaches step 3, it waits 5 seconds then automatically
  // moves to step 4, simulating the funds being verified.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 3) {
      addMockEvent({ user: 'System', action: `Scanning for incoming transfer matching BV-INV-007`, phase: 'Admin' });
      timer = setTimeout(() => {
        toast({ title: 'Funds Verified & Shares Allotted!', description: 'Transaction ID: MOCK_TX_8472981Z'});
        addMockEvent({ user: 'System', action: 'Verified funds, shares allotted for BV-INV-007.', phase: 'Admin' });
        setStep(4);
      }, 5000); // Simulate bank processing time
    }
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Handler for simulating the e-signature process
  const handleSign = () => {
    setIsSigning(true);
    toast({ title: 'Generating Secure E-Signature Session...' });
    addMockEvent({ user: 'Investor', action: 'Initiated Term Sheet E-Signature', phase: 'P1' });
    // Simulate API call and a potential random failure
    setTimeout(() => {
       if (Math.random() > 0.15) { // 85% success rate
        toast({ title: 'Term Sheet Signed Successfully' });
        addMockEvent({ user: 'Investor', action: 'Completed Term Sheet E-Signature', phase: 'P1' });
        setIsSigning(false);
        setStep(2);
      } else {
        toast({
          variant: "destructive",
          title: "E-Signature Failed",
          description: "A transient error occurred. Please try again.",
        });
        addMockEvent({ user: 'System', action: 'Failed E-Signature: validation error.', phase: 'Admin' });
        setIsSigning(false);
      }
    }, 2500);
  };
  
  // Handler for simulating the fund transfer submission
  const handleFundTransfer = () => {
    setIsTransferring(true);
    toast({ title: 'Broadcasting Secure Transfer Request...' });
    addMockEvent({ user: 'Investor', action: `Marked funds as sent for ${currency}`, phase: 'P1' });
    setTimeout(() => {
        setIsTransferring(false);
        setStep(3);
    }, 2000);
  }

  // Renders the content for the current step
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Card className="bg-card/50 border-dashed">
            <CardHeader>
                <CardTitle>Step 1: Review & E-Sign Term Sheet</CardTitle>
                <CardDescription>Please review the binding term sheet for your investment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/30">
                    <h4 className="font-semibold">Series A Term Sheet Summary</h4>
                    <p className="text-sm text-muted-foreground mt-2">This document outlines the terms for an investment of $750,000 USD in Baalvion for 150,000 Series A Preferred Shares, representing a 1.87% post-money valuation of $40M.</p>
                    <Button variant="link" className="p-0 h-auto mt-2">
                        View Full Term Sheet <ExternalLink className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
                <Button onClick={handleSign} className="w-full" disabled={isSigning}>
                    {isSigning ? <><Loader2 className="mr-2 animate-spin"/> Processing...</> : <><FileSignature className="mr-2"/> Agree & E-Sign Term Sheet</> }
                </Button>
            </CardContent>
        </Card>
        );
      case 2:
        return (
          <Card className="bg-card/50 border-dashed">
             <CardHeader>
                <CardTitle>Step 2: Wire Transfer Funds</CardTitle>
                <CardDescription>Use the information below to send funds from your financial institution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Label htmlFor="currency" className="whitespace-nowrap">Transfer Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(conversionRates).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="text-right flex-1">
                        <p className="text-muted-foreground">Amount to Wire</p>
                        <p className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount)}</p>
                    </div>
                </div>
                <Separator/>
                <div className="space-y-3 text-sm border p-4 rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center">
                        <div><span className="font-medium text-muted-foreground w-28 inline-block">Bank:</span> Goldman Sachs</div>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy("Goldman Sachs")}><Copy className="h-4 w-4"/></Button>
                    </div>
                     <div className="flex justify-between items-center">
                        <div><span className="font-medium text-muted-foreground w-28 inline-block">SWIFT/BIC:</span> GSCBUS33XXX</div>
                         <Button variant="ghost" size="icon" onClick={() => handleCopy("GSCBUS33XXX")}><Copy className="h-4 w-4"/></Button>
                    </div>
                     <div className="flex justify-between items-center">
                        <div><span className="font-medium text-muted-foreground w-28 inline-block">Account Number:</span> 4815162342</div>
                         <Button variant="ghost" size="icon" onClick={() => handleCopy("4815162342")}><Copy className="h-4 w-4"/></Button>
                    </div>
                     <div className="flex justify-between items-center">
                        <div><span className="font-medium text-muted-foreground w-28 inline-block">Reference:</span> BV-INV-007</div>
                         <Button variant="ghost" size="icon" onClick={() => handleCopy("BV-INV-007")}><Copy className="h-4 w-4"/></Button>
                    </div>
                </div>
                 <p className="text-xs text-muted-foreground">Note: Please ensure the reference code is included in your wire transfer. Transfers may take 3-5 business days to be confirmed.</p>
                 <Button onClick={handleFundTransfer} className="w-full" disabled={isTransferring}>
                     {isTransferring ? <><Loader2 className="mr-2 animate-spin"/>Submitting...</> : <><ArrowRight className="mr-2"/> I Have Sent The Funds</>}
                </Button>
            </CardContent>
        </Card>
        );
      case 3:
      case 4:
        return (
            <Card className="bg-card/50 border-dashed">
                <CardHeader>
                    <CardTitle>Step 3: Awaiting Confirmation</CardTitle>
                    <CardDescription>
                         {step === 3 ? "We are awaiting confirmation of your funds from our banking partners." : "Funds received and shares allotted."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/30">
                        <Banknote className="h-6 w-6 text-primary"/>
                        <div>
                            <p className="font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount)}</p>
                            <p className="text-sm text-muted-foreground">Status: {step === 3 ? 'Pending Confirmation' : 'Completed'}</p>
                        </div>
                   </div>
                   {step === 3 && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scanning for incoming transfers... This may take a moment.</span>
                    </div>
                   )}
                   {step === 4 && (
                       <div className="p-4 border rounded-md bg-green-900/50 text-green-400 border-green-500/50">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5"/>
                                <h4 className="font-semibold">Allotment Complete</h4>
                           </div>
                           <p className="text-sm text-green-400/80 mt-2">150,000 Series A shares have been credited to your account. Your cap table and dashboard have been updated.</p>
                       </div>
                   )}
                </CardContent>
            </Card>
        );
      default: return null;
    }
  }


  return (
    <div className="space-y-4 relative md:ml-8">
        <div className="absolute left-[-2rem] top-0 bottom-0 hidden md:flex flex-col justify-between items-center w-8">
            <div className="h-full w-px bg-border"></div>
            <div className="flex flex-col h-full justify-around py-4 absolute">
                {[1, 2, 3].map(s => (
                    <div key={s} className="flex items-center justify-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
                           {step > s ? <CheckCircle className="h-5 w-5"/> : s}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      {renderStepContent()}
    </div>
  );
}