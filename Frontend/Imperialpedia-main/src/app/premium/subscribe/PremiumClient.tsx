'use client';

import React, { useState } from 'react';
import { SubscriptionTier, PremiumState } from '@/types/premium';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  CreditCard,
  Loader2,
  Lock,
  Info,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PremiumClientProps {
  data: PremiumState;
}

/**
 * Interactive Premium Subscription Hub.
 * Features tier comparison, monthly/yearly toggles, and a mock Stripe checkout flow.
 * Refined for Prompt 40.
 */
export function PremiumClient({ data }: PremiumClientProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTierSelect = (tier: SubscriptionTier) => {
    if (tier.id === data.activeTier) return;
    setSelectedTier(tier);
    setIsCheckoutOpen(true);
    setIsSuccess(false);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment gateway handshake
    await new Promise(r => setTimeout(r, 2000));
    
    setIsProcessing(false);
    setIsSuccess(true);
    
    toast({
      title: "Subscription Activated",
      description: `Welcome to the ${selectedTier?.name} intelligence tier!`,
    });

    // Close modal after showing success state
    setTimeout(() => {
      setIsCheckoutOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Header & Toggle */}
      <header className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <Zap className="h-4 w-4" />
          <Text variant="label" className="text-[10px] font-bold uppercase tracking-widest">Premium Intelligence</Text>
        </div>
        <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Unlock the Full Index</Text>
        <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
          Scale your research with advanced AI tools, real-time portfolio oversight, and exclusive expert intelligence nodes.
        </Text>

        <div className="flex items-center justify-center gap-4 pt-8">
          <Label className={cn("text-sm font-bold", billingCycle === 'monthly' ? "text-foreground" : "text-muted-foreground")}>Monthly</Label>
          <Switch 
            checked={billingCycle === 'yearly'} 
            onCheckedChange={(val) => setBillingCycle(val ? 'yearly' : 'monthly')} 
            className="scale-125"
          />
          <div className="flex items-center gap-2">
            <Label className={cn("text-sm font-bold", billingCycle === 'yearly' ? "text-foreground" : "text-muted-foreground")}>Yearly</Label>
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">SAVE 20%</Badge>
          </div>
        </div>
      </header>

      {/* Pricing Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {data.tiers.map((tier) => {
          const isActive = tier.id === data.activeTier;
          const price = billingCycle === 'monthly' ? tier.priceMonthly : tier.priceYearly;

          return (
            <Card 
              key={tier.id} 
              className={cn(
                "glass-card flex flex-col h-full border-none relative overflow-hidden transition-all duration-500",
                tier.isPopular ? "ring-2 ring-primary/40 shadow-2xl md:scale-105 z-10" : "opacity-90 hover:opacity-100"
              )}
            >
              {tier.isPopular && (
                <div className="bg-primary text-white text-[9px] font-bold uppercase tracking-widest text-center py-1 absolute top-0 left-0 w-full">
                  Recommended Choice
                </div>
              )}
              
              <CardHeader className={cn("p-8", tier.isPopular ? "pt-10" : "")}>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-sm mt-2">{tier.description}</CardDescription>
                <div className="pt-6">
                  <span className="text-5xl font-bold tracking-tighter">{price}</span>
                  <span className="text-muted-foreground ml-2">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 flex-grow">
                <div className="space-y-4">
                  <Text variant="label" className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Included Capabilities</Text>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex gap-3 items-start group">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <Text variant="caption" className="text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                          {feature}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button 
                  disabled={isActive}
                  onClick={() => handleTierSelect(tier)}
                  className={cn(
                    "w-full h-12 rounded-xl font-bold transition-all",
                    isActive ? "bg-muted text-muted-foreground" : 
                    tier.isPopular ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" : "variant-outline"
                  )}
                >
                  {isActive ? 'Current Active Node' : `Upgrade to ${tier.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Subscription Content Access Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card border-none bg-background/30 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
            <Lock className="h-24 w-24 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-muted text-muted-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <Text variant="h4" className="font-bold">Institutional Reports</Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
            Deep-dive audits from verified analysts are restricted to **Pro** and **Enterprise** nodes. Unlock access to view the latest sector rotations.
          </Text>
          <Button variant="link" className="p-0 h-auto w-fit text-primary font-bold text-xs" asChild>
            <button onClick={() => handleTierSelect(data.tiers.find(t => t.id === 'tier-pro')!)}>
              Explore Premium Library <ArrowRight className="ml-1.5 h-3 w-3" />
            </button>
          </Button>
        </Card>

        <Card className="glass-card border-none bg-primary/5 p-8 flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <Text variant="h4" className="font-bold">AI Analyst Suite</Text>
          </div>
          <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">
            Unlimited execution of Bull/Bear case generation and catalyst detection scanners. Real-time data synthesis across 1M+ nodes.
          </Text>
          <Button variant="link" className="p-0 h-auto w-fit text-primary font-bold text-xs" asChild>
            <button onClick={() => handleTierSelect(data.tiers.find(t => t.id === 'tier-pro')!)}>
              Launch Analyst Suite <ArrowRight className="ml-1.5 h-3 w-3" />
            </button>
          </Button>
        </Card>
      </div>

      {/* Mock Stripe Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg bg-card border-white/10 p-0 overflow-hidden shadow-2xl">
          {isSuccess ? (
            <div className="p-16 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <Text variant="h2" className="text-3xl font-bold">Payment Successful</Text>
                <Text variant="bodySmall" className="text-muted-foreground">
                  Your {selectedTier?.name} subscription has been activated. Redirecting to your premium dashboard...
                </Text>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckout}>
              <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest px-3 h-6">
                    Payment Gateway
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase">SSL Secured</span>
                  </div>
                </div>
                <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" /> 
                  Subscribe to {selectedTier?.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-2">
                  Complete your secure handshake to unlock Pro Intelligence.
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center p-5 rounded-2xl bg-background/50 border border-white/5 shadow-inner">
                  <div className="space-y-1">
                    <Text variant="bodySmall" weight="bold">{selectedTier?.name} Plan ({billingCycle})</Text>
                    <Text variant="caption" className="text-muted-foreground">Automatic renewal on {format(new Date(), 'MMM d, yyyy')}</Text>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {billingCycle === 'monthly' ? selectedTier?.priceMonthly : selectedTier?.priceYearly}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Cardholder Identity</Label>
                    <Input placeholder="Enter full name as printed on card" className="bg-background/50 h-12 border-white/5 rounded-xl font-medium" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Card Data Matrix</Label>
                    <div className="relative group">
                      <Input placeholder="•••• •••• •••• ••••" className="bg-background/50 h-12 pl-12 font-mono border-white/5 rounded-xl group-focus-within:border-primary/40 transition-all" required />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Expiry</Label>
                      <Input placeholder="MM / YY" className="bg-background/50 h-12 border-white/5 rounded-xl text-center font-mono" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">CVC</Label>
                      <Input placeholder="•••" className="bg-background/50 h-12 border-white/5 rounded-xl text-center font-mono" required />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-muted/20 border border-white/5">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <Text variant="caption" className="text-muted-foreground leading-relaxed italic">
                    This is a non-functional mock interface for testing. No real transaction will occur. Your financial data is not stored.
                  </Text>
                </div>
              </div>

              <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCheckoutOpen(false)} className="h-12 px-8 rounded-xl font-bold">Discard</Button>
                <Button type="submit" disabled={isProcessing} className="h-12 flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-105 active:scale-95">
                  {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Authenticate & Subscribe'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-16 border-t border-white/5 text-center">
        {[
          { icon: <Lock className="h-8 w-8 text-primary mx-auto" />, title: "Secure Handshake", desc: "Enterprise-grade 256-bit encryption for all identity nodes." },
          { icon: <ShieldCheck className="h-8 w-8 text-secondary mx-auto" />, title: "Verified Vetting", desc: "Subscribing supports our institutional expert audit cycles." },
          { icon: <Globe className="h-8 w-8 text-emerald-500 mx-auto" />, title: "Global Settlement", desc: "Supporting 135+ currencies across 50 international nodes." }
        ].map((item, idx) => (
          <div key={idx} className="space-y-4 p-8 rounded-[2.5rem] bg-card/30 border border-white/5 hover:border-primary/20 transition-all group">
            <div className="mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
            <Text variant="body" weight="bold" className="block text-lg">{item.title}</Text>
            <Text variant="bodySmall" className="text-muted-foreground leading-relaxed">{item.desc}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
