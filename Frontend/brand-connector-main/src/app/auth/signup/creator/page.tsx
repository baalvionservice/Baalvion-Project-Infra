
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Star, 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  Instagram, 
  Youtube, 
  Music2, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Camera,
  IndianRupee,
  Rocket
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
import { creatorSignupSchema } from '@/lib/validations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CREATOR_NICHES } from '@/constants';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type CreatorSignupValues = z.infer<typeof creatorSignupSchema>;

const STEPS = [
  { id: 1, title: 'Profile', icon: User },
  { id: 2, title: 'Socials', icon: Instagram },
  { id: 3, title: 'Niches', icon: Star },
  { id: 4, title: 'Rates', icon: IndianRupee },
];

export default function CreatorSignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const form = useForm<CreatorSignupValues>({
    resolver: zodResolver(creatorSignupSchema),
    defaultValues: {
      fullName: '',
      username: '',
      bio: '',
      email: '',
      password: '',
      socials: { instagram: false, youtube: false, tiktok: false },
      niches: [],
      rates: { instagram: '', youtube: '', tiktok: '' },
    },
  });

  const nextStep = async () => {
    let fields: any[] = [];
    if (step === 1) fields = ['fullName', 'username', 'bio', 'email', 'password'];
    if (step === 2) fields = ['socials'];
    if (step === 3) fields = ['niches'];
    
    const isValid = await form.trigger(fields as any);
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  async function onSubmit(values: CreatorSignupValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: values.fullName });
      
      // Send verification email
      await sendEmailVerification(user);

      const userProfileData = {
        id: user.uid,
        email: values.email,
        role: 'CREATOR',
        displayName: values.fullName,
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

      const creatorData = {
        id: `creator_${user.uid}`,
        userId: user.uid,
        username: values.username,
        bio: values.bio,
        niches: values.niches,
        photoURL: `https://picsum.photos/seed/${values.username}/200/200`,
        baseRates: values.rates,
        socialStats: {
          instagram: values.socials.instagram ? { connected: true } : { connected: false },
          youtube: values.socials.youtube ? { connected: true } : { connected: false },
          tiktok: values.socials.tiktok ? { connected: true } : { connected: false },
        },
        rating: 5.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDoc(doc(db!, 'creators', creatorData.id), creatorData).catch(async (err) => {
        errorEmitter.emitPermissionError(new FirestorePermissionError({
          path: `/creators/${creatorData.id}`,
          operation: 'create',
          requestResourceData: creatorData
        }));
      });

      toast({
        title: "Profile Created!",
        description: "Please verify your email to access the marketplace.",
      });

      router.push('/auth/verify-email');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center mb-6">
            <div className="bg-orange-600 p-2 rounded-xl mr-2">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight">Baalvion <span className="text-orange-600">Creator</span></span>
          </Link>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Join as a Creator</h1>
          <p className="text-slate-500 mt-2">Monetize your creativity and connect with top brands.</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  step === s.id ? "border-orange-600 bg-orange-50 text-orange-600 scale-110 shadow-md" : 
                  step > s.id ? "border-green-500 bg-green-50 text-green-500" : "border-slate-200 bg-white text-slate-400"
                )}>
                  {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  step === s.id ? "text-orange-600" : "text-slate-400"
                )}>{s.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-slate-200" />
        </div>

        <Card className="border-slate-200 shadow-2xl rounded-3xl overflow-hidden bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="pt-8">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative group cursor-pointer">
                          <div className="h-24 w-24 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-orange-600 transition-colors">
                            <Camera className="h-8 w-8 text-slate-400 group-hover:text-orange-600" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-1.5 rounded-lg shadow-lg">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Profile Photo</h3>
                          <p className="text-xs text-slate-500">Upload a professional photo to stand out to brands.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Smith" {...field} className="rounded-xl h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input placeholder="jane_creates" {...field} className="pl-10 rounded-xl h-11" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold">Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your creative journey..." 
                                className="rounded-xl min-h-[100px] resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Describe your style and audience in under 160 characters.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Email</FormLabel>
                              <FormControl>
                                <Input placeholder="jane@example.com" {...field} className="rounded-xl h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold">Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} className="rounded-xl h-11" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-xl font-bold">Connect Your Reach</h3>
                        <p className="text-sm text-slate-500">We use these to verify your engagement data.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'hover:bg-pink-50 hover:border-pink-200' },
                          { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'hover:bg-red-50 hover:border-red-200' },
                          { id: 'tiktok', name: 'TikTok', icon: Music2, color: 'hover:bg-slate-50 hover:border-slate-200' },
                        ].map((plat) => (
                          <FormField
                            key={plat.id}
                            control={form.control}
                            name={`socials.${plat.id}` as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between space-y-0 p-6 rounded-2xl border-2 transition-all cursor-pointer bg-white hover:shadow-lg">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <plat.icon className="h-6 w-6 text-slate-600" />
                                  </div>
                                  <div>
                                    <FormLabel className="text-lg font-bold cursor-pointer">{plat.name}</FormLabel>
                                    <p className="text-xs text-slate-400 font-medium">Verify your {plat.name} audience</p>
                                  </div>
                                </div>
                                <FormControl>
                                  <div className="flex items-center gap-3">
                                    <Button 
                                      type="button" 
                                      variant={field.value ? "secondary" : "outline"}
                                      className={cn(
                                        "rounded-xl font-bold h-10 px-6",
                                        field.value && "bg-green-100 text-green-600 hover:bg-green-200 border-none"
                                      )}
                                      onClick={() => field.onChange(!field.value)}
                                    >
                                      {field.value ? "Connected" : "Connect"}
                                    </Button>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-xl font-bold">Select Your Niches</h3>
                        <p className="text-sm text-slate-500">Pick up to 5 categories that define your content.</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="niches"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {CREATOR_NICHES.slice(0, 18).map((niche) => (
                                <FormItem
                                  key={niche}
                                  className={cn(
                                    "flex items-center space-x-3 space-y-0 p-3 rounded-xl border transition-all cursor-pointer",
                                    field.value?.includes(niche) ? "border-orange-600 bg-orange-50 shadow-sm" : "border-slate-100 hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    const current = field.value || [];
                                    if (current.includes(niche)) {
                                      field.onChange(current.filter(v => v !== niche));
                                    } else if (current.length < 5) {
                                      field.onChange([...current, niche]);
                                    } else {
                                      toast({ variant: "destructive", title: "Limit reached", description: "You can select up to 5 niches." });
                                    }
                                  }}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(niche)}
                                      className="sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-bold cursor-pointer">{niche}</FormLabel>
                                </FormItem>
                              ))}
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2 min-h-[32px]">
                              {field.value.map(n => (
                                <Badge key={n} className="bg-orange-600">
                                  {n} <span className="ml-1 cursor-pointer" onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange(field.value.filter(v => v !== n));
                                  }}>×</span>
                                </Badge>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="text-center mb-8">
                        <h3 className="text-xl font-bold">Set Your Base Rates</h3>
                        <p className="text-sm text-slate-500">Provide an estimated starting rate for basic deliverables.</p>
                      </div>

                      <div className="space-y-6">
                        {form.getValues('socials').instagram && (
                          <FormField
                            control={form.control}
                            name="rates.instagram"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 font-bold">
                                  <Instagram className="h-4 w-4 text-pink-600" /> Instagram Reel / Post
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input placeholder="5,000" {...field} className="pl-10 rounded-xl h-11" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {form.getValues('socials').youtube && (
                          <FormField
                            control={form.control}
                            name="rates.youtube"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 font-bold">
                                  <Youtube className="h-4 w-4 text-red-600" /> YouTube Dedicated Video
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input placeholder="15,000" {...field} className="pl-10 rounded-xl h-11" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {form.getValues('socials').tiktok && (
                          <FormField
                            control={form.control}
                            name="rates.tiktok"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 font-bold">
                                  <Music2 className="h-4 w-4 text-slate-900" /> TikTok Video
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input placeholder="8,000" {...field} className="pl-10 rounded-xl h-11" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>

              <CardFooter className="flex justify-between items-center py-8 px-8 bg-slate-50/50 border-t mt-8">
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

                {step < 4 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="rounded-xl font-bold px-8 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="rounded-xl font-bold px-10 h-12 shadow-xl bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Launching Profile...</>
                    ) : (
                      "Complete Setup & Discover Jobs"
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
