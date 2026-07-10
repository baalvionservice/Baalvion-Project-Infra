'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateFreightQuote, CreateQuoteBody } from '@/api';
import { FreightNavTabs } from '../../_components/freight-nav-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Route & Cargo', 'Shipping Details', 'Review'];

const TRANSPORT_MODES: { value: NonNullable<CreateQuoteBody['transportMode']>; label: string }[] = [
  { value: 'ocean', label: 'Ocean' },
  { value: 'air', label: 'Air' },
  { value: 'rail', label: 'Rail' },
  { value: 'road', label: 'Road / Truck' },
  { value: 'express', label: 'Courier / Express' },
  { value: 'multimodal', label: 'Multimodal' },
];

interface FormState {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  cargoType: string;
  commodity: string;
  hsCode: string;
  hazardous: boolean;
  containerType: string;
  quantity: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  incoterm: string;
  transportMode: NonNullable<CreateQuoteBody['transportMode']>;
  deliverySpeed: 'economy' | 'standard' | 'express';
  insuranceRequested: boolean;
  declaredValue: string;
  currency: string;
  expectedPickup: string;
  expectedDelivery: string;
}

const initialState = (mode: string | null): FormState => ({
  originCountry: '', originCity: '', destinationCountry: '', destinationCity: '',
  cargoType: '', commodity: '', hsCode: '', hazardous: false, containerType: '',
  quantity: '1', weightKg: '', lengthCm: '', widthCm: '', heightCm: '',
  incoterm: 'FOB', transportMode: (mode as FormState['transportMode']) || 'ocean',
  deliverySpeed: 'standard', insuranceRequested: false, declaredValue: '', currency: 'USD',
  expectedPickup: '', expectedDelivery: '',
});

