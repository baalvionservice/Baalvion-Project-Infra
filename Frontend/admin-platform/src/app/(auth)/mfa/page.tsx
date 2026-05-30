'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';

const mfaSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type MfaForm = z.infer<typeof mfaSchema>;

function MfaForm() {
  const params = useSearchParams();
  const tempToken = params.get('token') ?? '';
  const { verifyMfa, isVerifyingMfa } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaForm>({ resolver: zodResolver(mfaSchema) });

  const onSubmit = ({ code }: MfaForm) => {
    verifyMfa({ code, tempToken });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive text-center">{errors.code.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isVerifyingMfa || !tempToken}>
            {isVerifyingMfa ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// useSearchParams() must sit under a Suspense boundary for the production build.
export default function MfaPage() {
  return (
    <Suspense fallback={null}>
      <MfaForm />
    </Suspense>
  );
}
