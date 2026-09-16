'use client';

import { useState, useEffect } from 'react';
import { getKYCDetail, submitKYC, KYCStatus, IdTypeOption, KYCDetail } from '@/services/compliance-service';
import { documentsApi } from '@/api/documents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, User, Building, FileUp, CheckCircle2, Loader2, Clock, AlertCircle, FileCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RepresentativeDetails {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  officialEmail: string;
}

interface CompanyCredentials {
  registrationNumber: string;
  incorporationDate: string;
  hqAddress: string;
  taxResidency: string;
}

type UploadSlot = 'governmentId' | 'businessLicense';

interface UploadState {
  file: File | null;
  documentId: string | null;
  uploading: boolean;
  error: string | null;
}

const EMPTY_UPLOAD: UploadState = { file: null, documentId: null, uploading: false, error: null };

export default function KYCPage() {
  const [status, setStatus] = useState<KYCStatus>('not_started');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [representative, setRepresentative] = useState<RepresentativeDetails>({
    fullName: '', dateOfBirth: '', nationality: '', officialEmail: '',
  });
  const [company, setCompany] = useState<CompanyCredentials>({
    registrationNumber: '', incorporationDate: '', hqAddress: '', taxResidency: '',
  });
  const [uploads, setUploads] = useState<Record<UploadSlot, UploadState>>({
    governmentId: { ...EMPTY_UPLOAD },
    businessLicense: { ...EMPTY_UPLOAD },
  });
  const [idType, setIdType] = useState<IdTypeOption>('passport');

  const [rejections, setRejections] = useState<KYCDetail['rejectionReasons']>([]);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    getKYCDetail()
      .then((detail) => {
        setStatus(detail.status);
        setRejections(detail.rejectionReasons);
        setValidUntil(detail.validUntil);
        setExpired(detail.expired);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const step1Valid = representative.fullName.trim() && representative.dateOfBirth
    && representative.nationality.trim() && representative.officialEmail.trim();
  const step2Valid = company.registrationNumber.trim() && company.incorporationDate
    && company.hqAddress.trim() && company.taxResidency.trim();
  const uploadsValid = uploads.governmentId.documentId && uploads.businessLicense.documentId;

  async function handleFileSelect(slot: UploadSlot, docType: 'government_id' | 'other', title: string, file: File) {
    setUploads(prev => ({ ...prev, [slot]: { ...prev[slot], file, uploading: true, error: null } }));
    try {
      const doc = await documentsApi.create({ doc_type: docType, title, classification: 'CONFIDENTIAL' });
      await documentsApi.uploadVersion(doc.id, file);
      setUploads(prev => ({ ...prev, [slot]: { file, documentId: doc.id, uploading: false, error: null } }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed.';
      setUploads(prev => ({ ...prev, [slot]: { file: null, documentId: null, uploading: false, error: message } }));
      toast({ variant: 'destructive', title: 'Upload failed', description: message });
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitKYC({
        representative,
        company,
        documentIds: {
          governmentId: uploads.governmentId.documentId,
          businessLicense: uploads.businessLicense.documentId,
        },
        idType,
      });
      setStatus('pending');
      toast({ title: "KYC Submitted", description: "Your verification is now being reviewed by compliance." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-muted/20">
        <Card className="max-w-lg w-full text-center p-8 shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <div className="h-14 w-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Verification Pending</h2>
              <p className="text-muted-foreground">
                Our institutional compliance team is currently reviewing your documentation. This typically takes 24–48 hours.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>Refresh Status</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-muted/20">
        <Card className="max-w-lg w-full text-center p-8 shadow-sm border-green-200 bg-green-50/10">
          <CardContent className="space-y-6 pt-6">
            <div className="h-14 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Account Verified</h2>
              <p className="text-muted-foreground">
                Your institution has been successfully verified. You now have full access to platform liquidity and trade settlements.
              </p>
              {validUntil && (
                <p className="text-xs text-muted-foreground pt-2">
                  Valid until <span className="font-semibold text-foreground">{new Date(validUntil).toLocaleDateString()}</span> — you&apos;ll need to re-verify before then.
                </p>
              )}
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
              <a href="/dashboard">Return to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Institutional Verification (KYC)</h2>
          <p className="text-muted-foreground">Ensure platform integrity and regulatory alignment by completing your institutional profile.</p>
        </div>

        {expired && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-semibold">
              <Clock className="h-5 w-5" />
              Verification expired
            </div>
            <p className="text-sm text-muted-foreground">
              Your previous verification has passed its validity period and is no longer active.
              Complete the form again to re-verify your institution.
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <AlertCircle className="h-5 w-5" />
              Previous submission was rejected
            </div>
            {rejections.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {rejections.map((r) => (
                  <li key={r.track} className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{r.track}:</span> {r.reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reason was recorded by the reviewer.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Correct the issue above and submit again — your resubmission replaces the rejected one.
            </p>
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center justify-between px-2 max-w-2xl">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors",
                step >= s ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted text-muted-foreground"
              )}>
                {s}
              </div>
              {s < 3 && <div className={cn("h-0.5 w-12 sm:w-24 bg-muted", step > s && "bg-primary")} />}
            </div>
          ))}
        </div>

        <Card className="shadow-sm border">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Representative Details
                </CardTitle>
                <CardDescription>Personal information of the authorized platform representative.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Legal Name</Label>
                    <Input
                      placeholder="As per government ID"
                      value={representative.fullName}
                      onChange={(e) => setRepresentative(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={representative.dateOfBirth}
                      onChange={(e) => setRepresentative(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      placeholder="e.g. Singaporean"
                      value={representative.nationality}
                      onChange={(e) => setRepresentative(prev => ({ ...prev, nationality: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Official Email</Label>
                    <Input
                      type="email"
                      placeholder="institution@email.com"
                      value={representative.officialEmail}
                      onChange={(e) => setRepresentative(prev => ({ ...prev, officialEmail: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" /> Company Credentials
                </CardTitle>
                <CardDescription>Official business registration and jurisdictional details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Registration Number (UEN)</Label>
                    <Input
                      placeholder="e.g. 201201234K"
                      value={company.registrationNumber}
                      onChange={(e) => setCompany(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Incorporation</Label>
                    <Input
                      type="date"
                      value={company.incorporationDate}
                      onChange={(e) => setCompany(prev => ({ ...prev, incorporationDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>HQ Address</Label>
                    <Input
                      placeholder="Street, City, Postcode"
                      value={company.hqAddress}
                      onChange={(e) => setCompany(prev => ({ ...prev, hqAddress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Residency</Label>
                    <Input
                      placeholder="Primary Jurisdiction"
                      value={company.taxResidency}
                      onChange={(e) => setCompany(prev => ({ ...prev, taxResidency: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5 text-primary" /> Document Upload
                </CardTitle>
                <CardDescription>Provide high-resolution scans of your institutional documentation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Government ID Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['passport', 'driving_license', 'government_id'] as IdTypeOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIdType(opt)}
                        className={cn(
                          'px-3 py-1.5 rounded-full border text-xs font-medium capitalize transition-colors',
                          idType === opt ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-accent'
                        )}
                      >
                        {opt.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <UploadSlotCard
                    label="Government Issued ID (Representative)"
                    hint="Passport or National ID card. Max 5MB PDF/JPG."
                    state={uploads.governmentId}
                    onSelect={(file) => handleFileSelect('governmentId', 'government_id', 'Government Issued ID', file)}
                  />
                  <UploadSlotCard
                    label="Business License / Certificate of Inc."
                    hint="Certified copy of registration. Max 5MB PDF."
                    state={uploads.businessLicense}
                    onSelect={(file) => handleFileSelect('businessLicense', 'other', 'Business License / Certificate of Incorporation', file)}
                  />
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-3 text-orange-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Ensure all documents are clearly legible and currently valid. Expired or blurred documents will result in application rejection.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="bg-muted/30 border-t justify-between p-6">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || submitting}>Back</Button>
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting || !uploadsValid}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Submit for Verification
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

function UploadSlotCard({ label, hint, state, onSelect }: {
  label: string;
  hint: string;
  state: UploadState;
  onSelect: (file: File) => void;
}) {
  const inputId = `upload-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-2 hover:bg-accent/5 transition-colors">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
      {state.documentId ? (
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-green-600">
          <FileCheck2 className="h-4 w-4" /> {state.file?.name} uploaded
        </div>
      ) : (
        <Button variant="outline" size="sm" disabled={state.uploading} asChild>
          <label htmlFor={inputId} className="cursor-pointer">
            {state.uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            {state.uploading ? 'Uploading…' : 'Select File'}
          </label>
        </Button>
      )}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
