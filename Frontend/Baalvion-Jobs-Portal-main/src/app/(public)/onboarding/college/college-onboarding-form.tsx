'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { onboardingService } from '@/services/onboarding.service';
import {
  collegeApplicationSchema,
  type CollegeApplicationInput,
} from '@/lib/server/onboarding-schemas';
import { Loader2, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';

export function CollegeOnboardingForm() {
  const { toast } = useToast();
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const form = useForm<CollegeApplicationInput>({
    resolver: zodResolver(collegeApplicationSchema),
    defaultValues: {
      institutionName: '',
      institutionType: 'university',
      accreditation: '',
      tier: 'unsure',
      website: '',
      city: '',
      state: '',
      country: 'India',
      studentCount: undefined,
      contactName: '',
      contactRole: '',
      contactEmail: '',
      contactPhone: '',
      message: '',
      agreeToVerification: false as unknown as true,
    },
  });

  const onSubmit = async (data: CollegeApplicationInput) => {
    try {
      const result = await onboardingService.submitCollege(data);
      setReferenceId(result.referenceId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (referenceId) {
    return (
      <Card className="border-t-4 border-t-emerald-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Application received</CardTitle>
          <CardDescription>
            Thank you for applying to onboard your institution to Baalvion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">Your reference number</p>
            <p className="text-xl font-bold tracking-wide">{referenceId}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Our team verifies accreditation and placement details — typically within 5–7
            business days. We&apos;ll reach out on the contact email you provided with next
            steps and your placement dashboard access.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/placement">
                Explore campus placements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">College onboarding application</CardTitle>
            <CardDescription>
              Tell us about your institution and placement cell. Fields marked * are required.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Institution */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Institution details
              </h3>
              <FormField
                control={form.control}
                name="institutionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. National Institute of Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="institutionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="engineering">Engineering college</SelectItem>
                          <SelectItem value="management">Management school</SelectItem>
                          <SelectItem value="arts_science">Arts &amp; Science</SelectItem>
                          <SelectItem value="polytechnic">Polytechnic</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Self-assessed tier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Not sure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Type 1 — Premier</SelectItem>
                          <SelectItem value="2">Type 2 — Established</SelectItem>
                          <SelectItem value="3">Type 3 — Emerging</SelectItem>
                          <SelectItem value="unsure">Not sure</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Our team confirms the final tier.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accreditation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accreditation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NAAC A++, NBA, AICTE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://college.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region *</FormLabel>
                      <FormControl>
                        <Input placeholder="State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="studentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approx. graduating students / year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 1200"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Placement cell contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Placement Officer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="placement@college.edu"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+91 98765 43210" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything else?</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Tell us about your placement goals, current process, or questions."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agreeToVerification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      I confirm the details above are accurate and authorise Baalvion to verify
                      our institution&apos;s accreditation and placement records. *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit application
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By submitting you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
