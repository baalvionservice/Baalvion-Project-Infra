"use client";

import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  Globe,
  Pickaxe,
  Building2,
  Lock,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/monitoring";
import { useRouter } from "next/navigation";

const registerSchema = z.object({
  role: z.enum(["seller", "buyer"], { required_error: "Please select a role" }),
  companyName: z.string().min(3, "Company name must be at least 3 characters"),
  email: z.string().email("Please enter a valid business email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z
    .boolean()
    .refine(
      (val) => val === true,
      "You must agree to the terms and privacy policy"
    ),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "buyer",
      companyName: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    // Simulate API registration call
    await new Promise((r) => setTimeout(r, 1500));

    // Tracking conversion
    trackEvent("sign_up", {
      role: data.role,
      company_type: data.role === "seller" ? "Miner" : "Importer",
    });

    setIsSubmitting(false);

    toast({
      title: "Account Initialized",
      description: `Welcome ${data.companyName}! This is your dashboard where you can manage your profile, connect with partners, and access market insights.`,
    });
    router.push("/dashboard");
    form.reset();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 hidden lg:block">
            <h1 className="text-4xl font-headline font-bold text-primary">
              Join the Premier Global Trade Network
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Connect with 5,000+ verified industrial partners and access
              real-time market intelligence.
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified Ecosystem",
                  desc: "Every member passes Level 2 KYC verification.",
                },
                {
                  icon: Globe,
                  title: "150+ Countries",
                  desc: "Direct access to international mineral producers.",
                },
                {
                  icon: Pickaxe,
                  title: "Resource Tracking",
                  desc: "Integrated tools for production and logistics.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg h-fit">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b p-8 text-center">
              <CardTitle className="text-2xl font-bold text-primary">
                Create Business Account
              </CardTitle>
              <CardDescription>
                Select your primary platform role to begin onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              type="button"
                              variant={
                                field.value === "seller"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={cn(
                                "h-auto py-4 flex flex-col gap-2 border-slate-200",
                                field.value === "seller" &&
                                  "ring-2 ring-primary/20"
                              )}
                              onClick={() => form.setValue("role", "seller")}
                            >
                              <Pickaxe className="h-5 w-5" />
                              <span className="text-xs font-bold uppercase">
                                Mining / Seller
                              </span>
                            </Button>
                            <Button
                              type="button"
                              variant={
                                field.value === "buyer"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={cn(
                                "h-auto py-4 flex flex-col gap-2 border-slate-200",
                                field.value === "buyer" &&
                                  "ring-2 ring-primary/20"
                              )}
                              onClick={() => form.setValue("role", "buyer")}
                            >
                              <Building2 className="h-5 w-5" />
                              <span className="text-xs font-bold uppercase">
                                Buyer / Importer
                              </span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registered Company Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Atlas Mining Co."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="trade@company.com"
                              {...field}
                            />
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
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem className="inline-flex  items-center space-x-2 pt-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="flex flex-col">
                            <FormLabel className="text-xs text-slate-500 leading-tight">
                              I agree to the{" "}
                              <Link
                                href="/terms"
                                className="text-primary font-bold hover:underline"
                              >
                                Terms of Service
                              </Link>{" "}
                              and the{" "}
                              <Link
                                href="/privacy"
                                className="text-primary font-bold hover:underline"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </FormLabel>
                            <FormMessage className="text-xs mt-1" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      disabled={isSubmitting}
                      className="w-full bg-primary h-12 font-bold text-lg shadow-lg"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Initialize Onboarding"
                      )}
                    </Button>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="text-xs text-slate-400">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-primary font-bold hover:underline"
                      >
                        Sign In
                      </Link>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      <Lock className="h-3 w-3" /> Encrypted Connection
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
