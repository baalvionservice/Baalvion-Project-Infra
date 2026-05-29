'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth';

/**
 * RegisterPage: Replicated "Create An Account" Portal.
 * Designed to match the provided Madison Avenue Couture reference image.
 */
export default function RegisterPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await authClient.register(formData.email, formData.password, fullName || undefined);
      router.push(`/${countryCode}/account`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-body text-gray-900 pb-32 animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="container mx-auto px-6 pt-12 max-w-6xl flex items-center space-x-2 text-[11px] font-normal text-gray-500 mb-8">
        <Link href={`/${countryCode}`} className="hover:text-black transition-colors">Home</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-gray-900">Create Account</span>
      </nav>

      <main className="container mx-auto px-6 max-w-6xl">
        {/* Main Heading */}
        <h1 className="text-5xl font-headline font-medium text-gray-900 mb-16 tracking-tight">
          Create An Account
        </h1>

        {/* Content Container */}
        <div className="w-full max-w-[450px] space-y-10">
          <div className="space-y-4">
            <p className="text-[13px] text-gray-500 font-light italic leading-relaxed">
              Sign up for a free account at Amarisé Maison Avenue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">First Name</Label>
                <Input 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">Last Name</Label>
                <Input 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                  Your Email Address <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold tracking-widest text-gray-900 uppercase">
                  Your Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="h-12 rounded-none border-gray-200 bg-white text-sm font-light focus:ring-0 focus:border-black transition-all"
                  required
                />
              </div>
            </div>
            
            {error && (
              <p className="text-[12px] font-medium text-red-600" role="alert">{error}</p>
            )}

            <Button
              type="submit"
              variant="outline"
              disabled={submitting}
              className="w-full max-w-[240px] h-12 border-black text-black hover:bg-black hover:text-white rounded-none text-[10px] font-bold tracking-[0.25em] uppercase transition-all shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Creating…' : 'CREATE AN ACCOUNT'}
            </Button>
          </form>

          <p className="text-[11px] text-gray-500 font-light italic">
            Already have an account?{' '}
            <Link href={`/${countryCode}/account/login`} className="text-black underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
