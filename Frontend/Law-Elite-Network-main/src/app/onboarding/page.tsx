
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, User, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { LawyerRegistrationWizard } from '@/components/onboarding/LawyerRegistrationWizard';

/**
 * @fileOverview OnboardingPage
 * Tailors the initial professional identity setup.
 * Updated with Role-Based Redirection.
 */
export default function OnboardingPage() {
  const { user, role, loading } = useAuthContext();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [roleId, setRoleId] = useState<'lawyer' | 'client' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    experienceYears: '',
    city: '',
    countryCode: 'US',
    hourlyRate: '',
    contactDetails: ''
  });
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user && !formData.fullName) setFormData(prev => ({ ...prev, fullName: user.name || '' }));
  }, [user, role, loading, router, formData.fullName]);

  const handleRoleSelect = (selectedRole: 'lawyer' | 'client') => {
    setRoleId(selectedRole);
    setStep('details');
  };

  // Client-only now — the lawyer path is the full multi-step
  // LawyerRegistrationWizard (Location -> Personal -> Professional ->
  // Verification -> Subscription), which manages its own submission.
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await apiClient.post('/clients', {
        name: formData.fullName,
        phone: formData.contactDetails,
        location: formData.city,
      }).catch(() => { /* already exists — fine */ });
      toast({ title: 'Welcome Aboard', description: 'Your profile is ready.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: 'Onboarding Error', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
        {step === 'role' && (
          <div className="w-full max-w-2xl">
            <header className="text-center mb-8">
              <h1 className="font-headline text-4xl mb-2 text-white">Finalizing Your Presence</h1>
              <p className="text-muted-foreground italic">Tailoring the Law Elite Network to your professional status.</p>
            </header>
            <Card className="glass-panel border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Professional Designation</CardTitle>
                <CardDescription>Select your core identity within the legal ecosystem.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                  <RoleCard
                    icon={<Gavel className="w-8 h-8" />}
                    title="Legal Practitioner"
                    desc="Attorneys, Counsel, and Consultants."
                    onClick={() => handleRoleSelect('lawyer')}
                  />
                  <RoleCard
                    icon={<User className="w-8 h-8" />}
                    title="Premier Client"
                    desc="Corporations and Private Estates."
                    onClick={() => handleRoleSelect('client')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'details' && roleId === 'lawyer' && (
          <LawyerRegistrationWizard email={user?.email} />
        )}

        {step === 'details' && roleId === 'client' && (
          <div className="w-full max-w-2xl">
            <header className="text-center mb-8">
              <h1 className="font-headline text-4xl mb-2 text-white">Finalizing Your Presence</h1>
              <p className="text-muted-foreground italic">Tailoring the Law Elite Network to your professional status.</p>
            </header>
            <Card className="glass-panel border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Credential Dossier</CardTitle>
                <CardDescription>Please provide required data for your client profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClientSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-white">Full Name</Label>
                    <Input
                      className="glass-panel border-white/10 text-white"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Contact Details / Preference</Label>
                    <Input
                      placeholder="Phone or Alternative Email"
                      className="glass-panel border-white/10 text-white"
                      value={formData.contactDetails}
                      onChange={e => setFormData({ ...formData, contactDetails: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Preferred Jurisdiction</Label>
                    <Input
                      className="glass-panel border-white/10 text-white"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={() => setStep('role')} className="text-muted-foreground hover:text-white">
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {submitting ? "Finalizing..." : "Initialize Profile"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="group p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-accent hover:bg-accent/5 transition-all text-left flex flex-col gap-4 executive-card">
      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all">
        {icon}
      </div>
      <div>
        <h3 className="font-headline text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-auto pt-4 flex items-center text-accent text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Select Profile Type <ChevronRight className="ml-1 w-3 h-3" />
      </div>
    </button>
  );
}
