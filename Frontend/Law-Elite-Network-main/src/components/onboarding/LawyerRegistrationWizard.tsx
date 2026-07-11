"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, CheckCircle2, Upload, FileCheck2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/lib/countries';
import { getStates, getCities, type GeoState, type GeoCity } from '@/services/geo/geoService';
import { getPracticeAreas, type PracticeArea } from '@/services/practiceAreas/practiceAreaService';
import { createLawyerProfile } from '@/services/lawyers/lawyerService';
import {
  uploadVerificationDocument,
  getMyVerificationDocuments,
  type VerificationDocType,
  type VerificationDocument,
} from '@/services/verification/verificationService';
import { getPlansByRole, createSubscription } from '@/services/subscriptions/subscriptionService';

type WizardStep = 'location' | 'personal' | 'professional' | 'verification' | 'subscription' | 'done';
const STEPS: WizardStep[] = ['location', 'personal', 'professional', 'verification', 'subscription', 'done'];
const STEP_LABELS: Record<WizardStep, string> = {
  location: 'Location', personal: 'Personal', professional: 'Professional',
  verification: 'Verification', subscription: 'Subscription', done: 'Done',
};

const DOC_TYPES: { type: VerificationDocType; label: string }[] = [
  { type: 'bar_council_certificate', label: 'Bar Council Certificate' },
  { type: 'government_id', label: 'Government ID' },
  { type: 'professional_certificate', label: 'Professional Certificate' },
  { type: 'selfie', label: 'Selfie (for verification)' },
];

interface WizardData {
  countryCode: string;
  stateId: string;
  cityId: string;
  fullName: string;
  dob: string;
  gender: string;
  languages: string;
  bio: string;
  licenseNumber: string;
  firmName: string;
  isIndependent: boolean;
  experienceYears: string;
  practiceAreaSlugs: string[];
}

const INITIAL_DATA: WizardData = {
  countryCode: 'US', stateId: '', cityId: '', fullName: '', dob: '', gender: '',
  languages: '', bio: '', licenseNumber: '', firmName: '', isIndependent: true,
  experienceYears: '', practiceAreaSlugs: [],
};

/**
 * Registration wizard: Location -> Personal -> Professional -> Verification
 * -> Subscription -> Activated. Each step submits only when complete; the
 * lawyer profile itself isn't created until Professional Details is done
 * (Verification and Subscription then attach documents/billing to it).
 */
