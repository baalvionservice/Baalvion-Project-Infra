'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Upload, CheckCircle, Clock, Shield, FileText, User,
  Building, Linkedin, Camera, AlertCircle, ChevronRight, BadgeCheck,
  Sparkles, Lock, Eye, EyeOff, Phone, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type VerifyStep = 'personal' | 'company' | 'documents' | 'profile' | 'submitted';

interface DocUpload {
  name: string;
  uploaded: boolean;
  file?: string;
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  const steps = ['Personal Info', 'Company Details', 'Documents', 'Public Profile'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < current ? 'bg-primary border-primary text-primary-foreground'
              : i === current ? 'border-primary text-primary bg-background'
              : 'border-muted-foreground/30 text-muted-foreground bg-background'
            }`}>
              {i < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs mt-1 text-center hidden md:block ${i === current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < current ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── File Upload Box ───────────────────────────────────────────────────────────
function FileUploadBox({ label, description, required, uploaded, onUpload }: {
  label: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  onUpload: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be under 10MB');
        return;
      }
      onUpload();
    }
  };

  return (
    <>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange} 
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`w-full rounded-xl border-2 border-dashed p-5 text-left transition-all hover:border-primary/60 ${
          uploaded ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : 'border-muted-foreground/30 hover:bg-muted/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${uploaded ? 'bg-green-100' : 'bg-muted'}`}>
            {uploaded ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{label}</p>
              {required && <Badge variant="outline" className="text-xs px-1 py-0">Required</Badge>}
              {uploaded && <Badge className="bg-green-500 text-white text-xs px-1 py-0">Uploaded ✓</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            {!uploaded && <p className="text-xs text-primary mt-1">Click to upload PDF, JPG, or PNG (max 10MB)</p>}
          </div>
        </div>
      </button>
    </>
  );
}

// ─── Step: Personal Info ───────────────────────────────────────────────────────
function StepPersonal({ onNext }: { onNext: () => void }) {
  const [form, setForm] = useState({
    fullName: '', dob: '', phone: '', email: '', city: 'Mumbai',
    hometown: '', height: '', linkedin: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground text-sm">This information will be verified against your government documents. Your age and name will be visible publicly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Full Legal Name *</label>
          <Input placeholder="As on Aadhaar/PAN" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Date of Birth *</label>
          <Input type="date" value={form.dob} onChange={e => update('dob', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Mobile Number *</label>
          <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email Address *</label>
          <Input type="email" placeholder="your@company.com" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Primary City *</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.city}
            onChange={e => update('city', e.target.value)}
          >
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Bangalore</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Hometown</label>
          <Input placeholder="e.g. Pune, Maharashtra" value={form.hometown} onChange={e => update('hometown', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Height (optional)</label>
          <Input placeholder={`e.g. 5'10"`} value={form.height} onChange={e => update('height', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">LinkedIn Profile URL *</label>
          <Input placeholder="linkedin.com/in/yourname" value={form.linkedin} onChange={e => update('linkedin', e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 p-3 flex gap-2">
        <Lock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Your contact details (phone, email) are <strong>never shown publicly</strong>. Only name, age, city, and LinkedIn are visible on your profile after admin approval.
        </p>
      </div>

      <Button className="w-full" onClick={onNext}>Continue to Company Details <ChevronRight className="h-4 w-4 ml-1" /></Button>
    </div>
  );
}

// ─── Step: Company Details ─────────────────────────────────────────────────────
function StepCompany({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState({
    companyName: '', title: '', sector: 'AI/ML', founded: '',
    cin: '', gst: '', funding: '', valuation: '', employees: '',
    revenue: '', offices: '', investors: '',
  });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Company & Founder Details</h2>
        <p className="text-muted-foreground text-sm">Your company will be verified against MCA21 / RoC records. All details visible on public profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Company Name *</label>
          <Input placeholder="Registered company name" value={form.companyName} onChange={e => update('companyName', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Your Title *</label>
          <Input placeholder="e.g. CEO & Co-Founder" value={form.title} onChange={e => update('title', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Sector *</label>
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.sector} onChange={e => update('sector', e.target.value)}>
            {['AI/ML', 'FinTech', 'Web3', 'SaaS', 'HealthTech', 'EdTech', 'D2C', 'CleanTech', 'SpaceTech', 'AgriTech', 'Other'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Year Founded *</label>
          <Input placeholder="e.g. 2021" value={form.founded} onChange={e => update('founded', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">CIN / Company ID *</label>
          <Input placeholder="MCA21 Company ID" value={form.cin} onChange={e => update('cin', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">GST Number (if applicable)</label>
          <Input placeholder="15-digit GST number" value={form.gst} onChange={e => update('gst', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Total Funding Raised</label>
          <Input placeholder="e.g. $5M Seed, ₹50Cr Series A" value={form.funding} onChange={e => update('funding', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Current Valuation</label>
          <Input placeholder="e.g. $25M" value={form.valuation} onChange={e => update('valuation', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Team Size</label>
          <Input placeholder="e.g. 45+" value={form.employees} onChange={e => update('employees', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Annual Revenue (ARR)</label>
          <Input placeholder="e.g. ₹12Cr ARR" value={form.revenue} onChange={e => update('revenue', e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium">Key Investors (comma separated)</label>
          <Input placeholder="e.g. Sequoia, YC, Lightspeed" value={form.investors} onChange={e => update('investors', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-32">Back</Button>
        <Button className="flex-1" onClick={onNext}>Continue to Documents <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}

// ─── Step: Documents ───────────────────────────────────────────────────────────
function StepDocuments({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<Record<string, DocUpload>>({
    pan: { name: 'PAN Card', uploaded: false },
    aadhar: { name: 'Aadhaar Card', uploaded: false },
    selfie: { name: 'Live Selfie with PAN', uploaded: false },
    incorporation: { name: 'Certificate of Incorporation', uploaded: false },
    moa: { name: 'Memorandum of Association (MoA)', uploaded: false },
    bs: { name: 'Balance Sheet (last FY)', uploaded: false },
    press: { name: 'Press Coverage / Media Links', uploaded: false },
  });

  const handleUpload = (key: string) => {
    setDocs(prev => ({ ...prev, [key]: { ...prev[key], uploaded: true } }));
    toast({ title: `✅ ${docs[key].name} uploaded successfully` });
  };

  const requiredDocs = ['pan', 'aadhar', 'selfie', 'incorporation'];
  const allRequired = requiredDocs.every(k => docs[k].uploaded);
  const uploadedCount = Object.values(docs).filter(d => d.uploaded).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">KYC Documents</h2>
        <p className="text-muted-foreground text-sm">
          Upload all required documents. Our team manually reviews every document within 48 hours.
          <strong> All documents are encrypted and never shared publicly.</strong>
        </p>
      </div>

      <div className="rounded-lg border p-3 flex items-center gap-3 bg-muted/30">
        <div className="text-2xl font-bold text-primary">{uploadedCount}/{Object.keys(docs).length}</div>
        <div>
          <p className="text-sm font-medium">Documents uploaded</p>
          <p className="text-xs text-muted-foreground">{requiredDocs.filter(k => docs[k].uploaded).length}/{requiredDocs.length} required uploaded</p>
        </div>
        <div className="ml-auto">
          {allRequired ? (
            <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />All Required Done</Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-400">Required Missing</Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identity Verification</h3>
        <FileUploadBox label="PAN Card" description="Clear image of your PAN card (both sides)" required uploaded={docs.pan.uploaded} onUpload={() => handleUpload('pan')} />
        <FileUploadBox label="Aadhaar Card" description="First 8 digits masked — last 4 visible only" required uploaded={docs.aadhar.uploaded} onUpload={() => handleUpload('aadhar')} />
        <FileUploadBox label="Live Selfie with PAN" description="Hold your PAN card next to your face in a well-lit photo — proves liveness" required uploaded={docs.selfie.uploaded} onUpload={() => handleUpload('selfie')} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company Verification</h3>
        <FileUploadBox label="Certificate of Incorporation" description="MCA-issued incorporation certificate" required uploaded={docs.incorporation.uploaded} onUpload={() => handleUpload('incorporation')} />
        <FileUploadBox label="Memorandum of Association (MoA)" description="Shows your role as director/founder" required={false} uploaded={docs.moa.uploaded} onUpload={() => handleUpload('moa')} />
        <FileUploadBox label="Last FY Balance Sheet" description="Audited financials — helps verify valuation claims" required={false} uploaded={docs.bs.uploaded} onUpload={() => handleUpload('bs')} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Social Proof</h3>
        <FileUploadBox label="Press Coverage / Media" description="Links or PDFs of Forbes, Economic Times, YourStory, etc." required={false} uploaded={docs.press.uploaded} onUpload={() => handleUpload('press')} />
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3 flex gap-2">
        <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 dark:text-orange-300">
          Fraudulent documents result in <strong>permanent ban + legal action</strong>. We run automated MCA21, PAN, and Aadhaar API checks on all submissions.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-32">Back</Button>
        <Button className="flex-1" onClick={onNext} disabled={!allRequired}>
          Continue to Public Profile <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step: Public Profile ──────────────────────────────────────────────────────
function StepProfile({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const [form, setForm] = useState({
    headline: '', shortBio: '', fullStory: '', dreams: '',
    thoughts: '', dailyLife: '', lookingFor: '', perfectDate: '',
    hourlyRate: '5000', interests: '', twitter: '', instagram: '',
    availability: 'Available', languages: '',
  });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const sections = [
    { key: 'headline', label: 'Your Headline / Tagline *', placeholder: 'One powerful sentence that captures your mission and personality', rows: 1 },
    { key: 'shortBio', label: 'Short Bio (shown on cards) *', placeholder: 'Max 150 chars — the punchy version of you', rows: 2 },
    { key: 'fullStory', label: 'Your Full Story *', placeholder: 'Where did you grow up? What drove you to build? The real story, not the LinkedIn version...', rows: 5 },
    { key: 'dreams', label: 'Your Dreams *', placeholder: 'What does your 10-year dream look like? Professional AND personal...', rows: 4 },
    { key: 'thoughts', label: 'Your Honest Thoughts', placeholder: 'What do you genuinely think about India, startups, relationships, the future? No PR speak.', rows: 4 },
    { key: 'dailyLife', label: 'A Day in Your Life', placeholder: '6am — Wake up...\n9am — First meeting...\nTell us how you actually live.', rows: 5 },
    { key: 'lookingFor', label: 'What You\'re Looking For *', placeholder: 'Describe who you want to meet. Be honest — what kind of person genuinely excites you?', rows: 4 },
    { key: 'perfectDate', label: 'Your Perfect Date', placeholder: 'Describe your ideal session/date. The vibe, place, energy you\'d love...', rows: 3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your Public Profile</h2>
        <p className="text-muted-foreground text-sm">
          This is what every woman who visits your profile will read. Be <strong>honest, specific, and real</strong>.
          Generic answers get fewer bookings. Vulnerability and authenticity get more.
        </p>
      </div>

      {/* Rate & Availability */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pricing & Availability</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Hourly Rate (₹) *</label>
            <Input type="number" placeholder="5000" value={form.hourlyRate} onChange={e => update('hourlyRate', e.target.value)} />
            <p className="text-xs text-muted-foreground">Min ₹2,000 · Max ₹25,000</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Availability *</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.availability} onChange={e => update('availability', e.target.value)}>
              <option>Available</option>
              <option>Limited</option>
              <option>Busy</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Languages *</label>
            <Input placeholder="English, Hindi, Tamil" value={form.languages} onChange={e => update('languages', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Story Sections */}
      <div className="space-y-4">
        {sections.map(({ key, label, placeholder, rows }) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              rows={rows}
              placeholder={placeholder}
              value={(form as Record<string, string>)[key]}
              onChange={e => update(key, e.target.value)}
            />
            {['fullStory', 'dreams', 'lookingFor'].includes(key) && (
              <p className="text-xs text-muted-foreground">💡 Tip: The more specific and personal, the more bookings you'll get.</p>
            )}
          </div>
        ))}
      </div>

      {/* Interests */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Interests & Hobbies (comma separated)</label>
        <Input placeholder="Jazz music, Hiking, Chess, Reading philosophy, Cooking badly" value={form.interests} onChange={e => update('interests', e.target.value)} />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Twitter / X handle</label>
          <Input placeholder="@yourhandle" value={form.twitter} onChange={e => update('twitter', e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Instagram handle</label>
          <Input placeholder="@yourinstagram" value={form.instagram} onChange={e => update('instagram', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="w-32">Back</Button>
        <Button className="flex-1 gap-2" onClick={onSubmit}>
          <Sparkles className="h-4 w-4" />Submit for Verification
        </Button>
      </div>
    </div>
  );
}

// ─── Submitted Screen ──────────────────────────────────────────────────────────
function Submitted() {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center max-w-md mx-auto">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
        <BadgeCheck className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground mt-2">
          Our team will manually verify your documents within <strong>24–48 hours</strong>.
          You'll receive an email and SMS once you're approved.
        </p>
      </div>

      <div className="w-full space-y-3 text-left">
        {[
          { step: '1', label: 'Document Check', desc: 'PAN, Aadhaar & company docs verified against government databases', done: true },
          { step: '2', label: 'Identity Verification', desc: 'Manual review by our team + liveness check', done: false },
          { step: '3', label: 'Profile Review', desc: 'Your story, dreams and profile content reviewed for quality', done: false },
          { step: '4', label: 'Go Live', desc: "You're listed on India's #1 founder dating platform", done: false },
        ].map(({ step, label, desc, done }) => (
          <div key={step} className={`flex items-start gap-3 rounded-lg border p-3 ${done ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : ''}`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              {done ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1" asChild><Link href="/dating">Back to Directory</Link></Button>
        <Button className="flex-1" asChild><Link href="/dating/founder-dashboard">My Dashboard</Link></Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FounderVerifyPage() {
  const [step, setStep] = useState<VerifyStep>('personal');

  const stepIndex = { personal: 0, company: 1, documents: 2, profile: 3, submitted: 4 }[step];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dating"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
      </div>

      {/* Hero */}
      {step !== 'submitted' && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Become a Verified Founder</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            India's first and only KYC-verified founder dating platform. Every founder listed is manually verified — no fakes, no frauds.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Government ID Verified</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Company Verified</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Manual Review</span>
          </div>
        </div>
      )}

      {step !== 'submitted' && <StepBar current={stepIndex} />}

      {/* Steps */}
      {step === 'personal' && <StepPersonal onNext={() => setStep('company')} />}
      {step === 'company' && <StepCompany onNext={() => setStep('documents')} onBack={() => setStep('personal')} />}
      {step === 'documents' && <StepDocuments onNext={() => setStep('profile')} onBack={() => setStep('company')} />}
      {step === 'profile' && <StepProfile onSubmit={() => setStep('submitted')} onBack={() => setStep('documents')} />}
      {step === 'submitted' && <Submitted />}
    </div>
  );
}
