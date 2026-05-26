
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnboardingData } from '../onboarding-flow';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms to complete onboarding.',
  }),
});

interface Step4Props {
    onNext: (data: Partial<OnboardingData>) => void;
    data: OnboardingData;
}

export function Step4Review({ onNext, data }: Step4Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { consent: false },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.consent) {
      onNext({}); // Final step, no more data to add
    }
  }

  const InfoRow = ({ label, value }: { label: string, value?: string | number }) => (
    value ? (
        <div className="flex justify-between py-2 border-b items-center">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm text-right truncate max-w-xs">{value}</dd>
        </div>
    ) : null
  );

  const FileRow = ({ label, file }: { label: string; file?: File }) => (
    file ? (
        <div className="flex justify-between py-2 border-b items-center">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm text-right truncate max-w-xs">{file.name} ({(file.size / 1024).toFixed(2)} KB)</dd>
        </div>
    ) : null
  );

  return (
    <Form {...form}>
      <form id="step-3-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <dl className="space-y-2 rounded-md border p-4">
            <InfoRow label="Full Name" value={data.fullName} />
            <InfoRow label="Location" value={data.location} />
            <FileRow label="Profile Photo" file={data.profilePhoto} />
            <InfoRow label="Last Job Title" value={data.lastJobTitle} />
            <InfoRow label="Last Company" value={data.lastCompany} />
            <InfoRow label="Salary" value={data.salary && data.currency ? `${data.salary.toLocaleString()} ${data.currency}` : undefined} />
            <FileRow label="Employment Proof" file={data.proofDoc} />
            <InfoRow label="Experience Summary" value={data.experience} />
            <InfoRow label="Skills" value={data.skills} />
            <InfoRow label="Degree" value={data.degree} />
            <InfoRow label="Institute" value={data.institute} />
            <InfoRow label="Graduation Year" value={data.gradYear} />
            <FileRow label="Certifications" file={data.certifications} />
            <InfoRow label="Portfolio URL" value={data.portfolioUrl} />
            <InfoRow label="GitHub URL" value={data.githubUrl} />
            <InfoRow label="LinkedIn URL" value={data.linkedinUrl} />
        </dl>
        <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                <FormLabel>
                    I confirm that the information provided is accurate and I agree to the SkillMatch Pro Privacy Policy and Data Consent terms.
                </FormLabel>
                <FormMessage />
                </div>
            </FormItem>
            )}
        />
      </form>
    </Form>
  );
}
