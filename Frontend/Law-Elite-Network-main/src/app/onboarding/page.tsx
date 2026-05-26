
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, User, Briefcase, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview OnboardingPage
 * Tailors the initial professional identity setup.
 * Updated with Role-Based Redirection.
 */
export default function OnboardingPage() {
  const { user, role, profileStatus, userController, loading } = useAuthContext();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [roleId, setRoleId] = useState<'lawyer' | 'client' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    experienceYears: '',
    city: 'New York',
    contactDetails: ''
  });
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && profileStatus === 'active') {
      // Role-specific redirect
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'lawyer') router.push('/lawyer/dashboard');
      else router.push('/dashboard');
    }
    if (user && !formData.fullName) setFormData(prev => ({ ...prev, fullName: user.name || '' }));
  }, [user, role, profileStatus, loading, router, formData.fullName]);

  const handleRoleSelect = (selectedRole: 'lawyer' | 'client') => {
    setRoleId(selectedRole);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roleId || !userController) return;

    setSubmitting(true);
    try {
      const profilePayload = roleId === 'lawyer' ? {
        fullName: formData.fullName,
        specialization: formData.specialization.split(',').map(s => s.trim()),
        experienceYears: parseInt(formData.experienceYears),
        location: { city: formData.city, state: 'NY', country: 'USA' },
        rating: 5.0,
        totalCasesHandled: 0,
        profileStatus: 'active'
      } : {
        fullName: formData.fullName,
        contactDetails: formData.contactDetails,
        caseType: 'General',
        preferredLocation: formData.city,
        profileStatus: 'active'
      };

      const response = await userController.completeOnboarding({
        userId: user.userId,
        roleId,
        profileData: profilePayload
      });

      if (response.success) {
        toast({ title: "Welcome Aboard", description: "Your elite profile is now active." });
        // Redirect based on the role just selected
        if (roleId === 'lawyer') router.push('/lawyer/dashboard');
        else router.push('/dashboard');
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({ title: "Onboarding Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <header className="text-center mb-8">
            <h1 className="font-headline text-4xl mb-2 text-white">Finalizing Your Presence</h1>
            <p className="text-muted-foreground italic">Tailoring the Law Elite Network to your professional status.</p>
          </header>

          <Card className="glass-panel border-white/10 shadow-2xl">
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <span className={`h-1 flex-1 rounded-full ${step === 'role' || step === 'details' ? 'bg-accent' : 'bg-white/10'}`} />
                <span className="mx-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification Process</span>
                <span className={`h-1 flex-1 rounded-full ${step === 'details' ? 'bg-accent' : 'bg-white/10'}`} />
              </div>
              <CardTitle className="text-white">{step === 'role' ? 'Professional Designation' : 'Credential Dossier'}</CardTitle>
              <CardDescription>
                {step === 'role' 
                  ? 'Select your core identity within the legal ecosystem.' 
                  : `Please provide required data for your ${roleId} profile.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'role' ? (
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
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-white">Full Professional Name</Label>
                    <Input 
                      className="glass-panel border-white/10 text-white" 
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                  </div>

                  {roleId === 'lawyer' ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">Specializations (comma separated)</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Corporate, Criminal, IP" 
                            className="pl-10 glass-panel border-white/10 text-white" 
                            value={formData.specialization}
                            onChange={e => setFormData({...formData, specialization: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Years of Experience</Label>
                          <Input 
                            type="number" 
                            className="glass-panel border-white/10 text-white" 
                            value={formData.experienceYears}
                            onChange={e => setFormData({...formData, experienceYears: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">City of Practice</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              className="pl-10 glass-panel border-white/10 text-white" 
                              value={formData.city}
                              onChange={e => setFormData({...formData, city: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">Contact Details / Preference</Label>
                        <Input 
                          placeholder="Phone or Alternative Email" 
                          className="glass-panel border-white/10 text-white" 
                          value={formData.contactDetails}
                          onChange={e => setFormData({...formData, contactDetails: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Preferred Jurisdiction</Label>
                        <Input 
                          className="glass-panel border-white/10 text-white" 
                          value={formData.city}
                          onChange={e => setFormData({...formData, city: e.target.value})}
                          required
                        />
                      </div>
                    </>
                  )}

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
              )}
            </CardContent>
          </Card>
        </div>
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