export function LawyerRegistrationWizard({ email }: { email?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>('location');
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);

  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [lawyerId, setLawyerId] = useState<number | null>(null);
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [uploadingType, setUploadingType] = useState<VerificationDocType | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const progressPct = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  useEffect(() => {
    getPracticeAreas().then(setPracticeAreas).catch(() => setPracticeAreas([]));
  }, []);

  useEffect(() => {
    setData((d) => ({ ...d, stateId: '', cityId: '' }));
    setCities([]);
    if (!data.countryCode) { setStates([]); return; }
    getStates(data.countryCode).then(setStates).catch(() => setStates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.countryCode]);

  useEffect(() => {
    setData((d) => ({ ...d, cityId: '' }));
    if (!data.stateId) { setCities([]); return; }
    getCities(Number(data.stateId)).then(setCities).catch(() => setCities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.stateId]);

  const lawyerPlans = useMemo(() => getPlansByRole('lawyer'), []);

  const togglePracticeArea = (slug: string) => {
    setData((d) => ({
      ...d,
      practiceAreaSlugs: d.practiceAreaSlugs.includes(slug)
        ? d.practiceAreaSlugs.filter((s) => s !== slug)
        : [...d.practiceAreaSlugs, slug],
    }));
  };

  const goNext = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const goBack = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  // Location + Personal are just local state; the profile is created once
  // Professional Details (practice areas) is submitted.
  const handleProfessionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.practiceAreaSlugs.length) {
      toast({ title: 'Select at least one practice area', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const country = COUNTRIES.find((c) => c.code === data.countryCode);
      const state = states.find((s) => String(s.id) === data.stateId);
      const city = cities.find((c) => String(c.id) === data.cityId);
      const created: any = await createLawyerProfile({
        name: data.fullName,
        email,
        country: country?.name,
        country_code: data.countryCode,
        city: city?.name || '',
        state_id: state ? state.id : undefined,
        city_id: city ? city.id : undefined,
        dob: data.dob || undefined,
        gender: data.gender || undefined,
        languages: data.languages.split(',').map((s) => s.trim()).filter(Boolean),
        bio: data.bio || `${data.fullName} — practising in ${city?.name || country?.name}.`,
        license_number: data.licenseNumber || undefined,
        firm_name: data.isIndependent ? undefined : data.firmName || undefined,
        is_independent: data.isIndependent,
        experience: parseInt(data.experienceYears, 10) || 0,
        practice_area_ids: data.practiceAreaSlugs,
      });
      setLawyerId(created?.id ?? null);
      toast({ title: 'Profile created', description: 'Now upload your verification documents.' });
      goNext();
    } catch (error: any) {
      toast({ title: 'Could not create profile', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocUpload = async (docType: VerificationDocType, file: File | undefined) => {
    if (!file) return;
    setUploadingType(docType);
    try {
      await uploadVerificationDocument(docType, file);
      const mine = await getMyVerificationDocuments();
      setDocs(mine);
      toast({ title: `${docType.replace(/_/g, ' ')} uploaded` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingType(null);
    }
  };

  const allDocsUploaded = DOC_TYPES.every((d) => docs.some((doc) => doc.doc_type === d.type));

  const handleSubscribe = async (planId: string) => {
    setSubmitting(true);
    try {
      await createSubscription(String(lawyerId ?? ''), planId, 'lawyer');
      toast({ title: 'Subscription active', description: 'Your account is activated once an admin verifies your documents.' });
      setStep('done');
    } catch (error: any) {
      toast({ title: 'Subscription failed', description: error?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 space-y-2">
        <Progress value={progressPct} className="h-1.5" />
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {STEPS.map((s) => (
            <span key={s} className={s === step ? 'text-accent' : ''}>{STEP_LABELS[s]}</span>
          ))}
        </div>
      </div>

      <Card className="glass-panel border-white/10 shadow-2xl">
        {step === 'location' && (
          <>
            <CardHeader>
              <CardTitle className="text-white">Where do you practice?</CardTitle>
              <CardDescription>Select your country, state/province, and city.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Country</Label>
                <Select value={data.countryCode} onValueChange={(v) => setData((d) => ({ ...d, countryCode: v }))}>
                  <SelectTrigger className="glass-panel border-white/10 text-white">
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /><SelectValue /></div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">State / Province</Label>
                  <Select value={data.stateId} onValueChange={(v) => setData((d) => ({ ...d, stateId: v }))} disabled={!states.length}>
                    <SelectTrigger className="glass-panel border-white/10 text-white">
                      <SelectValue placeholder={states.length ? 'Select state' : 'No data for this country yet'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {states.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">City</Label>
                  <Select value={data.cityId} onValueChange={(v) => setData((d) => ({ ...d, cityId: v }))} disabled={!cities.length}>
                    <SelectTrigger className="glass-panel border-white/10 text-white">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Select city" /></div>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cities.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={goNext} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">Continue</Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'personal' && (
          <>
            <CardHeader>
              <CardTitle className="text-white">Personal Details</CardTitle>
              <CardDescription>Tell us about yourself.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Full Name</Label>
                <Input className="glass-panel border-white/10 text-white" value={data.fullName} onChange={(e) => setData((d) => ({ ...d, fullName: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Date of Birth</Label>
                  <Input type="date" className="glass-panel border-white/10 text-white" value={data.dob} onChange={(e) => setData((d) => ({ ...d, dob: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Gender</Label>
                  <Select value={data.gender} onValueChange={(v) => setData((d) => ({ ...d, gender: v }))}>
                    <SelectTrigger className="glass-panel border-white/10 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Languages Spoken (comma separated)</Label>
                <Input placeholder="English, Hindi" className="glass-panel border-white/10 text-white" value={data.languages} onChange={(e) => setData((d) => ({ ...d, languages: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Biography</Label>
                <Textarea className="glass-panel border-white/10 text-white" rows={4} value={data.bio} onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))} />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-white">Back</Button>
                <Button onClick={goNext} disabled={!data.fullName} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">Continue</Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'professional' && (
          <form onSubmit={handleProfessionalSubmit}>
            <CardHeader>
              <CardTitle className="text-white">Professional Details</CardTitle>
              <CardDescription>Your credentials and areas of practice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Bar Council Registration Number</Label>
                  <Input className="glass-panel border-white/10 text-white" value={data.licenseNumber} onChange={(e) => setData((d) => ({ ...d, licenseNumber: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Years of Experience</Label>
                  <Input type="number" className="glass-panel border-white/10 text-white" value={data.experienceYears} onChange={(e) => setData((d) => ({ ...d, experienceYears: e.target.value }))} required />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-white/10 p-3">
                <div>
                  <Label className="text-white">Independent Practitioner</Label>
                  <p className="text-xs text-muted-foreground">Off if you practice with a law firm.</p>
                </div>
                <Switch checked={data.isIndependent} onCheckedChange={(v) => setData((d) => ({ ...d, isIndependent: v }))} />
              </div>
              {!data.isIndependent && (
                <div className="space-y-2">
                  <Label className="text-white">Law Firm Name</Label>
                  <Input className="glass-panel border-white/10 text-white" value={data.firmName} onChange={(e) => setData((d) => ({ ...d, firmName: e.target.value }))} />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-white">Practice Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {practiceAreas.map((area) => {
                    const active = data.practiceAreaSlugs.includes(area.slug);
                    return (
                      <button
                        type="button"
                        key={area.id}
                        onClick={() => togglePracticeArea(area.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${active ? 'bg-accent text-accent-foreground border-accent' : 'bg-transparent text-muted-foreground border-white/20 hover:border-accent'}`}
                      >
                        {area.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-white">Back</Button>
                <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Profile
                </Button>
              </div>
            </CardContent>
          </form>
        )}

        {step === 'verification' && (
          <>
            <CardHeader>
              <CardTitle className="text-white">Verification</CardTitle>
              <CardDescription>Upload your credentials for admin review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DOC_TYPES.map(({ type, label }) => {
                const uploaded = docs.find((d) => d.doc_type === type);
                return (
                  <div key={type} className="flex items-center justify-between rounded-md border border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      {uploaded ? <FileCheck2 className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <p className="text-sm text-white">{label}</p>
                        {uploaded && <p className="text-xs text-muted-foreground capitalize">{uploaded.status}</p>}
                      </div>
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">
                        {uploadingType === type ? 'Uploading…' : uploaded ? 'Replace' : 'Upload'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/*"
                        disabled={uploadingType !== null}
                        onChange={(e) => handleDocUpload(type, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                );
              })}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-white">Back</Button>
                <Button onClick={goNext} disabled={!allDocsUploaded} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'subscription' && (
          <>
            <CardHeader>
              <CardTitle className="text-white">Choose a Plan</CardTitle>
              <CardDescription>Your account activates once verification is approved and a plan is active.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lawyerPlans.map((plan: any) => (
                <button
                  key={plan.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full text-left flex items-center justify-between rounded-md border p-4 transition-all ${plan.recommended ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-accent/60'}`}
                >
                  <div>
                    <p className="font-headline text-lg text-white">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{(plan.features || []).join(' · ')}</p>
                  </div>
                  <p className="text-xl font-bold text-white">{plan.price ? `$${plan.price}/mo` : 'Free'}</p>
                </button>
              ))}
              <div className="flex justify-start pt-4">
                <Button type="button" variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-white">Back</Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'done' && (
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h3 className="font-headline text-2xl text-white">Application Submitted</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your subscription is active. An admin will verify your documents shortly — your profile goes live once that's approved.
            </p>
            <Button onClick={() => router.push('/lawyer/dashboard')} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
              Go to Dashboard
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