export default function NewFreightQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialState(searchParams.get('mode')));
  const { toast } = useToast();
  const createQuote = useCreateFreightQuote();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const canProceedStep0 = form.originCountry.trim().length > 0 && form.destinationCountry.trim().length > 0 && Number(form.weightKg) > 0;

  const handleSubmit = async () => {
    const body: CreateQuoteBody = {
      origin: { country: form.originCountry, city: form.originCity || undefined },
      destination: { country: form.destinationCountry, city: form.destinationCity || undefined },
      cargoType: form.cargoType || undefined,
      commodity: form.commodity || undefined,
      hsCode: form.hsCode || undefined,
      hazardous: form.hazardous,
      containerType: form.containerType || undefined,
      pieces: [{
        quantity: Number(form.quantity) || 1,
        weightKg: Number(form.weightKg) || 0,
        lengthCm: Number(form.lengthCm) || 0,
        widthCm: Number(form.widthCm) || 0,
        heightCm: Number(form.heightCm) || 0,
      }],
      incoterm: form.incoterm || undefined,
      transportMode: form.transportMode,
      deliverySpeed: form.deliverySpeed,
      insuranceRequested: form.insuranceRequested,
      declaredValue: Number(form.declaredValue) || 0,
      currency: form.currency,
      expectedPickup: form.expectedPickup || undefined,
      expectedDelivery: form.expectedDelivery || undefined,
    };
    try {
      const quote = await createQuote.mutateAsync(body);
      toast({ title: 'Quote request submitted', description: `${quote.items?.length ?? 0} carrier option(s) returned.` });
      router.push(`/logistics-shipment/freight/quotes/${quote.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Quote request failed', description: e instanceof Error ? e.message : 'Unexpected error.' });
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Freight Quote</h1>
        <p className="text-sm text-muted-foreground">Fans out across every active carrier in the directory with a full charge breakdown.</p>
      </div>

      <FreightNavTabs />

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2', step >= i ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-muted-foreground/20 text-muted-foreground')}>
              {i + 1}
            </div>
            <span className={cn('text-xs font-medium', step >= i ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route & Cargo</CardTitle>
            <CardDescription>Where is this shipment moving, and what is it?</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Origin Country *</Label><Input value={form.originCountry} onChange={(e) => update('originCountry', e.target.value.toUpperCase())} placeholder="CN" maxLength={2} /></div>
            <div className="space-y-2"><Label>Origin City</Label><Input value={form.originCity} onChange={(e) => update('originCity', e.target.value)} placeholder="Shanghai" /></div>
            <div className="space-y-2"><Label>Destination Country *</Label><Input value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value.toUpperCase())} placeholder="US" maxLength={2} /></div>
            <div className="space-y-2"><Label>Destination City</Label><Input value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} placeholder="Los Angeles" /></div>
            <div className="space-y-2"><Label>Cargo Type</Label><Input value={form.cargoType} onChange={(e) => update('cargoType', e.target.value)} placeholder="General Cargo" /></div>
            <div className="space-y-2"><Label>Commodity</Label><Input value={form.commodity} onChange={(e) => update('commodity', e.target.value)} placeholder="Electronics" /></div>
            <div className="space-y-2"><Label>HS Code</Label><Input value={form.hsCode} onChange={(e) => update('hsCode', e.target.value)} placeholder="8517.12" /></div>
            <div className="space-y-2"><Label>Container Type</Label><Input value={form.containerType} onChange={(e) => update('containerType', e.target.value)} placeholder="40ft, pallet, box…" /></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => update('quantity', e.target.value)} /></div>
            <div className="space-y-2"><Label>Weight (kg) *</Label><Input type="number" min={0} value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} /></div>
            <div className="space-y-2"><Label>Length (cm)</Label><Input type="number" min={0} value={form.lengthCm} onChange={(e) => update('lengthCm', e.target.value)} /></div>
            <div className="space-y-2"><Label>Width (cm)</Label><Input type="number" min={0} value={form.widthCm} onChange={(e) => update('widthCm', e.target.value)} /></div>
            <div className="space-y-2"><Label>Height (cm)</Label><Input type="number" min={0} value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={form.hazardous} onCheckedChange={(v) => update('hazardous', v)} /><Label>Hazardous / Dangerous Goods</Label></div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setStep(1)} disabled={!canProceedStep0}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
            <CardDescription>Mode, terms, timing and value.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transport Mode</Label>
              <Select value={form.transportMode} onValueChange={(v) => update('transportMode', v as FormState['transportMode'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSPORT_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Incoterm</Label>
              <Select value={form.incoterm} onValueChange={(v) => update('incoterm', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['EXW', 'FOB', 'CIF', 'DAP', 'DDP', 'FCA'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Delivery Speed</Label>
              <Select value={form.deliverySpeed} onValueChange={(v) => update('deliverySpeed', v as FormState['deliverySpeed'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Declared Value</Label><Input type="number" min={0} value={form.declaredValue} onChange={(e) => update('declaredValue', e.target.value)} /></div>
            <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} maxLength={3} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={form.insuranceRequested} onCheckedChange={(v) => update('insuranceRequested', v)} /><Label>Request Cargo Insurance</Label></div>
            <div className="space-y-2"><Label>Expected Pickup</Label><Input type="date" value={form.expectedPickup} onChange={(e) => update('expectedPickup', e.target.value)} /></div>
            <div className="space-y-2"><Label>Expected Delivery</Label><Input type="date" value={form.expectedDelivery} onChange={(e) => update('expectedDelivery', e.target.value)} /></div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={() => setStep(2)}>Review <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>Confirm the request before fanning out to the carrier directory.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Route</span><p className="font-bold">{form.originCountry} {form.originCity && `(${form.originCity})`} → {form.destinationCountry} {form.destinationCity && `(${form.destinationCity})`}</p></div>
            <div><span className="text-muted-foreground">Mode</span><p className="font-bold capitalize">{form.transportMode}</p></div>
            <div><span className="text-muted-foreground">Weight</span><p className="font-bold">{form.quantity}× {form.weightKg || 0} kg</p></div>
            <div><span className="text-muted-foreground">Incoterm</span><p className="font-bold">{form.incoterm}</p></div>
            <div><span className="text-muted-foreground">Insurance</span><p className="font-bold">{form.insuranceRequested ? 'Requested' : 'Not requested'}</p></div>
            <div><span className="text-muted-foreground">Declared Value</span><p className="font-bold">{form.currency} {form.declaredValue || 0}</p></div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={handleSubmit} disabled={createQuote.isPending}>
              {createQuote.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Submit Quote Request
            </Button>
          </CardFooter>
        </Card>
      )}
    </main>
  );
}
