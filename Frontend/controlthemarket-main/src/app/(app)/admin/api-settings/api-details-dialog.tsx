
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TestTube2, Save, Banknote, Loader2 } from 'lucide-react';
import type { ApiIntegration } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ApiDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  apiIntegration: ApiIntegration | null;
}

export function ApiDetailsDialog({ isOpen, onOpenChange, apiIntegration }: ApiDetailsDialogProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [simAmount, setSimAmount] = useState('29.99');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (apiIntegration) {
      setApiKey(apiIntegration.apiKey);
      setEndpointUrl(apiIntegration.endpointUrl);
    }
  }, [apiIntegration]);

  const handleTestConnection = () => {
    toast({
        title: 'Test Connection (Mock)',
        description: `Sending a test request to ${apiIntegration?.name}...`
    });
     setTimeout(() => {
        toast({ title: 'Test Successful', description: `Successfully received a 200 OK response from ${apiIntegration?.name}.` });
    }, 1500)
  }

  const handleSimulatePayment = () => {
    setIsSimulating(true);
    toast({
        title: "Payment Simulation",
        description: `Processing a mock payment of $${simAmount}...`
    });
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        toast({
            title: success ? 'Payment Successful' : 'Payment Failed',
            description: success ? `Successfully processed payment.` : `The payment was declined.`,
            variant: success ? 'default' : 'destructive',
        });
        setIsSimulating(false);
    }, 2000);
  }

  if (!apiIntegration) return null;
  
  const mockActivities = [
    { id: 1, message: 'Synced 1 new user', time: '2 hours ago' },
    { id: 2, message: 'Triggered by event: submission.evaluated', time: '3 hours ago' },
    { id: 3, message: 'Connection test successful', time: '5 hours ago' },
  ];

  const isPaymentGateway = apiIntegration.category === 'Payments';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Integration Settings: {apiIntegration.name}</DialogTitle>
          <DialogDescription>
            {apiIntegration.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 mt-4">
            <div className="space-y-2">
                <Label htmlFor="api-category">Category</Label>
                <Input id="api-category" value={apiIntegration.category} readOnly disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="api-key">API Key / Token</Label>
                <Input id="api-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="endpoint-url">Endpoint URL</Label>
                <Input id="endpoint-url" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
            </div>
             <div>
                <h4 className="font-medium mb-2">Subscribed Events</h4>
                <div className="flex flex-wrap gap-2">
                     {apiIntegration.subscribedEvents.length > 0 ? apiIntegration.subscribedEvents.map(event => <Badge key={event} variant="secondary">{event}</Badge>) : <span className="text-sm text-muted-foreground">No events subscribed.</span>}
                </div>
            </div>
            {isPaymentGateway && (
              <div>
                  <h4 className="font-medium mb-2">Payment Simulation (Mock)</h4>
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="sim-amount">Amount</Label>
                            <Input id="sim-amount" type="number" value={simAmount} onChange={e => setSimAmount(e.target.value)} placeholder="29.99" />
                        </div>
                        <Button onClick={handleSimulatePayment} disabled={isSimulating}>
                           {isSimulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                            Pay Now
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">This is a mock panel to simulate making a payment through this gateway.</p>
                  </div>
              </div>
            )}
             <div>
                 <h4 className="font-medium mb-2">Recent Activity (Mock)</h4>
                <div className="rounded-md border p-4 text-sm text-muted-foreground space-y-2">
                    {mockActivities.map(activity => (
                        <p key={activity.id}><span className="font-semibold text-foreground">{activity.message}</span> - <span className="text-xs">{activity.time}</span></p>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleTestConnection}><TestTube2 className="mr-2 h-4 w-4" /> Test Connection</Button>
            <Button><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
