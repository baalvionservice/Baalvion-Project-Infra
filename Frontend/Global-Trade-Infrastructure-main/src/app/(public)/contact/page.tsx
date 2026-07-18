'use client';

/**
 * @file src/app/contact/page.tsx
 * @description The institutional contact page for Baalvion.
 */
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Users, Building, Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { contactService, type ContactInquiryInput } from '@/services/contact-service';

const SUBJECTS: { value: ContactInquiryInput['subject']; label: string }[] = [
  { value: 'onboarding', label: 'Institutional Onboarding' },
  { value: 'technical', label: 'Technical Integration' },
  { value: 'governance', label: 'Governance & Compliance' },
  { value: 'other', label: 'Other' },
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function ContactPage() {
  const [values, setValues] = useState({ name: '', email: '', institution: '', subject: '' as ContactInquiryInput['subject'] | '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const setValue = (key: keyof typeof values, val: string) => setValues((v) => ({ ...v, [key]: val }));

  const canSubmit = values.name.trim().length > 0 && isEmail(values.email) && values.subject && values.message.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      await contactService.submitInquiry({
        name: values.name,
        email: values.email,
        institution: values.institution || undefined,
        subject: values.subject as ContactInquiryInput['subject'],
        message: values.message,
      });
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your inquiry could not be sent');
      setStatus('error');
    }
  };

  return (
    <div className="bg-muted/50">
        <div className="container py-20 md:py-28 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-start">
                <div className="space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
                    <h1 className="text-3xl md:text-4xl font-medium tracking-tight">Institutional Inquiries</h1>
                    <p className="text-lg text-muted-foreground">
                        For institutional inquiries, please use the provided form or contact the relevant department directly. Our team operates on a confidential, institution-to-institution basis.
                    </p>
                    <Separator className="my-6"/>
                    <div className="space-y-6 pt-4">
                        <div className="flex items-start gap-4">
                            <Users className="w-6 h-6 text-primary mt-1"/>
                            <div>
                                <h3 className="font-semibold text-foreground">Institutional Onboarding</h3>
                                <p className="text-muted-foreground text-sm">For new banks, governments, or enterprises seeking to join the platform.</p>
                                <Link href="mailto:onboarding@baalvion.com" className="text-sm text-primary hover:underline">onboarding@baalvion.com</Link>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Building className="w-6 h-6 text-primary mt-1"/>
                            <div>
                                <h3 className="font-semibold text-foreground">Technical Integration</h3>
                                <p className="text-muted-foreground text-sm">For technical teams evaluating or implementing Baalvion's APIs.</p>
                                <Link href="mailto:support.integration@baalvion.com" className="text-sm text-primary hover:underline">support.integration@baalvion.com</Link>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Shield className="w-6 h-6 text-primary mt-1"/>
                            <div>
                                <h3 className="font-semibold text-foreground">Platform Governance & Trust</h3>
                                <p className="text-muted-foreground text-sm">For inquiries related to compliance, security, and data governance.</p>
                                <Link href="mailto:governance@baalvion.com" className="text-sm text-primary hover:underline">governance@baalvion.com</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle>Submit an Inquiry</CardTitle>
                        <CardDescription>All fields are required. We only respond to official institutional email addresses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'sent' ? (
                          <div className="flex flex-col items-center text-center gap-4 py-10">
                            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Inquiry sent</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">We've received your message and will respond via your official email address shortly.</p>
                          </div>
                        ) : (
                          <form className="space-y-6" onSubmit={handleSubmit}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="name">Full Name</Label>
                                      <Input id="name" placeholder="Jane Doe" value={values.name} onChange={(e) => setValue('name', e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="email">Official Email</Label>
                                      <Input id="email" type="email" placeholder="j.doe@institution.gov" value={values.email} onChange={(e) => setValue('email', e.target.value)} />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="institution">Institution</Label>
                                  <Input id="institution" placeholder="e.g., Central Bank of Example" value={values.institution} onChange={(e) => setValue('institution', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="subject">Inquiry Subject</Label>
                                  <Select value={values.subject} onValueChange={(v) => setValue('subject', v)}>
                                      <SelectTrigger id="subject">
                                          <SelectValue placeholder="Select subject..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {SUBJECTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="message">Message</Label>
                                  <Textarea id="message" placeholder="Please describe your inquiry in detail." rows={5} value={values.message} onChange={(e) => setValue('message', e.target.value)} />
                              </div>
                              {status === 'error' && (
                                <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                                  <AlertTriangle className="h-4 w-4 shrink-0" />
                                  <p>{error}</p>
                                </div>
                              )}
                              <Button type="submit" className="w-full" disabled={!canSubmit || status === 'submitting'}>
                                  {status === 'submitting' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <>Submit Inquiry <ArrowRight className="ml-2 w-4 h-4"/></>}
                              </Button>
                          </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
