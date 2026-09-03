'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { applicationService } from '@/services/application.service';
import { MultiPhaseApplicationData } from '@/types';
import { useApplicationStore } from '@/store/application.store';
import { useAuth } from '@/hooks/useAuth';

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | string[] | null;
}) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b">
      <dt className="text-sm font-medium text-muted-foreground col-span-1">
        {label}
      </dt>
      <dd className="text-sm col-span-2">{displayValue}</dd>
    </div>
  );
}

/** The reference the applicant should keep — the first thing they see after submitting. */
function ReferenceCard({ referenceCode, appId }: { referenceCode: string | null; appId: string | null }) {
  if (!referenceCode && !appId) return null;
  return (
    <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
      {referenceCode && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-left">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Candidate ID
          </p>
          <p className="font-mono text-base font-semibold">{referenceCode}</p>
        </div>
      )}
      {appId && (
        <div className="rounded-lg border bg-muted/40 px-4 py-3 text-left">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Application
          </p>
          <p className="font-mono text-base font-semibold">#{appId}</p>
        </div>
      )}
    </div>
  );
}

function ProfileSummary() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('appId');
  const referenceCode = searchParams.get('ref');
  const { user } = useAuth();
  const { resetApplicationData } = useApplicationStore();
  const [application, setApplication] =
    useState<MultiPhaseApplicationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // /applications/:id is org-scoped and staff-only: anonymous applicants 401 on it and
    // signed-in candidates 404 (their own org isn't the employer's). Only staff reviewing a
    // submission can read it — everyone else gets the confirmation card, which is the one
    // that carries their Candidate ID anyway.
    if (!appId || !user || user.role === 'CANDIDATE') {
      setIsLoading(false);
      resetApplicationData();
      return;
    }
    applicationService
      .getDetailedApplication(appId)
      .then((data) => {
        setApplication(data);
        setIsLoading(false);
        // Clear the form state now that submission is confirmed and data is displayed
        resetApplicationData();
      })
      .catch((err) => {
        console.error('Failed to fetch application summary:', err);
        setIsLoading(false);
      });
  }, [appId, user, resetApplicationData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="max-w-2xl text-center">
          <CardHeader className="items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl">Application Submitted!</CardTitle>
            <CardDescription>
              Thank you for your interest in Baalvion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              We have received your application and our talent team will review
              it shortly. A confirmation email is on its way, and you can track
              every stage — and message the hiring team — from your dashboard.
            </p>
            <ReferenceCard referenceCode={referenceCode} appId={appId} />
            <p className="mt-4 text-sm text-muted-foreground">
              Keep your Candidate ID — quote it whenever you contact us about this application.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild>
                <Link href="/careers/open-positions">
                  Return to Open Positions
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/my-account">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center items-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <CardTitle className="text-2xl">
            Application Submitted Successfully!
          </CardTitle>
          <CardDescription>
            This is a summary of the information you provided for the role:{' '}
            <span className="font-bold">{application.jobTitle}</span>
          </CardDescription>
          <ReferenceCard referenceCode={referenceCode} appId={appId} />
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Basic Information
            </h3>
            <dl className="space-y-2">
              <DetailItem label="Full Name" value={application.fullName} />
              <DetailItem label="Email" value={application.email} />
              <DetailItem label="Phone" value={application.phone} />
              <DetailItem label="LinkedIn" value={application.linkedinUrl} />
              <DetailItem
                label="Portfolio/GitHub"
                value={application.portfolioUrl}
              />
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Skills & Expertise
            </h3>
            <dl className="space-y-2">
              <DetailItem
                label="Primary Expertise"
                value={application.primaryExpertise}
              />
              <DetailItem
                label="Frontend Technologies"
                value={
                  [
                    ...(application.frontendTechnologies || []),
                    application.frontendTechnologiesOther,
                  ].filter(Boolean) as string[]
                }
              />
              <DetailItem
                label="Frontend Expertise"
                value={
                  application.frontendExpertise
                    ? `${application.frontendExpertise}%`
                    : null
                }
              />
              <DetailItem
                label="Backend Technologies"
                value={
                  [
                    ...(application.backendTechnologies || []),
                    application.backendTechnologiesOther,
                  ].filter(Boolean) as string[]
                }
              />
              <DetailItem
                label="Backend Expertise"
                value={
                  application.backendExpertise
                    ? `${application.backendExpertise}%`
                    : null
                }
              />
              <DetailItem
                label="DevOps Technologies"
                value={
                  [
                    ...(application.devopsTechnologies || []),
                    application.devopsTechnologiesOther,
                  ].filter(Boolean) as string[]
                }
              />
              <DetailItem
                label="DevOps Expertise"
                value={
                  application.devopsExpertise
                    ? `${application.devopsExpertise}%`
                    : null
                }
              />
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">
              Verification
            </h3>
            <dl className="space-y-2">
              <DetailItem
                label="National ID"
                value={application.nationalId ? 'Provided' : 'Not Provided'}
              />
              <DetailItem
                label="Tax ID"
                value={application.taxId ? 'Provided' : 'Not Provided'}
              />
            </dl>
          </div>
          <div className="text-center pt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href="/careers/open-positions">Explore More Roles</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/my-account">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
    >
      <ProfileSummary />
    </Suspense>
  );
}
