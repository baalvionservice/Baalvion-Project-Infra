"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, Loader2, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { trackEvent } from "@/lib/monitoring";
import { authApi } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid business email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    // Real authentication against the identity gateway (auth-service via /auth-bff).
    const result = await authApi.login({ email: data.email, password: data.password });
    setIsSubmitting(false);

    if (!result.ok) {
      toast({
        title: "Login failed",
        description: result.error.message || "Invalid email or password.",
        variant: "destructive",
      });
      return;
    }

    trackEvent('login', { method: 'password' });
    toast({
      title: "Session Initialized",
      description: "Welcome back to Baalvion Mining Inc.",
    });
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-primary text-white mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-headline font-bold text-slate-900 tracking-tight">Access Your Command Center</h1>
            <p className="text-slate-500 max-w-md mx-auto">
              Securely manage your global mineral trade portfolio and compliance vault.
            </p>
          </div>

          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="trade@company.com" className="h-12" {...field} />
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
                        <div className="flex justify-between items-center">
                          <FormLabel>Password</FormLabel>
                          <button type="button" className="text-[10px] font-bold text-primary uppercase hover:underline">Forgot Password?</button>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button disabled={isSubmitting} className="w-full bg-primary h-14 font-bold text-lg shadow-lg group">
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Sign In to Dashboard <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <div className="text-center pt-4">
                    <div className="text-sm text-slate-400">
                      New to the network? <Link href="/register" className="text-primary font-bold hover:underline">Apply for Onboarding</Link>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
                      <Lock className="h-3 w-3" /> Encrypted Session Active
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
