
'use client';

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
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Save, Landmark } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock SVG icons for payment providers
const GooglePayLogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto"><title>Google Pay</title><path d="M19.396 9.424a4.34 4.34 0 00-3.23-3.229 4.342 4.342 0 00-5.336 2.052H9.404v1.892h1.424a2.59 2.59 0 010 2.585H9.404v1.89h1.424a4.342 4.342 0 005.336 2.053 4.34 4.34 0 003.23-3.23 4.342 4.342 0 00-1.173-4.013zm-3.327 4.542a2.593 2.593 0 01-2.585 2.585 2.593 2.593 0 01-2.585-2.585 2.593 2.593 0 012.585-2.585 2.593 2.593 0 012.585 2.585zM0 12c0 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0 0 5.373 0 12z"/></svg>;
const ApplePayLogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto"><title>Apple Pay</title><path d="M10.221 21.843c.962 0 1.83-.34 2.701-1.018.84-.678 1.488-1.573 1.944-2.684H9.601c-1.89 0-3.465-1.543-3.465-3.615 0-2.071 1.543-3.615 3.528-3.615h5.264c.254 0 .508.031.793.094a6.762 6.762 0 00.931 3.522c-.686.494-1.373 1.019-2.091 1.573-.962.678-1.83 1.018-2.701 1.018-.19 0-.349-.03-.477-.094-.654-.314-1.119-.69-1.39-1.121-.24-.432-.361-.864-.361-1.296 0-.588.24-1.12.72-1.572.75-.678 1.77-1.018 3.06-1.018H17.4v-2.04c0-.646-.226-1.198-.68-1.655-.453-.458-1.045-.688-1.77-.688-.813 0-1.563.314-2.25.941-.688.627-1.096 1.41-1.228 2.348h-2.184c.128-1.511.734-2.83 1.821-3.957C12.14 1.453 13.565.88 15.317.88c.844 0 1.625.174 2.344.523.719.349 1.312.82 1.781 1.412.062-.03.125-.045.187-.045.5 0 .844.158.906.477.063.318 0 .62-.187.904-.094.158-.22.285-.376.379-.156.095-.312.142-.468.142-.25 0-.532-.078-.782-.236a5.2 5.2 0 00-1.28-1.38c-.562-.438-1.187-.656-1.875-.656-1.312 0-2.344.522-3.093 1.567-.75.95-.938 1.99-.938 3.122h9.125c.188 0 .281.094.281.281 0 .188-.094.281-.281.281H9.951c-1.375 0-2.438.375-3.188 1.125-.75.75-.875 1.75-.875 3.062 0 2.25.938 3.969 2.812 5.157z"/></svg>;
const PayULogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto"><title>PayU</title><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-2.305 18.358c-1.18 0-1.921-.304-2.222-.914l-.061-.152c-.426-1.18-.03-2.616.852-3.348 1.096-.913 2.843-1.034 4.078-.73l.366.091.06.031c.366.183.61.396.73.61.274.549.183.943-.304 1.309l-.152.122c-.67.487-1.37.73-2.1.73l-.213-.03zm4.565-.243c-1.18 0-1.921-.304-2.222-.914l-.061-.152c-.426-1.18-.03-2.616.852-3.348 1.096-.913 2.843-1.034 4.078-.73l.366.091.06.031c.366.183.61.396.73.61.274.549.183.943-.304 1.309l-.152.122c-.67.487-1.37.73-2.1.73l-.213-.03zM15.358 10.32c-.396.67-.791 1.278-1.217 1.826-.943 1.217-1.735 2.191-2.374 2.921a.36.36 0 01-.548.06l-1.948-2.008a.36.36 0 01.06-.548l1.704-1.248c.304-.213.578-.183.852.06.822.73 1.614 1.49 2.374 2.282.426.456.822.882 1.217 1.278.366.425.64.67.852.73.274.06.426-.06.456-.304V6.52c0-.274.152-.426.426-.426h1.217c.274 0 .426.152.426.426v7.365c0 .73-.396 1.4-1.156 2.008a2.53 2.53 0 01-1.704.76c-.974 0-1.796-.456-2.465-1.369a19.9 19.9 0 01-2.738-3.41z"/></svg>;
const RazorpayLogo = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto"><title>Razorpay</title><path d="M22.585 16.924h-5.253L19.018 7.08h5.253L22.585 9.06h-3.567l-1.026 4.908h3.567zm-11.43 0h5.253l1.684-9.844h-5.253zm-9.843 0h5.253L8.25 7.08h5.253L11.817 0H1.414z"/></svg>;

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PaymentMethodDialog({ isOpen, onOpenChange }: PaymentMethodDialogProps) {
    const { toast } = useToast();
    const [cardNumber, setCardNumber] = useState('**** **** **** 1234');
    const [expiry, setExpiry] = useState('12/26');
    const [cvc, setCvc] = useState('***');
    
    // In a real app, this would be determined by user's location
    const [region, setRegion] = useState('US'); 

    const handleSaveChanges = () => {
        toast({
            title: "Payment Method Updated",
            description: "Your new payment method has been saved."
        });
        onOpenChange(false);
    }
    
    const handleDigitalWalletPayment = (wallet: string) => {
        toast({
            title: `Connecting to ${wallet}...`,
            description: "This is a mock action. In a real app, this would open the payment provider's interface."
        });
        onOpenChange(false);
    }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card">Card</TabsTrigger>
                <TabsTrigger value="wallet">Digital Wallet</TabsTrigger>
                <TabsTrigger value="bank">Bank</TabsTrigger>
            </TabsList>
            <TabsContent value="card">
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="card-number" placeholder="**** **** **** ****" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry-date">Expiry Date</Label>
                            <Input id="expiry-date" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" value={cvc} onChange={e => setCvc(e.target.value)} />
                        </div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges}>
                        <Save className="mr-2 h-4 w-4" /> Save Card
                    </Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="wallet">
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">Pay with your preferred digital wallet.</p>
                    <Button className="w-full h-12" variant="outline" onClick={() => handleDigitalWalletPayment('Google Pay')}>
                        <GooglePayLogo />
                    </Button>
                     <Button className="w-full h-12" variant="outline" onClick={() => handleDigitalWalletPayment('Apple Pay')}>
                        <ApplePayLogo />
                    </Button>
                    {region === 'IN' && (
                         <Button className="w-full h-12" variant="outline" onClick={() => handleDigitalWalletPayment('Razorpay')}>
                            <RazorpayLogo />
                        </Button>
                    )}
                </div>
            </TabsContent>
             <TabsContent value="bank">
                 <div className="space-y-4 py-4">
                     <p className="text-sm text-muted-foreground">Connect your bank account to make payments.</p>
                      {region === 'US' ? (
                        <Button className="w-full h-12" variant="outline" onClick={() => handleDigitalWalletPayment('ACH Transfer')}>
                            <Landmark className="mr-2" /> Pay with ACH Transfer
                        </Button>
                      ) : (
                         <Button className="w-full h-12" variant="outline" onClick={() => handleDigitalWalletPayment('PayU')}>
                             <PayULogo />
                         </Button>
                      )}
                 </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
