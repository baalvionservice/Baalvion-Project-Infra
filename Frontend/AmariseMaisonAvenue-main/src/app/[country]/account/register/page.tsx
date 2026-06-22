'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth';
import { startOAuthLogin, oauthErrorMessage } from '@/lib/oauth';

/**
 * RegisterPage: Replicated "Create An Account" Portal.
 * Designed to match the provided Madison Avenue Couture reference image.
 */
export default function RegisterPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only follow a same-site relative path (no open-redirect to //evil.com).
  const redirectParam = searchParams.get('redirect');
  const safeRedirect =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : `/${countryCode}/account`;

  // Social login returns HERE (a public route, so no double session-bootstrap):
  //   ?oauth=ok        → the refresh cookie is set; forward into the member area
  //   ?oauth_error=... → show the reason on the form
  const registerPath = `/${countryCode}/account/register`;
  const oauthReturnTo = redirectParam ? `${registerPath}?redirect=${encodeURIComponent(redirectParam)}` : registerPath;

  useEffect(() => {
    if (searchParams.get('oauth') === 'ok') router.replace(safeRedirect);
  }, [searchParams, router, safeRedirect]);

  useEffect(() => {
    const code = searchParams.get('oauth_error');
    if (code) setError(oauthErrorMessage(code));
  }, [searchParams]);

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

          {/* Social login */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">Or continue with</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => startOAuthLogin('google', oauthReturnTo)}
                aria-label="Continue with Google"
                className="h-12 rounded-none border-gray-200 text-gray-700 hover:border-black hover:text-black text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => startOAuthLogin('facebook', oauthReturnTo)}
                aria-label="Continue with Facebook"
                className="h-12 rounded-none border-gray-200 text-gray-700 hover:border-black hover:text-black text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 font-light italic">
            Already have an account?{' '}
            <Link href={`/${countryCode}/account/login`} className="text-black underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
