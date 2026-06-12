'use client';
import { useState } from "react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  GraduationCap,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
type RegisterFormData = z.infer<typeof RegisterSchema>;

type AudienceKey = "candidate" | "recruiter" | "college" | "employee";

const audiences: {
  key: AudienceKey;
  icon: typeof Users;
  label: string;
  desc: string;
}[] = [
  { key: "candidate", icon: Users, label: "Candidate", desc: "Find roles & track applications" },
  { key: "recruiter", icon: Building2, label: "Recruiter / Employer", desc: "Hire global talent" },
  { key: "college", icon: GraduationCap, label: "College / University", desc: "Run campus placements" },
  { key: "employee", icon: ShieldCheck, label: "Team Member", desc: "Internal TalentOS access" },
];

const candidateBenefits = [
  "One profile, applications across every Baalvion role and country",
  "Real-time status on interviews, assessments and offers",
  "AI-matched recommendations based on your skills, not your location",
  "Direct pathway from internships and campus placements to full-time roles",
];

const requestAccessCopy: Record<Exclude<AudienceKey, "candidate">, { title: string; points: string[]; cta: string; href: string }> = {
  recruiter: {
    title: "Set up your hiring workspace",
    points: [
      "Post roles across countries with built-in compliance",
      "AI-screened, skill-scored candidate pipelines",
      "Verified campus talent across Type 1, 2 & 3 colleges",
    ],
    cta: "Request employer access",
    href: "/contact",
  },
  college: {
    title: "Onboard your placement cell",
    points: [
      "Verified student profiles & document checks",
      "Automated placement workflows and analytics",
      "Direct access to a global recruiter network",
    ],
    cta: "Start college onboarding",
    href: "/onboarding/college",
  },
  employee: {
    title: "Team member sign-in",
    points: [
      "Accounts are provisioned by your Baalvion administrator",
      "Use your issued work email to sign in",
      "Contact IT/People Ops if you need access",
    ],
    cta: "Go to sign in",
    href: "/login",
  },
};

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const { toast } = useToast();
  const [audience, setAudience] = useState<AudienceKey>("candidate");
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data.email, data.password, data.fullName);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const isCandidate = audience === "candidate";
  const access = !isCandidate ? requestAccessCopy[audience] : null;

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Brand / value panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-foreground text-background p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 10%, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-background/80 hover:text-background transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to jobs.baalvion.com
          </Link>
          <div className="mt-16 max-w-md">
            <Badge variant="secondary" className="mb-6">Join TalentOS</Badge>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Create your account on the global talent network.
            </h1>
            <p className="mt-6 text-lg text-background/70">
              Whether you&apos;re building a career, hiring a team, or placing a
              graduating class — onboarding takes minutes and scales worldwide.
            </p>
          </div>
        </div>
        <ul className="relative z-10 mt-12 space-y-3 max-w-md">
          {candidateBenefits.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm text-background/70">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-background/80" />
              {b}
            </li>
          ))}
        </ul>
        <p className="relative z-10 mt-12 text-sm text-background/60 max-w-md">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-background underline">Sign in</Link>
        </p>
      </aside>

      {/* Form / onboarding panel */}
      <main className="flex min-h-screen items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="h-4 w-4" /> Back to site
            </Link>
          </div>

          {/* Audience selector */}
          <div>
            <p className="text-sm font-medium text-foreground">I&apos;m joining as a…</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {audiences.map((a) => {
                const active = a.key === audience;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAudience(a.key)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-foreground/30"
                    )}
                  >
                    <a.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                    <p className="mt-2 text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="mt-6 border-0 shadow-none sm:border sm:shadow-sm">
            {isCandidate ? (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl">Create your candidate account</CardTitle>
                  <CardDescription>Track your applications, interviews and offers in one place.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="Jane Doe" autoComplete="name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="jane.doe@example.com" autoComplete="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create account
                      </Button>
                    </form>
                  </Form>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                  </p>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl">{access?.title}</CardTitle>
                  <CardDescription>
                    {audience === "employee"
                      ? "Team accounts are created by your administrator."
                      : "Tell us about your organization and our team will get you set up."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {access?.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full">
                    <Link href={access?.href ?? "/contact"}>
                      {access?.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {audience !== "employee" && (
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      Looking to recruit from campuses?{" "}
                      <Link href="/placement" className="font-medium text-primary hover:underline">See campus placements</Link>
                    </p>
                  )}
                </CardContent>
              </>
            )}
            <CardFooter className="flex-col items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Rocket className="h-3.5 w-3.5 text-primary" /> Explore before you commit
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/careers/open-positions" className="hover:text-foreground hover:underline">Open positions</Link>
                <Link href="/careers/internship-program" className="hover:text-foreground hover:underline">Internships</Link>
                <Link href="/about" className="hover:text-foreground hover:underline">About Baalvion</Link>
                <Link href="/faqs" className="hover:text-foreground hover:underline">FAQs</Link>
              </div>
            </CardFooter>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
