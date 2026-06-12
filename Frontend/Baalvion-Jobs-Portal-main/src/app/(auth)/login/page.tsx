'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { LoginFormData, LoginSchema } from "@/types/auth.types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  ShieldCheck,
  Globe,
  GraduationCap,
  Building2,
  Users,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import Link from "next/link";

const audiences = [
  { icon: Users, label: "Candidates", desc: "Track applications, interviews and offers." },
  { icon: Building2, label: "Recruiters & Employers", desc: "Manage pipelines and hire faster." },
  { icon: GraduationCap, label: "Colleges", desc: "Run verified campus placements." },
  { icon: ShieldCheck, label: "Team Members", desc: "Operate the TalentOS workspace." },
];

const trustPoints = [
  { icon: ShieldCheck, text: "Enterprise-grade security & encrypted sessions" },
  { icon: Globe, text: "One identity across the global Baalvion ecosystem" },
  { icon: Sparkles, text: "AI-assisted matching from the moment you sign in" },
];

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data.email, data.password);
  };

  // Real demo accounts (auth-service). Password for all: Passw0rd!23
  const mockUsers = [
    { role: "Admin", email: "jobs-admin@baalvion.test" },
    { role: "Recruiter", email: "jobs-recruiter@baalvion.test" },
    { role: "Candidate", email: "jobs-candidate@baalvion.test" },
  ];
  const DEMO_PASSWORD = "Passw0rd!23";

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Brand / onboarding panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground text-background p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-background/80 hover:text-background transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to jobs.baalvion.com
          </Link>
          <div className="mt-16 max-w-md">
            <Badge variant="secondary" className="mb-6">TalentOS by Baalvion</Badge>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              One login for the world&apos;s talent network.
            </h1>
            <p className="mt-6 text-lg text-background/70">
              Sign in to the intelligent infrastructure that connects exceptional
              talent with borderless opportunity — built for candidates,
              recruiters, colleges, and teams.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid grid-cols-2 gap-4 max-w-md">
          {audiences.map((a) => (
            <div key={a.label} className="rounded-lg border border-background/15 bg-background/5 p-4">
              <a.icon className="h-5 w-5 text-background/80" />
              <p className="mt-3 font-semibold text-sm">{a.label}</p>
              <p className="mt-1 text-xs text-background/60">{a.desc}</p>
            </div>
          ))}
        </div>

        <ul className="relative z-10 mt-12 space-y-3 max-w-md">
          {trustPoints.map((t) => (
            <li key={t.text} className="flex items-center gap-3 text-sm text-background/70">
              <t.icon className="h-4 w-4 shrink-0 text-background/80" />
              {t.text}
            </li>
          ))}
        </ul>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your Baalvion account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@company.com" autoComplete="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link href="/contact" className="text-xs font-medium text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl><Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                New candidate?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </p>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Hiring or running campus placements?{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  Request employer / college access
                </Link>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch border-t pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Demo logins
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Password for all demo accounts: <span className="font-mono font-medium text-foreground">Passw0rd!23</span>
              </p>
              <ul className="mt-3 space-y-1">
                {mockUsers.map((user) => (
                  <li key={user.email} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{user.role}</span>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs sm:text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        form.setValue("email", user.email);
                        form.setValue("password", DEMO_PASSWORD);
                      }}
                    >
                      {user.email}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardFooter>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
