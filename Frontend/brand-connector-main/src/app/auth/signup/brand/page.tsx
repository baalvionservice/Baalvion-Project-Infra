
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Rocket, 
  Mail, 
  Lock, 
  Building2, 
  Globe, 
  Users, 
  Phone, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Briefcase,
  Star
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { brandSignupSchema } from '@/lib/validations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type BrandSignupValues = z.infer<typeof brandSignupSchema>;

const INDUSTRIES = [
  "Technology", "E-commerce", "Fashion & Apparel", "Beauty & Wellness", 
  "Food & Beverage", "Education", "Real Estate", "Fintech", "Other"
];

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const PLANS = [
  { 
    id: "STARTER", 
    name: "Starter", 
    price: "Free", 
    fee: "5% Platform Fee", 
    desc: "Perfect for testing the waters." 
  },
  { 
    id: "GROWTH", 
    name: "Growth", 
    price: "₹9,999/mo", 
    fee: "3% Platform Fee", 
    desc: "Best for growing marketing teams.",
    popular: true 
  },
  { 
    id: "ENTERPRISE", 
    name: "Enterprise", 
    price: "Custom", 
    fee: "2% Platform Fee", 
    desc: "For large scale operations." 
  }
];

export default function BrandSignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const form = useForm<BrandSignupValues>({
    resolver: zodResolver(brandSignupSchema),
    defaultValues: {
      companyName: '',
      website: '',
      industry: '',
      teamSize: '',
      fullName: '',
      email: '',
      password: '',
      phone: '',
      plan: 'GROWTH',
    },
  });

  const nextStep = async () => {
    const fields = step === 1 
      ? ['companyName', 'website', 'industry', 'teamSize'] 
      : ['fullName', 'email', 'password', 'phone'];
    
    const isValid = await form.trigger(fields as any);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  async function onSubmit(values: BrandSignupValues) {
    setIsLoading(true);
    try {
      // 1. Create Firebase Auth User
      const userCredential = await createUserWithEmailAndPassword(auth!, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.fullName });
      
      // Send verification email
      await sendEmailVerification(user);

      // 2. Create User Document
      const userProfileData = {
        id: user.uid,
        email: values.email,
        role: 'BRAND',
        displayName: values.fullName,
        phone: values.phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDoc(doc(db!, 'users', user.uid), userProfileData).catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/users/${user.uid}`,
          operation: 'create',
          requestResourceData: userProfileData
        }));
      });

      // 3. Create Brand Document
      const brandData = {
        id: `brand_${user.uid}`,
        userId: user.uid,
        companyName: values.companyName,
        industry: values.industry,
        website: values.website,
        teamSize: values.teamSize,
        plan: values.plan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDoc(doc(db!, 'brands', brandData.id), brandData).catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/brands/${brandData.id}`,
          operation: 'create',
          requestResourceData: brandData
        }));
      });

      toast({
        title: "Account Created!",
        description: "Please verify your email to continue.",
      });

      router.push('/auth/verify-email');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center mb-6">
            <div className="bg-primary p-2 rounded-xl mr-2">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight">Baalvion <span className="text-primary">Connect</span></span>
          </Link>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Register your Brand</h1>
          <p className="text-slate-500 mt-2">Join 1,500+ brands scaling with AI-powered marketing</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-200" />
        </div>

        <Card className="border-slate-200 shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {step === 1 && <><Building2 className="h-6 w-6 text-primary" /> Company Profile</>}
              {step === 2 && <><Mail className="h-6 w-6 text-primary" /> Account Details</>}
              {step === 3 && <><Star className="h-6 w-6 text-primary" /> Choose Your Plan</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your organization and industry."}
              {step === 2 && "The credentials you'll use to manage your campaigns."}
              {step === 3 && "Select the tier that best fits your marketing goals."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} className="rounded-xl h-11" />
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
                          <FormLabel className="font-bold">Company Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input placeholder="https://acme.com" {...field} className="pl-10 rounded-xl h-11" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Industry</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select Industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map(ind => (
                                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Team Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select Size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TEAM_SIZES.map(size => (
                                <SelectItem key={size} value={size}>{size} Employees</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Full Name (Primary Contact)</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="rounded-xl h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Work Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john@acme.com" {...field} className="rounded-xl h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input placeholder="+91 98765 43210" {...field} className="pl-10 rounded-xl h-11" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                              <Input type="password" placeholder="••••••••" {...field} className="pl-10 rounded-xl h-11" />
                            </div>
                          </FormControl>
                          <FormDescription>At least 8 characters with numbers and symbols.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            {PLANS.map((plan) => (
                              <FormItem key={plan.id}>
                                <FormControl>
                                  <RadioGroupItem value={plan.id} className="sr-only" />
                                </FormControl>
                                <FormLabel className={cn(
                                  "flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all hover:bg-slate-50",
                                  field.value === plan.id ? "border-primary bg-primary/5 shadow-md" : "border-slate-100"
                                )}>
                                  <div className="flex items-center gap-4 mb-4 md:mb-0">
                                    <div className={cn(
                                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                      field.value === plan.id ? "border-primary" : "border-slate-300"
                                    )}>
                                      {field.value === plan.id && <div className="h-3 w-3 rounded-full bg-primary" />}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-black text-lg">{plan.name}</p>
                                        {plan.popular && (
                                          <Badge className="bg-primary text-[10px] uppercase font-bold py-0">Recommended</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 font-medium">{plan.desc}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-slate-900">{plan.price}</p>
                                    <p className="text-xs font-bold text-primary">{plan.fee}</p>
                                  </div>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-between items-center pt-6 border-t mt-8">
                  {step > 1 ? (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={prevStep}
                      className="rounded-xl font-bold"
                      disabled={isLoading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  ) : (
                    <Link href="/auth/signup">
                      <Button type="button" variant="ghost" className="rounded-xl font-bold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    </Link>
                  )}

                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="rounded-xl font-bold px-8"
                    >
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="rounded-xl font-bold px-10 h-12 shadow-xl shadow-primary/20"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...</>
                      ) : (
                        "Create Account & Start Hiring"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t flex flex-col items-center py-6">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" /> Secure SSL Encryption
              <span className="text-slate-200">|</span>
              <Check className="h-3 w-3 text-green-500" /> Cancel Anytime
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
