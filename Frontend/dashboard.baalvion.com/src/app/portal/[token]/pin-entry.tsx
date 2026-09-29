
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { PortalConfig } from './page';

interface PinEntryProps {
  portal: PortalConfig;
  onSuccess: () => void;
}

export default function PinEntry({ portal, onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (pin === portal.pin) {
        onSuccess();
      } else {
        setError('Invalid PIN. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Incorrect PIN',
          description: 'The PIN you entered is incorrect.',
        });
      }
      setLoading(false);
    }, 500);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>Investor Portal Access</CardTitle>
        <CardDescription>Please enter the PIN to view the portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
            className="text-center text-2xl tracking-[1em]"
            maxLength={4}
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            View Portfolio
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
